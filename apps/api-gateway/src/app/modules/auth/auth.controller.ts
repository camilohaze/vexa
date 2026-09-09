import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  AUTH_STRATEGIES,
  CurrentUser,
  JwtRefreshPayload,
  OAuthProfile,
  Public,
} from '@vexa/auth';
import { ApiRoutes } from '@vexa/shared';
import { AuthClient, AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/credentials.dto';

const CLIENT_COOKIE = 'vexa_auth_client';

@ApiTags(ApiRoutes.AUTH)
@Controller(ApiRoutes.AUTH)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Inicia OAuth con Google. ?client=company|admin|mobile' })
  google(@Query('client') client: AuthClient = 'company', @Res() res: Response) {
    res.cookie(CLIENT_COOKIE, client, { httpOnly: true, maxAge: 5 * 60_000, sameSite: 'lax' });
    return res.redirect(`./google/start`);
  }

  @Public()
  @Get('google/start')
  @UseGuards(AuthGuard(AUTH_STRATEGIES.GOOGLE))
  @ApiExcludeEndpoint()
  googleStart() {
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard(AUTH_STRATEGIES.GOOGLE))
  @ApiExcludeEndpoint()
  googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.completeOAuth(req, res);
  }

  @Public()
  @Get('facebook')
  @ApiOperation({ summary: 'Inicia OAuth con Facebook. ?client=company|admin|mobile' })
  facebook(@Query('client') client: AuthClient = 'company', @Res() res: Response) {
    res.cookie(CLIENT_COOKIE, client, { httpOnly: true, maxAge: 5 * 60_000, sameSite: 'lax' });
    return res.redirect(`./facebook/start`);
  }

  @Public()
  @Get('facebook/start')
  @UseGuards(AuthGuard(AUTH_STRATEGIES.FACEBOOK))
  @ApiExcludeEndpoint()
  facebookStart() {
    return;
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard(AUTH_STRATEGIES.FACEBOOK))
  @ApiExcludeEndpoint()
  facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.completeOAuth(req, res);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registro con email/contraseña. Envía OTP de verificación.' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con email/contraseña. 403 EMAIL_NOT_VERIFIED si falta verificar.' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica el correo con el código de 6 dígitos' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.email, dto.code);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.email, dto.code, dto.password);
  }

  @Public()
  @Post('refresh')
  @UseGuards(AuthGuard(AUTH_STRATEGIES.JWT_REFRESH))
  @ApiOperation({ summary: 'Renueva el par de tokens usando { refreshToken }' })
  refresh(@Req() req: Request) {
    return this.auth.refresh(req.user as JwtRefreshPayload);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser('id') userId: string) {
    return this.auth.logout(userId);
  }

  private async completeOAuth(req: Request, res: Response) {
    const client = ((req.cookies?.[CLIENT_COOKIE] as AuthClient) ?? 'company') satisfies AuthClient;
    const tokens = await this.auth.loginWithOAuth(req.user as OAuthProfile, client);
    res.clearCookie(CLIENT_COOKIE);
    return res.redirect(this.auth.buildRedirectUrl(client, tokens));
  }
}
