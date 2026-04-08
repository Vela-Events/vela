import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppEntity } from '../../apps/entities/app.entity';

@Entity({ name: 'notification_rules' })
export class NotificationRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appId!: string;

  @ManyToOne(() => AppEntity, (app) => app.notificationRules, {
    onDelete: 'CASCADE',
  })
  app!: AppEntity;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  eventName!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  conditions!: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  actions!: Array<Record<string, unknown>>;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastTriggeredAt!: Date | null;

  @Column({ type: 'bigint', default: 0 })
  triggerCount!: number;
}
