import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const PHONE_TYPES = ['WHATSAPP', 'MOBILE', 'HOME', 'WORK'] as const;
type PhoneType = typeof PHONE_TYPES[number];

class CustomerPhoneDto {
  @ApiProperty({ example: '+5511999998888' })
  @IsString()
  phone: string;

  @ApiProperty({ enum: PHONE_TYPES, example: 'WHATSAPP' })
  @IsIn(PHONE_TYPES)
  type: PhoneType;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  name: string;

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

  @ApiProperty({ example: 'filial-id-here', required: false })
  @IsOptional()
  @IsString()
  filialId?: string;

  @ApiProperty({ type: [CustomerPhoneDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerPhoneDto)
  phones?: CustomerPhoneDto[];
}
