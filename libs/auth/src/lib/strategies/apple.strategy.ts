/// <reference path="../types/passport-apple.d.ts" />

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { AppleProfile, Strategy } from 'passport-apple';
import { AuthProvider } from '@vexa/shared';
import { AUTH_ENV, AUTH_STRATEGIES } from '../auth.constants';
import { OAuthProfile } from '../interfaces/jwt-payload.interface';

interface AppleIdToken {
  sub: string;
  email?: string;
  email_verified?: boolean | 'true' | 'false';
}

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, AUTH_STRATEGIES.APPLE, 6) {
  constructor(config: ConfigService, private readonly jwt: JwtService) {
    super({
      clientID: config.get<string>(AUTH_ENV.APPLE_CLIENT_ID, 'not-configured'),
      teamID: config.get<string>(AUTH_ENV.APPLE_TEAM_ID, 'not-configured'),
      keyID: config.get<string>(AUTH_ENV.APPLE_KEY_ID, 'not-configured'),
      privateKeyString: config.get<string>(AUTH_ENV.APPLE_PRIVATE_KEY, '').replace(/\\n/g, '\n'),
      callbackURL: `${config.get<string>(AUTH_ENV.OAUTH_CALLBACK_BASE_URL, 'http://localhost:3000/api/auth')}/apple/callback`,
      scope: ['name', 'email'],
      passReqToCallback: true,
    });
  }

  validate(
    req: Request & { appleProfile?: AppleProfile },
    _accessToken: string,
    _refreshToken: string,
    idToken: string,
    _profile: unknown,
    _done: (err: Error | null, user?: unknown) => void
  ): OAuthProfile {
    const claims = this.jwt.decode<AppleIdToken | null>(idToken);
    if (!claims?.sub) throw new UnauthorizedException('Apple id_token inválido');
    const name = req.appleProfile?.name;
    const fullName = [name?.firstName, name?.lastName].filter(Boolean).join(' ').trim();
    return {
      provider: AuthProvider.APPLE,
      providerId: claims.sub,
      email: claims.email ?? req.appleProfile?.email ?? '',
      fullName: fullName || (claims.email ?? '').split('@')[0] || 'Apple user',
    };
  }
}
