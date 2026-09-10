import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type SupportArticleType = 'faq' | 'help' | 'legal';

@Entity('support_articles')
export class SupportArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ['faq', 'help', 'legal'] })
  type!: SupportArticleType;

  @Column({ type: 'varchar', nullable: true })
  category?: string | null;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
