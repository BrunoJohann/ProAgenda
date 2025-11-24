import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappAuthGuard } from './whatsapp-auth.guard';
import { AppointmentsModule } from '../../appointments/appointments.module';
import { CustomersModule } from '../../customers/customers.module';

@Module({
  imports: [ConfigModule, AppointmentsModule, CustomersModule],
  controllers: [WhatsappController],
  providers: [WhatsappAuthGuard],
})
export class WhatsappModule {}
