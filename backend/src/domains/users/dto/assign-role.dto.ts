import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class AssignRoleDto {
  @ApiProperty({ enum: Role, example: 'MANAGER' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'filial-id-here', required: false })
  @IsOptional()
  @IsString()
  filialId?: string;
}

