import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Patch,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './services/auth.service';
import { SetupGuard } from './guards/setup.guard';
import { EnvironmentService } from '../../integrations/environment/environment.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { VerifyUserTokenDto } from './dto/verify-user-token.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { addDays } from 'date-fns';
import { DiscordAuthGuard } from './guards/discord.guard';
import { DiscordRedirectDto } from './dto/discord-redirect.dto';
import { DiscordConfigDto } from './dto/discord-config.dto';
import { UserRole } from 'src/common/helpers/types/permission';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private environmentService: EnvironmentService,
  ) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Req() req,
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() loginInput: LoginDto,
  ) {
    const authToken = await this.authService.login(
      loginInput,
      req.raw.workspaceId,
    );
    this.setAuthCookie(res, authToken);
  }

  @Get('discord')
  @UseGuards(DiscordAuthGuard)
  async discordAuth(
    @Query('workspace_id') workspaceId?: string,
  ) {

  }
  
  @Get('discord/callback')
  @UseGuards(DiscordAuthGuard)
  async discordAuthCallback(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const authInfo = (req as any).discordAuthInfo;
    if (!authInfo) {
      throw new UnauthorizedException('Authentication information not found');
    }

    const result = await this.authService.discordLoginWithPendingUser(authInfo);
    const redirectUrl = this.environmentService.getFrontendUrl();

    if (result.type === 'existing') {
      this.setAuthCookie(res, result.token);
      return res.status(302).redirect(`${redirectUrl}`);

    }

    const pendingUserData = encodeURIComponent(JSON.stringify(result.pendingUser));
    return res.status(302).redirect(`${redirectUrl}/discord-setup?data=${pendingUserData}`);
  }

  @HttpCode(HttpStatus.OK)
  @Post('discord/complete-setup')
  async completeDiscordSetup(
    @Body() data: { pendingUser: any; password: string },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const token = await this.authService.completeDiscordLogin(
      data.pendingUser,
      data.password
    );
    this.setAuthCookie(res, token);
  }

  @Get('discord-config')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async discordConfig(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<DiscordConfigDto> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new UnauthorizedException();
    }
    return {
      enabled: workspace.discordEnabled,
      clientId: workspace.discordClientId,
      clientSecret: workspace.discordClientSecret,
      guildId: workspace.discordGuildId,
      jitEnabled: workspace.discordJitEnabled,
    }
  }

  @Patch('discord-config')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateDiscordConfig(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
    @Body() dto: DiscordConfigDto,
  ): Promise<DiscordConfigDto> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new UnauthorizedException();
    }
    return this.authService.updateDiscordConfig(dto, workspace.id);
  }

  @UseGuards(SetupGuard)
  @HttpCode(HttpStatus.OK)
  @Post('setup')
  async setupWorkspace(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() createAdminUserDto: CreateAdminUserDto,
  ) {
    if (this.environmentService.isCloud()) throw new NotFoundException();

    const authToken = await this.authService.setup(createAdminUserDto);
    this.setAuthCookie(res, authToken);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.authService.changePassword(dto, user.id, workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto, workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('password-reset')
  async passwordReset(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() passwordResetDto: PasswordResetDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    const authToken = await this.authService.passwordReset(
      passwordResetDto,
      workspace.id,
    );
    this.setAuthCookie(res, authToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-token')
  async verifyResetToken(
    @Body() verifyUserTokenDto: VerifyUserTokenDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.authService.verifyUserToken(verifyUserTokenDto, workspace.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('collab-token')
  async collabToken(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.authService.getCollabToken(user.id, workspace.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie('authToken');
  }

  setAuthCookie(res: FastifyReply, token: string) {
    res.setCookie('authToken', token, {
      httpOnly: true,
      path: '/',
      expires: addDays(new Date(), 30),
      secure: this.environmentService.isHttps(),
    });
  }
}
