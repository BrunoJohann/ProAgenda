import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Acme Corporation', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  tenantName?: string;

  @ApiProperty({ 
    example: 'acme-corp', 
    required: false,
    description: 'Slug must be lowercase, alphanumeric with hyphens only'
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, alphanumeric with hyphens only (e.g., my-company)',
  })
  tenantSlug?: string;
}

