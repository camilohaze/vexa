declare module 'passport-apple' {
  import { Request } from 'express';
  import { Strategy as OAuth2Strategy } from 'passport-oauth2';

  export interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    callbackURL: string;
    privateKeyLocation?: string;
    privateKeyString?: string;
    scope?: string[];
    passReqToCallback?: boolean;
    authorizationURL?: string;
    tokenURL?: string;
  }

  export interface AppleProfile {
    name?: { firstName?: string; lastName?: string };
    email?: string;
  }

  export type AppleVerifyCallback = (
    req: Request & { appleProfile?: AppleProfile },
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: unknown,
    done: (err: Error | null, user?: unknown) => void
  ) => void;

  export class Strategy extends OAuth2Strategy {
    constructor(options: AppleStrategyOptions, verify: AppleVerifyCallback);
    name: string;
  }
}
