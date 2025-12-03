import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { CustomerAuthController } from './customer-auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './tokens/token.service';
import { SessionsService } from './tokens/sessions.service';
import { MagicLinkService } from './tokens/magic-link.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { EmailModule } from '../email/email.module';
import { TenantsModule } from '../../domains/tenants/tenants.module';
import { CustomersModule } from '../../domains/customers/customers.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
    EmailModule,
    TenantsModule,
    CustomersModule,
  ],
  controllers: [AuthController, CustomerAuthController],
  providers: [
    AuthService,
    TokenService,
    SessionsService,
    MagicLinkService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}

