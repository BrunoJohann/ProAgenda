import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsString, IsOptional } from 'class-validator';

export class CreateBlockDto {
  @ApiProperty({ example: '2025-11-10T14:00:00Z' })
  @IsISO8601()
  startsAt: string;

  @ApiProperty({ example: '2025-11-10T16:00:00Z' })
  @IsISO8601()
  endsAt: string;

  @ApiProperty({ example: 'Lunch break', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

