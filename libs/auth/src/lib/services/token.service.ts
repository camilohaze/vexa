import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { randomUUID } from 'node:crypto';
import { AuthTokens } from '@vexa/shared';
import { AUTH_ENV } from '../auth.constants';
import { JwtPayload, JwtRefreshPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  private readonly accessTtl: StringValue;
  private readonly refreshTtl: StringValue;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {
    this.accessTtl = config.get<StringValue>(AUTH_ENV.JWT_ACCESS_TTL, '15m');
    this.refreshTtl = config.get<StringValue>(AUTH_ENV.JWT_REFRESH_TTL, '30d');
    this.refreshSecret = config.getOrThrow<string>(AUTH_ENV.JWT_REFRESH_SECRET);
  }

  async issue(payload: JwtPayload): Promise<AuthTokens & { refreshTokenId: string }> {
    const refreshTokenId = randomUUID();
    const refreshPayload: JwtRefreshPayload = { ...payload, tokenId: refreshTokenId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: this.accessTtl }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl,
      }),
    ]);
    const decoded = this.jwt.decode<{ exp: number; iat: number }>(accessToken);
    return {
      accessToken,
      refreshToken,
      refreshTokenId,
      expiresIn: decoded.exp - decoded.iat,
    };
  }

  verifyAccess(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token);
  }

  verifyRefresh(token: string): JwtRefreshPayload {
    return this.jwt.verify<JwtRefreshPayload>(token, { secret: this.refreshSecret });
  }
}
