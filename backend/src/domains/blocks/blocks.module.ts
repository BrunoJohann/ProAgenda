import { Module } from '@nestjs/common';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}

