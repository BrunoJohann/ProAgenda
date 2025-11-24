import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization type');
    }

    const validToken = this.configService.get<string>('WHATSAPP_INTEGRATION_TOKEN');

    if (!validToken) {
      throw new UnauthorizedException('WhatsApp integration not configured');
    }

    if (token !== validToken) {
      throw new UnauthorizedException('Invalid WhatsApp integration token');
    }

    return true;
  }
}
