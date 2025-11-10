import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, Min, Max, IsOptional } from 'class-validator';

export class InviteDto {
  @ApiProperty({ example: 'professional@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 72, description: 'Invitation expiry in hours', default: 72 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  expiresInHours?: number;
}

