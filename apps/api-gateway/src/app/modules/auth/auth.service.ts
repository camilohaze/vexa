import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, JwtRefreshPayload, OAuthProfile, TokenService } from '@vexa/auth';
import { RedisService } from '@vexa/core';
import { MailerService } from '@vexa/notifications';
import { AuthTokens, UserRole } from '@vexa/shared';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/user.entity';
import { RegisterDto } from './dto/credentials.dto';

export type AuthClient = 'company' | 'admin' | 'mobile' | 'courier';

const OTP_TTL_SECONDS = 10 * 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly mailer: MailerService
  ) {}

  async loginWithOAuth(profile: OAuthProfile, client: AuthClient): Promise<AuthTokens> {
    const defaultRole = client === 'mobile' || client === 'courier' ? UserRole.COURIER : UserRole.COMPANY;
    const user = await this.users.upsertFromOAuth(profile, defaultRole);
    return this.issueTokens(user);
  }

  async register(dto: RegisterDto) {
    if (!dto.acceptTerms) {
      throw new BadRequestException('Debes aceptar los términos de servicio');
    }
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Ya existe una cuenta con ese correo');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.createPasswordUser({
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
    });
    await this.sendOtp(user.email, 'verify');
    return { message: 'Cuenta creada. Revisa tu correo para verificarla.' };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email, true);
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.emailVerified) {
      await this.sendOtp(user.email, 'verify');
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }
    return this.issueTokens(user);
  }

  async verifyEmail(email: string, code: string): Promise<AuthTokens> {
    await this.assertOtp(email, 'verify', code);
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Cuenta no encontrada');
    await this.users.markVerified(user.id);
    return this.issueTokens(user);
  }

  async resendVerification(email: string) {
    const user = await this.users.findByEmail(email);
    if (user && !user.emailVerified) await this.sendOtp(email, 'verify');
    return { message: 'Si la cuenta existe, recibirás un código.' };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    if (user?.passwordHash) await this.sendOtp(email, 'reset');
    return { message: 'Si la cuenta existe, recibirás un código.' };
  }

  async resetPassword(email: string, code: string, password: string) {
    await this.assertOtp(email, 'reset', code);
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Cuenta no encontrada');
    await this.users.setPassword(user.id, await bcrypt.hash(password, 10));
    await this.users.setRefreshTokenId(user.id, null);
    return { message: 'Contraseña actualizada' };
  }

  async refresh(payload: JwtRefreshPayload): Promise<AuthTokens> {
    const user = await this.users.findById(payload.sub);
    if (!user || user.refreshTokenId !== payload.tokenId) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.users.setRefreshTokenId(userId, null);
  }

  buildRedirectUrl(client: AuthClient, tokens: AuthTokens): string {
    // company/admin/courier are all Module Federation remotes mounted under one shell —
    // the shell (web-landing) is the only app with a public /auth/callback route; it reads
    // the role from the fetched user and routes internally to /admin, /company, or /courier.
    const webShellCallback = `${this.config.get('WEB_LANDING_URL')}/auth/callback`;
    const base: Record<AuthClient, string> = {
      company: webShellCallback,
      admin: webShellCallback,
      mobile: this.config.get<string>('MOBILE_DEEP_LINK', 'vexa://auth/callback'),
      courier: webShellCallback,
    };
    const params = new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: String(tokens.expiresIn),
    });
    return `${base[client]}?${params.toString()}`;
  }

  private otpKey(email: string, purpose: 'verify' | 'reset') {
    return `auth:otp:${purpose}:${email.toLowerCase()}`;
  }

  private async sendOtp(email: string, purpose: 'verify' | 'reset') {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.redis.client.set(this.otpKey(email, purpose), code, 'EX', OTP_TTL_SECONDS);
    await this.mailer.sendOtp(email, code, purpose);
    if (this.config.get<string>('MAIL_PROVIDER', 'log') === 'log') {
      this.logger.log(`OTP ${purpose} para ${email}: ${code}`);
    }
  }

  private async assertOtp(email: string, purpose: 'verify' | 'reset', code: string) {
    const key = this.otpKey(email, purpose);
    const stored = await this.redis.client.get(key);
    if (!stored || stored !== code) {
      throw new BadRequestException('Código inválido o expirado');
    }
    await this.redis.client.del(key);
  }

  private async issueTokens(user: UserEntity): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const { refreshTokenId, ...tokens } = await this.tokens.issue(payload);
    await this.users.setRefreshTokenId(user.id, refreshTokenId);
    return tokens;
  }
}
