import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Paginated, UserRole } from '@vexa/shared';
import { NotificationEntity, NotificationScope } from './notification.entity';

export interface NotificationFeedQuery {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

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

  /** Bandeja paginada y filtrable por fecha, para company o courier. */
  async feed(
    scope: 'company' | 'courier',
    ownerId: string,
    query: NotificationFeedQuery = {},
  ): Promise<Paginated<NotificationEntity>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: FindOptionsWhere<NotificationEntity> =
      scope === 'company' ? { scope: 'company', companyId: ownerId } : { scope: 'courier', courierId: ownerId };
    if (query.from && query.to) where.createdAt = Between(new Date(query.from), new Date(query.to));
    else if (query.from) where.createdAt = MoreThanOrEqual(new Date(query.from));
    else if (query.to) where.createdAt = LessThanOrEqual(new Date(query.to));

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  /** Marca como leída, verificando que pertenezca al dueño indicado. */
  async markReadFor(scope: 'company' | 'courier', ownerId: string, id: string) {
    const ownerMatch =
      scope === 'company' ? { scope: 'company' as const, companyId: ownerId } : { scope: 'courier' as const, courierId: ownerId };
    const existing = await this.repo.findOne({ where: { id, ...ownerMatch } });
    if (!existing) return null;
    existing.isRead = true;
    return this.repo.save(existing);
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
