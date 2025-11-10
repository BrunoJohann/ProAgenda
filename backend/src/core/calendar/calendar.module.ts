import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { IcsService } from './ics.service';

@Module({
  controllers: [CalendarController],
  providers: [IcsService],
  exports: [IcsService],
})
export class CalendarModule {}

