import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthProvider } from '@vexa/shared';
import { AUTH_ENV, AUTH_STRATEGIES } from '../auth.constants';
import { OAuthProfile } from '../interfaces/jwt-payload.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, AUTH_STRATEGIES.GOOGLE) {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>(AUTH_ENV.GOOGLE_CLIENT_ID, 'not-configured'),
      clientSecret: config.get<string>(AUTH_ENV.GOOGLE_CLIENT_SECRET, 'not-configured'),
      callbackURL: `${config.get<string>(AUTH_ENV.OAUTH_CALLBACK_BASE_URL, 'http://localhost:3000/api/auth')}/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfile {
    return {
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
