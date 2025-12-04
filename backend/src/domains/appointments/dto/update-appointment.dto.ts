import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsISO8601, IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NewCustomerDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+5511999999999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'joao@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '12345678900', required: false })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ example: 'CPF', required: false })
  @IsOptional()
  @IsString()
  documentType?: string;
}

export class UpdateAppointmentDto {
  @ApiProperty({ example: '2025-11-10', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: '2025-11-10T14:00:00Z', required: false })
  @IsOptional()
  @IsISO8601()
  start?: string;

  @ApiProperty({ example: ['service-id-1', 'service-id-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

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

  @ApiProperty({ example: 'Customer notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}



