import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { TokenService } from './token.service';
import { SignupService } from './signup.service';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UserRepo } from '@docmost/db/repos/user/user.repo';
import {
  comparePasswordHash,
  hashPassword,
  nanoIdGen,
} from '../../../common/helpers';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { MailService } from '../../../integrations/mail/mail.service';
import ChangePasswordEmail from '@docmost/transactional/emails/change-password-email';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import ForgotPasswordEmail from '@docmost/transactional/emails/forgot-password-email';
import { UserTokenRepo } from '@docmost/db/repos/user-token/user-token.repo';
import { PasswordResetDto } from '../dto/password-reset.dto';
import { UserToken, Workspace } from '@docmost/db/types/entity.types';
import { UserTokenType } from '../auth.constants';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import { InjectKysely } from 'nestjs-kysely';
import { executeTx } from '@docmost/db/utils';
import { VerifyUserTokenDto } from '../dto/verify-user-token.dto';
import { EnvironmentService } from 'src/integrations/environment/environment.service';
import { WorkspaceRepo } from '@docmost/db/repos/workspace/workspace.repo';
import { DiscordRedirectDto } from '../dto/discord-redirect.dto';
import { GroupUserRepo } from '@docmost/db/repos/group/group-user.repo';
import { WorkspaceService } from 'src/core/workspace/services/workspace.service';
import { UpdateDiscordConfigDto } from '../dto/discord-update-config.dto';
import { DiscordConfigDto } from '../dto/discord-config.dto';
import { DiscordStrategy } from '../strategies/discord.strategy';

@Injectable()
export class AuthService {
  constructor(
    private signupService: SignupService,
    private tokenService: TokenService,
    private userRepo: UserRepo,
    private userTokenRepo: UserTokenRepo,
    private mailService: MailService,
    private workspaceRepo: WorkspaceRepo,
    private environmentService: EnvironmentService,
    private workspaceService: WorkspaceService,
    private groupUserRepo: GroupUserRepo,
    @InjectKysely() private readonly db: KyselyDB,
  ) { }

