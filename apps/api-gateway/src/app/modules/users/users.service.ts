import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthProfile } from '@vexa/auth';
import { AuthProvider, UserRole } from '@vexa/shared';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>
  ) {}

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string, withSecrets = false) {
    const query = this.repo
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email });
    if (withSecrets) query.addSelect('u.passwordHash');
    return query.getOne();
  }

  createPasswordUser(data: {
    email: string;
    fullName: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
  }) {
    return this.repo.save(
      this.repo.create({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        passwordHash: data.passwordHash,
        provider: AuthProvider.EMAIL,
        providerId: data.email.toLowerCase(),
        role: data.role,
        emailVerified: false,
      })
    );
  }

  markVerified(userId: string) {
    return this.repo.update({ id: userId }, { emailVerified: true });
  }

  setPassword(userId: string, passwordHash: string) {
    return this.repo.update({ id: userId }, { passwordHash });
  }

  async getById(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async upsertFromOAuth(profile: OAuthProfile, defaultRole = UserRole.COMPANY) {
    const existing = await this.repo.findOneBy({
      provider: profile.provider,
      providerId: profile.providerId,
    });
    if (existing) {
      existing.fullName = profile.fullName;
      existing.avatarUrl = profile.avatarUrl;
      existing.emailVerified = true;
      return this.repo.save(existing);
    }
    return this.repo.save(
      this.repo.create({
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        provider: profile.provider,
        providerId: profile.providerId,
        role: defaultRole,
        emailVerified: true,
      })
    );
  }

  setRefreshTokenId(userId: string, refreshTokenId: string | null) {
    return this.repo.update({ id: userId }, { refreshTokenId });
  }
}
