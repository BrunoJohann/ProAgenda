import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ 
    example: 15, 
    description: 'Slot granularity in minutes (5, 10, 15, 20, 30, or 60). Must be a divisor of 60.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  slotGranularity?: number | null;
}

