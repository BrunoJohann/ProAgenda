import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { TenantsModule } from '../tenants/tenants.module';
import { FiliaisModule } from '../filiais/filiais.module';
import { SchedulingModule } from '../scheduling/scheduling.module';

@Module({
  imports: [TenantsModule, FiliaisModule, SchedulingModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}

