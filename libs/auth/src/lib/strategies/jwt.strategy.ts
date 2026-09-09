import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_ENV, AUTH_STRATEGIES } from '../auth.constants';
import { AuthenticatedUser, JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AUTH_STRATEGIES.JWT) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>(AUTH_ENV.JWT_ACCESS_SECRET),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return { ...payload, id: payload.sub };
  }
}
