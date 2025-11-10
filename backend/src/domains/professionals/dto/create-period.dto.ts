import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class CreatePeriodDto {
  @ApiProperty({ example: 1, description: 'Weekday (0=Sunday, 6=Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @ApiProperty({ example: 540, description: 'Start time in minutes from midnight (9:00 AM = 540)' })
  @IsInt()
  @Min(0)
  @Max(1439)
  startMinutes: number;

  @ApiProperty({ example: 1080, description: 'End time in minutes from midnight (6:00 PM = 1080)' })
  @IsInt()
  @Min(0)
  @Max(1440)
  endMinutes: number;
}

