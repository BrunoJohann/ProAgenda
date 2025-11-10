import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateFilialDto {
  @ApiProperty({ example: 'Centro' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'centro', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Main downtown location', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  @IsString()
  timezone: string;

  @ApiProperty({ example: 'Rua das Flores, 123', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+5511999999999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

