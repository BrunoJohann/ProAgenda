import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsISO8601, IsOptional } from 'class-validator';

export class CreateCustomerAppointmentDto {
  @ApiProperty({ example: 'filial-id-here' })
  @IsString()
  filialId: string;

  @ApiProperty({ example: ['service-id-1', 'service-id-2'] })
  @IsArray()
  @IsString({ each: true })
  serviceIds: string[];

  @ApiProperty({ example: '2025-11-10' })
  @IsString()
  date: string;

  @ApiProperty({ example: '2025-11-10T14:00:00Z' })
  @IsISO8601()
  start: string;

  @ApiProperty({ example: 'professional-id-here', required: false })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ example: 'Customer notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
