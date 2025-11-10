import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsISO8601, IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'joao@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateAppointmentDto {
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

  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ example: 'Customer notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

