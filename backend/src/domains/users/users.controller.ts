import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users & Roles')
@Controller('v1/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  create(@CurrentUser('tenant') tenant: string, @Body() dto: CreateUserDto) {
    return this.usersService.create(tenant, dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'List all users' })
  findAll(@CurrentUser('tenant') tenant: string) {
    return this.usersService.findAll(tenant);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  getMe(@CurrentUser('tenant') tenant: string, @CurrentUser('sub') userId: string) {
    return this.usersService.findById(tenant, userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user' })
  updateMe(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(tenant, userId, dto);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  findById(@CurrentUser('tenant') tenant: string, @Param('id') id: string) {
    return this.usersService.findById(tenant, id);
  }

  @Get(':id/roles')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Get user role assignments' })
  getRoles(@CurrentUser('tenant') tenant: string, @Param('id') id: string) {
    return this.usersService.getRoles(tenant, id);
  }

  @Post(':id/roles')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@CurrentUser('tenant') tenant: string, @Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.usersService.assignRole(tenant, id, dto);
  }

  @Delete(':id/roles/:roleId')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(@CurrentUser('tenant') tenant: string, @Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(tenant, id, roleId);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update user' })
  update(@CurrentUser('tenant') tenant: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(tenant, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  remove(@CurrentUser('tenant') tenant: string, @Param('id') id: string) {
    return this.usersService.remove(tenant, id);
  }
}

