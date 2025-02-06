import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class DiscordRedirectDto {
    @IsNotEmpty()
    @IsString()
    code: string;

    @IsString()
    @IsOptional()
    state?: string;
}