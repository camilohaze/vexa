import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { AuthProvider } from '@vexa/shared';
import { AUTH_ENV, AUTH_STRATEGIES } from '../auth.constants';
import { OAuthProfile } from '../interfaces/jwt-payload.interface';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, AUTH_STRATEGIES.FACEBOOK) {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>(AUTH_ENV.FACEBOOK_APP_ID, 'not-configured'),
      clientSecret: config.get<string>(AUTH_ENV.FACEBOOK_APP_SECRET, 'not-configured'),
      callbackURL: `${config.get<string>(AUTH_ENV.OAUTH_CALLBACK_BASE_URL, 'http://localhost:3000/api/auth')}/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      scope: ['email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfile {
    return {
      provider: AuthProvider.FACEBOOK,
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
