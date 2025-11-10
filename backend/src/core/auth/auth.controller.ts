import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create new tenant and owner user' })
  async signup(@Body() dto: SignupDto, @Req() req: Request) {
    return this.authService.signup(dto, req.headers['user-agent'], req.ip);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.headers['user-agent'], req.ip);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, req.headers['user-agent'], req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current session' })
  async logout(@CurrentUser('sub') userId: string, @Body() dto: RefreshDto) {
    return this.authService.logout(userId, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile and roles' })
  async me(@CurrentUser('sub') userId: string, @CurrentUser('tenant') tenant: string) {
    return this.authService.me(userId, tenant);
  }

  @Public()
  @Post('accept-invite')
  @ApiOperation({ summary: 'Accept professional invitation and create account' })
  async acceptInvite(@Body() dto: AcceptInviteDto, @Req() req: Request) {
    return this.authService.acceptInvite(dto, req.headers['user-agent'], req.ip);
  }
}

