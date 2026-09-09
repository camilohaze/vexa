import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@vexa/shared';
import { NotificationEntity, NotificationScope } from './notification.entity';

export interface NotificationInput {
  scope: NotificationScope;
  companyId?: string | null;
  courierId?: string | null;
  audience?: UserRole | null;
  icon: string;
  title: string;
  body: string;
  referenceId?: string | null;
  referenceType?: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>
  ) {}

  async create(input: NotificationInput) {
    return this.repo.save(this.repo.create(input));
  }

  findForCompany(companyId: string, limit = 50) {
    return this.repo.find({
      where: [{ scope: 'company', companyId }],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  findForCourier(courierId: string, limit = 50) {
    return this.repo.find({
      where: [{ scope: 'courier', courierId }],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  findForAdmin(limit = 50) {
    return this.repo.find({
      where: [{ scope: 'global' }],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  stats() {
    return this.repo
      .createQueryBuilder('n')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(*) FILTER (WHERE n.is_read = false)', 'unread')
      .addSelect('COUNT(*) FILTER (WHERE n.created_at >= now() - interval \'24 hours\')', 'sentToday')
      .getRawOne<{ total: string; unread: string; sentToday: string }>();
  }

  async markRead(id: string) {
    await this.repo.update(id, { isRead: true });
    return this.repo.findOneBy({ id });
  }
}
