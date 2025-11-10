import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { FiliaisModule } from '../filiais/filiais.module';

@Module({
  imports: [FiliaisModule],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}

