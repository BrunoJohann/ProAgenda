import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Blocks')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BlocksController {
  constructor(private blocksService: BlocksService) {}

  // Admin routes
  @Get('v1/admin/professionals/:pid/blocks')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.OPERATOR)
  @ApiOperation({ summary: 'Get professional blocks' })
  findAll(
    @CurrentUser('tenant') tenant: string,
    @Param('pid') pid: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.blocksService.findAll(tenant, pid, from, to);
  }

  @Post('v1/admin/professionals/:pid/blocks')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create block for professional' })
  create(@CurrentUser('tenant') tenant: string, @Param('pid') pid: string, @Body() dto: CreateBlockDto) {
    return this.blocksService.create(tenant, pid, dto);
  }

  @Delete('v1/admin/professionals/:pid/blocks/:blockId')
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete block' })
  remove(@CurrentUser('tenant') tenant: string, @Param('pid') pid: string, @Param('blockId') blockId: string) {
    return this.blocksService.remove(tenant, pid, blockId);
  }

  // Professional self-service routes
  @Get('v1/me/blocks')
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Get my blocks' })
  getMyBlocks(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!user.professionalId) {
      throw new Error('Professional ID not found');
    }
    return this.blocksService.findAll(tenant, user.professionalId, from, to);
  }

  @Post('v1/me/blocks')
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Create my block' })
  createMyBlock(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBlockDto,
  ) {
    if (!user.professionalId) {
      throw new Error('Professional ID not found');
    }
    return this.blocksService.create(tenant, user.professionalId, dto, user);
  }

  @Delete('v1/me/blocks/:blockId')
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Delete my block' })
  deleteMyBlock(
    @CurrentUser('tenant') tenant: string,
    @CurrentUser() user: JwtPayload,
    @Param('blockId') blockId: string,
  ) {
    if (!user.professionalId) {
      throw new Error('Professional ID not found');
    }
    return this.blocksService.remove(tenant, user.professionalId, blockId, user);
  }
}

