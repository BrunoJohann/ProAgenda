import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './core/auth/auth.module';
import { TenantsModule } from './domains/tenants/tenants.module';
import { FiliaisModule } from './domains/filiais/filiais.module';
import { UsersModule } from './domains/users/users.module';
import { ProfessionalsModule } from './domains/professionals/professionals.module';
import { ServicesModule } from './domains/services/services.module';
import { SchedulingModule } from './domains/scheduling/scheduling.module';
import { BlocksModule } from './domains/blocks/blocks.module';
import { AppointmentsModule } from './domains/appointments/appointments.module';
import { MetricsModule } from './domains/metrics/metrics.module';
import { CalendarModule } from './core/calendar/calendar.module';
import { envValidation } from './core/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),
    PrismaModule,
    AuthModule,
    TenantsModule,
    FiliaisModule,
    UsersModule,
    ProfessionalsModule,
    ServicesModule,
    SchedulingModule,
    BlocksModule,
    AppointmentsModule,
    MetricsModule,
    CalendarModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

