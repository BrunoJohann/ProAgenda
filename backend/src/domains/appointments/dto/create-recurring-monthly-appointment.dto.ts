import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewCustomerDto } from './create-internal-appointment.dto';

export class CreateRecurringMonthlyAppointmentDto {
  @ApiProperty({ example: 'filial-id-here' })
  @IsString()
  filialId: string;

  @ApiProperty({ example: ['service-id-1', 'service-id-2'] })
  @IsArray()
  @IsString({ each: true })
  serviceIds: string[];

  @ApiProperty({ example: '2026-04', description: 'Target month in YYYY-MM format' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;

  @ApiProperty({ example: 4, description: 'Weekday using JavaScript convention: 0=Sunday ... 6=Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @ApiProperty({ example: '17:30', description: 'Start time in HH:mm' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ example: 'professional-id-here', required: false })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty({ example: 'customer-id-here', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ type: NewCustomerDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewCustomerDto)
  newCustomer?: NewCustomerDto;

  @ApiProperty({ example: 'Recurring appointment notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
