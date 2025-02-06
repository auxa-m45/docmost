// discord.guard.ts
import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';

@Injectable()
export class DiscordAuthGuard extends AuthGuard('discord') {
    constructor(
        private authService: AuthService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // const activate = (await super.canActivate(context)) as boolean;
        // const request = context.switchToHttp().getRequest();
        // await super.logIn(request);
        // return activate;
        const result = await super.canActivate(context);
        const request = context.switchToHttp().getRequest();

        if (!result || !request.user) {
            throw new UnauthorizedException('Authentication failed');
        }

        if (request.user) {
            request.discordAuthInfo = {
                accessToken: request.user.accessToken,
                refreshToken: request.user.refreshToken,
                profile: request.user.profile,
                workspaceId: request.user.workspaceId
            };
        }

        return result === true;
    } catch(error) {
        if (error.message.includes('redirect_uri')) {
            throw new UnauthorizedException('Invalid redirect URI configuration');
        }

        if (error.message.includes('state')) {
            throw new UnauthorizedException('Invalid state parameter');
        }
        throw error;
    }

    // customizing the handling of authentication information by overriding the handleRequest method
    handleRequest(err: any, user: any, info: any, context: any, status?: any) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}