  async login(loginDto: LoginDto, workspaceId: string) {
    const user = await this.userRepo.findByEmail(
      loginDto.email,
      workspaceId,
      true,
    );

    if (
      !user ||
      !(await comparePasswordHash(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('email or password does not match');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.updateLastLogin(user.id, workspaceId);

    return this.tokenService.generateAccessToken(user);
  }

  async register(createUserDto: CreateUserDto, workspaceId: string) {
    const user = await this.signupService.signup(createUserDto, workspaceId);
    return this.tokenService.generateAccessToken(user);
  }

  async setup(createAdminUserDto: CreateAdminUserDto) {
    const user = await this.signupService.initialSetup(createAdminUserDto);
    return this.tokenService.generateAccessToken(user);
  }

  async changePassword(
    dto: ChangePasswordDto,
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const user = await this.userRepo.findById(userId, workspaceId, {
      includePassword: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comparePasswords = await comparePasswordHash(
      dto.oldPassword,
      user.password,
    );

    if (!comparePasswords) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);
    await this.userRepo.updateUser(
      {
        password: newPasswordHash,
      },
      userId,
      workspaceId,
    );

    const emailTemplate = ChangePasswordEmail({ username: user.name });
    await this.mailService.sendToQueue({
      to: user.email,
      subject: 'Your password has been changed',
      template: emailTemplate,
    });
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    workspaceId: string,
  ): Promise<void> {
    const user = await this.userRepo.findByEmail(
      forgotPasswordDto.email,
      workspaceId,
    );

    if (!user) {
      return;
    }

    const token = nanoIdGen(16);
    const resetLink = `${this.environmentService.getAppUrl()}/password-reset?token=${token}`;

    await this.userTokenRepo.insertUserToken({
      token: token,
      userId: user.id,
      workspaceId: user.workspaceId,
      expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour
      type: UserTokenType.FORGOT_PASSWORD,
    });

    const emailTemplate = ForgotPasswordEmail({
      username: user.name,
      resetLink: resetLink,
    });

    await this.mailService.sendToQueue({
      to: user.email,
      subject: 'Reset your password',
      template: emailTemplate,
    });
  }

  async passwordReset(passwordResetDto: PasswordResetDto, workspaceId: string) {
    const userToken = await this.userTokenRepo.findById(
      passwordResetDto.token,
      workspaceId,
    );

    if (
      !userToken ||
      userToken.type !== UserTokenType.FORGOT_PASSWORD ||
      userToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepo.findById(userToken.userId, workspaceId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPasswordHash = await hashPassword(passwordResetDto.newPassword);

    await executeTx(this.db, async (trx) => {
      await this.userRepo.updateUser(
        {
          password: newPasswordHash,
        },
        user.id,
        workspaceId,
        trx,
      );

      await trx
        .deleteFrom('userTokens')
        .where('userId', '=', user.id)
        .where('type', '=', UserTokenType.FORGOT_PASSWORD)
        .execute();
    });

    const emailTemplate = ChangePasswordEmail({ username: user.name });
    await this.mailService.sendToQueue({
      to: user.email,
      subject: 'Your password has been changed',
      template: emailTemplate,
    });

    return this.tokenService.generateAccessToken(user);
  }

  async verifyUserToken(
    userTokenDto: VerifyUserTokenDto,
    workspaceId: string,
  ): Promise<void> {
    const userToken = await this.userTokenRepo.findById(
      userTokenDto.token,
      workspaceId,
    );

    if (
      !userToken ||
      userToken.type !== userTokenDto.type ||
      userToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async getCollabToken(userId: string, workspaceId: string) {
    const token = await this.tokenService.generateCollabToken(
      userId,
      workspaceId,
    );
    return { token };
  }

  async discordLogin(authInfo: {
    accessToken: string;
    refreshToken: string;
    profile: any;
    workspaceId: string;
  }) {
    const workspace_id = authInfo.workspaceId;
    const workspace = await this.workspaceRepo.findById(workspace_id);
    if (!workspace ||
      !workspace.discordEnabled ||
      !workspace.discordJitEnabled ||
      !workspace.discordClientId ||
      !workspace.discordClientSecret
    ) {
      throw new UnauthorizedException();
    }

    try {
      const discordUser = authInfo.profile;
      if (!discordUser.email) {
        throw new UnauthorizedException();
      }

      // Check if user is a member of the specified guild
      const guildMemberResponse = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${workspace.discordGuildId}/member`,
        {
          headers: {
            Authorization: `Bearer ${authInfo.accessToken}`,
          },
        }
      );

      if (!guildMemberResponse.ok) {
        throw new UnauthorizedException('User is not a member of the required Discord server');
      }

      const guildMember = await guildMemberResponse.json();

      const user = await this.userRepo.findByDiscordId(discordUser.id, workspace.id);
      if (!user) {
        if (workspace.discordJitEnabled) {
          const avatarUrl = this.getDiscordAvatarUrl(discordUser.id, discordUser.avatar, { size: 256 }, workspace.discordGuildId, guildMember.avatar);
          const user = await this.userRepo.insertUser({
            name: discordUser.username,
            email: discordUser.email,
            workspaceId: workspace.id,
            password: "",
            emailVerifiedAt: new Date(),
            locale: 'en-US',
            discordId: discordUser.id,
            avatarUrl: avatarUrl,
          });
          console.log("added user", user);
          await this.workspaceService.addUserToWorkspace(user.id, workspace.id);
          await this.groupUserRepo.addUserToDefaultGroup(user.id, workspace.id);

          return this.tokenService.generateAccessToken(user);
        }
        console.error('could not find user');
        throw new UnauthorizedException();
      }
      console.log(user);

      // Update Discord information if user exists
      await this.userRepo.updateUser(
        {
          discordId: discordUser.id,
          avatarUrl: this.getDiscordAvatarUrl(discordUser.id, discordUser.avatar, { size: 256 }, workspace.discordGuildId, guildMember.avatar),
        },
        user.id,
        workspace.id
      );
      return this.tokenService.generateAccessToken(user);
    } catch (error) {
      throw new UnauthorizedException('Failed to authenticate with Discord');
    }
  }

  async discordLoginWithPendingUser(authInfo: {
    accessToken: string;
    refreshToken: string;
    profile: any;
    workspaceId: string;
  }): Promise<{
    type: 'existing';
    token: string;
  } | {
    type: 'new';
    pendingUser: any;
  }> {
    const workspace = await this.workspaceRepo.findById(authInfo.workspaceId);
    if (!workspace ||
      !workspace.discordEnabled ||
      !workspace.discordJitEnabled ||
      !workspace.discordClientId ||
      !workspace.discordClientSecret
    ) {
      throw new UnauthorizedException();
    }

    try {
      const discordUser = authInfo.profile;
      if (!discordUser.email) {
        throw new UnauthorizedException();
      }

      // existing user
      const existingUser = await this.userRepo.findByDiscordId(discordUser.id, workspace.id);
      if (existingUser) {
        const token = await this.tokenService.generateAccessToken(existingUser);
        return {
          type: 'existing',
          token
        };
      }

      // new user
      const guildMemberResponse = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${workspace.discordGuildId}/member`,
        {
          headers: {
            Authorization: `Bearer ${authInfo.accessToken}`,
          },
        }
      );

      if (!guildMemberResponse.ok) {
        throw new UnauthorizedException('User is not a member of the required Discord server');
      }
      const guildMember = await guildMemberResponse.json();
      return {
        type: 'new',
        pendingUser: {
          name: discordUser.username,
          email: discordUser.email,
          workspaceId: workspace.id,
          discordId: discordUser.id,
          avatarUrl: this.getDiscordAvatarUrl(discordUser.id, discordUser.avatar, { size: 256 }, workspace.discordGuildId, guildMember.avatar)
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to authenticate with Discord');
    }
  }

  async completeDiscordLogin(pendingUser: any, password: string): Promise<string> {

    const user = await this.userRepo.insertUser({
      ...pendingUser,
      password: password,
      emailVerifiedAt: new Date(),
      locale: 'en-US'
    });

    await this.workspaceService.addUserToWorkspace(user.id, pendingUser.workspaceId);
    await this.groupUserRepo.addUserToDefaultGroup(user.id, pendingUser.workspaceId);

    return this.tokenService.generateAccessToken(user);
  }

  async updateDiscordConfig(
    dto: UpdateDiscordConfigDto,
    workspaceId: string,
  ): Promise<DiscordConfigDto> {
    const workspace = await this.workspaceRepo.findById(workspaceId);

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const updateData: Partial<Workspace> = {};

    if (dto.enabled !== undefined) {
      updateData.discordEnabled = dto.enabled;
    }

    if (dto.clientId) {
      updateData.discordClientId = dto.clientId;
    }

    if (dto.clientSecret) {
      updateData.discordClientSecret = dto.clientSecret;
    }

    if (dto.guildId) {
      updateData.discordGuildId = dto.guildId;
    }

    // if (dto.requiredRoleId) {
    //   updateData.discordRequiredRoleId = dto.requiredRoleId;
    // }

    if (dto.jitEnabled !== undefined) {
      updateData.discordJitEnabled = dto.jitEnabled;
    }

    await this.workspaceRepo.updateWorkspace(updateData, workspaceId);

    const updatedWorkspace = await this.workspaceRepo.findById(workspaceId);

    return {
      enabled: updatedWorkspace.discordEnabled,
      clientId: updatedWorkspace.discordClientId,
      clientSecret: updatedWorkspace.discordClientSecret,
      guildId: updatedWorkspace.discordGuildId,
      // requiredRoleId: updatedWorkspace.discordRequiredRoleId,
      jitEnabled: updatedWorkspace.discordJitEnabled,
    };
  }

  getDiscordAvatarUrl(
    userId: string,
    avatarHash?: string,
    options: { size?: number; format?: string; dynamic?: boolean } = {},
    guildId?: string,
    guildAvatarHash?: string
  ) {
    const { size = 256, format = 'png', dynamic = true } = options;

    if (size < 16 || size > 4096 || !Number.isInteger(size)) {
      throw new Error('Size must be an integer between 16 and 4096');
    }

    const baseUrl = 'https://cdn.discordapp.com';
    const getFileFormat = (hash: string) =>
      dynamic && hash.startsWith('a_') && format !== 'gif' ? 'gif' : format;

    if (guildId && guildAvatarHash) {
      const fileFormat = getFileFormat(guildAvatarHash);
      return `${baseUrl}/guilds/${guildId}/users/${userId}/avatars/${guildAvatarHash}.${fileFormat}?size=${size}`;
    }

    if (!avatarHash) {
      const defaultNumber = Number(BigInt(userId) >> 22n) % 6;
      return `${baseUrl}/embed/avatars/${defaultNumber}.png?size=${size}`;
    }

    const fileFormat = getFileFormat(avatarHash);
    return `${baseUrl}/avatars/${userId}/${avatarHash}.${fileFormat}?size=${size}`;
  }
}
