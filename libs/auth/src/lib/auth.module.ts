import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AUTH_ENV } from './auth.constants';
import { JwtAuthGuard, RolesGuard } from './guards';
import { TokenService } from './services/token.service';
import {
  AppleStrategy,
  GoogleStrategy,
  JwtRefreshStrategy,
  JwtStrategy,
} from './strategies';

export interface AuthModuleOptions {
  oauthProviders?: boolean;
}

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions = {}): DynamicModule {
    const oauthStrategies = options.oauthProviders
      ? [GoogleStrategy, AppleStrategy]
      : [];
    return {
      module: AuthModule,
      global: true,
      imports: [
        ConfigModule,
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.getOrThrow<string>(AUTH_ENV.JWT_ACCESS_SECRET),
          }),
        }),
      ],
      providers: [
        TokenService,
        JwtStrategy,
        JwtRefreshStrategy,
        JwtAuthGuard,
        RolesGuard,
        ...oauthStrategies,
      ],
      exports: [TokenService, JwtModule, PassportModule, JwtAuthGuard, RolesGuard],
    };
  }
}
