import { Module } from '@nestjs/common';
import { FiliaisController } from './filiais.controller';
import { FiliaisService } from './filiais.service';
import { SettingsService } from './settings.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  controllers: [FiliaisController],
  providers: [FiliaisService, SettingsService],
  exports: [FiliaisService, SettingsService],
})
export class FiliaisModule {}

