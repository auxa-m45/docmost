import { IsBoolean, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class DiscordConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsString()
  @IsOptional()
  guildId?: string;

  @IsBoolean()
  @IsOptional()
  jitEnabled?: boolean;
}
