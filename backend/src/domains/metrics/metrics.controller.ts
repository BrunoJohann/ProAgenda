import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Metrics')
@Controller('v1/admin/filiais/:id/metrics')
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@ApiBearerAuth()
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.ANALYST)
  @ApiOperation({ summary: 'Get filial metrics (summary, timeseries, performance, service mix, heatmap)' })
  getMetrics(
    @CurrentUser('tenant') tenant: string,
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.metricsService.getFilialMetrics(tenant, id, from, to);
  }
}

