import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { TenantsModule } from '../tenants/tenants.module';
import { FiliaisModule } from '../filiais/filiais.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TenantsModule, FiliaisModule, SchedulingModule, CustomersModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

