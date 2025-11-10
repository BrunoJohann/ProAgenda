import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Dr. João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Experienced barber with 10+ years', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'Haircut, Beard, Styling', required: false })
  @IsOptional()
  @IsString()
  specialties?: string;

  @ApiProperty({ example: 'America/Sao_Paulo', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

