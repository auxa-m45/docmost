import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateDiscordConfigDto {
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
  
    @IsString()
    @IsOptional()
    clientId?: string;
  
    @IsString()
    @IsOptional()
    clientSecret?: string;
  
    @IsString()
    @IsOptional()
    guildId?: string;
  
    @IsString()
    @IsOptional()
    requiredRoleId?: string;
  
    @IsBoolean()
    @IsOptional()
    jitEnabled?: boolean;
  }
  