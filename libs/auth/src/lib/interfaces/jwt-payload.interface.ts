import { AuthProvider, UserRole } from '@vexa/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  companyId?: string;
  courierId?: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  tokenId: string;
}

export interface AuthenticatedUser extends JwtPayload {
  id: string;
}

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}
