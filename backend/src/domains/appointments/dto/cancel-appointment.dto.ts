import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty({ example: 'Customer requested cancellation', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

