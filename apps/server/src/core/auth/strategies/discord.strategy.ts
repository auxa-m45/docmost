import { WorkspaceRepo } from '@docmost/db/repos/workspace/workspace.repo';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { EnvironmentService } from 'src/integrations/environment/environment.service';

import * as crypto from 'crypto';

interface StateData {
    workspaceId: string;
    nonce: string;
    timestamp: number;
}

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
    private readonly stateEncryptionKey: Buffer;
    private readonly stateEncryptionIV: Buffer;
    redirect: (url: string) => void;
    constructor(
        private readonly environmentService: EnvironmentService,
        private workspaceRepo: WorkspaceRepo,
    ) {
        super({
            clientID: 'DUMMY_CLIENT_ID',
            clientSecret: 'DUMMY_CLIENT_SECRET',
            callbackURL: `${environmentService.getFrontendUrl()}/api/auth/discord/callback`,
            scope: ['identify', 'email', 'guilds', 'guilds.members.read'],
            passReqToCallback: true,
            state: false,
        });
        this.stateEncryptionKey = Buffer.from(environmentService.getStateEncryptionKey(), 'hex');
        this.stateEncryptionIV = Buffer.from(environmentService.getStateEncryptionIV(), 'hex');
    }

    private encryptState(data: StateData): string {
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            this.stateEncryptionKey,
            this.stateEncryptionIV
        );
        const jsonData = JSON.stringify(data);
        const encrypted = cipher.update(jsonData, 'utf8', 'base64');
        return encrypted + cipher.final('base64');
    }

    private decryptState(encryptedState: string): StateData {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                this.stateEncryptionKey,
                this.stateEncryptionIV
            );
            const decrypted = decipher.update(encryptedState, 'base64', 'utf8');
            const jsonData = decrypted + decipher.final('utf8');
            const data = JSON.parse(jsonData) as StateData;

            // state expires after 30 minutes
            if (Date.now() - data.timestamp > 30 * 60 * 1000) {
                throw new Error('State has expired');
            }

            return data;
        } catch (error) {
            throw new Error('Invalid state parameter');
        }
    }

    async validate(req: any, accessToken: string, refreshToken: string, profile: any) {
        try {
            if (!req.query.state) {
                throw new Error('Missing state parameter');
            }
            const stateData = this.decryptState(req.query.state);
            return {
                accessToken,
                refreshToken,
                profile,
                workspaceId: stateData.workspaceId
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid authentication state');
        }
    }

    async authenticate(req: any, options?: any) {
        try {
            // only support one workspace for now
            const workspace = await this.workspaceRepo.findFirst();

            if (!workspace?.discordEnabled || !workspace?.discordClientId || !workspace?.discordClientSecret) {
                throw new UnauthorizedException('Discord not configured');
            }

            // set client ID and secret
            const oauth2 = (this as any)._oauth2;
            oauth2._clientId = workspace.discordClientId;
            oauth2._clientSecret = workspace.discordClientSecret;
            oauth2._redirectUri = `${this.environmentService.getAppUrl()}/api/auth/discord/callback`;

            const stateData: StateData = {
                workspaceId: workspace.id,
                nonce: crypto.randomBytes(16).toString('hex'),
                timestamp: Date.now(),
            };

            this.redirect = function (url: string) {
                const res = req.raw.client._httpMessage;
                if (res) {
                    res.statusCode = 302;
                    res.setHeader('Location', url);
                    res.end();
                } else {
                    throw new Error('Unable to perform redirect - no response object');
                }
            };

            options = {
                ...options,
                state: this.encryptState(stateData),
            };

            return super.authenticate(req, options);
        } catch (error) {
            throw new UnauthorizedException(error);
        }
    }
}