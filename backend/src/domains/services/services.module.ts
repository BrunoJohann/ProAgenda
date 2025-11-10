import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { TenantsModule } from '../tenants/tenants.module';
import { FiliaisModule } from '../filiais/filiais.module';

@Module({
  imports: [TenantsModule, FiliaisModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

