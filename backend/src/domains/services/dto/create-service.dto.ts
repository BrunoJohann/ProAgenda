import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte de Cabelo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ example: 10, description: 'Buffer time in minutes', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferMinutes?: number;

  @ApiProperty({ example: 5000, description: 'Price in cents' })
  @IsInt()
  @Min(0)
  priceCents: number;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

