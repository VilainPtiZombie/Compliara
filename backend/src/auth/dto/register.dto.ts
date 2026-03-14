import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserProfile } from '@prisma/client';

export class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  tenantName: string;

  @IsEnum(UserProfile)
  @IsOptional()
  profile?: UserProfile;
}
