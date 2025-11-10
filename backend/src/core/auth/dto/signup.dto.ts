import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  tenantName: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  tenantSlug: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+5511999999999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}

