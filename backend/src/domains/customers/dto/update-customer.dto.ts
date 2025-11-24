import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateCustomerDto {
  @ApiProperty({ example: 'João da Silva', required: false })
  @IsOptional()
  @IsString()
  name?: string;

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
}
