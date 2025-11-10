import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { InvitationsService } from './invitations.service';
import { TenantsModule } from '../tenants/tenants.module';
import { FiliaisModule } from '../filiais/filiais.module';
import { AuthModule } from '../../core/auth/auth.module';

@Module({
  imports: [TenantsModule, FiliaisModule, AuthModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, InvitationsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}

