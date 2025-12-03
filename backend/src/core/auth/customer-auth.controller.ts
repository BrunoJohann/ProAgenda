import { Controller, Post, Get, Query, Req, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SendMagicLinkDto } from './dto/send-magic-link.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Customer Authentication')
@Controller('v1/customer/auth')
export class CustomerAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-magic-link')
  @Throttle({ short: { limit: 3, ttl: 1000 } }) // 3 requests per second
  @ApiOperation({ summary: 'Send magic link to customer email' })
  async sendMagicLink(
    @Query('tenant') tenant: string,
    @Body() dto: SendMagicLinkDto,
  ) {
    return this.authService.sendMagicLink(tenant, dto);
  }

  @Public()
  @Get('verify-magic-link')
  @Throttle({ short: { limit: 5, ttl: 1000 } }) // 5 requests per second
  @ApiOperation({ summary: 'Verify magic link token and login customer' })
  async verifyMagicLink(
    @Query('token') token: string,
    @Query('tenant') tenant: string,
    @Req() req: Request,
  ) {
    return this.authService.verifyMagicLink(
      token,
      tenant,
      req.headers['user-agent'],
      req.ip,
    );
  }
}

