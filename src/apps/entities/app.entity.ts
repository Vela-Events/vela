import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { EventEntity } from '../../events/entities/event.entity';
import { EventSchemaEntity } from '../../schemas/entities/event-schema.entity';
import { NotificationRuleEntity } from '../../notifications/entities/notification-rule.entity';
import { NotificationDestinationEntity } from '../../integrations/entities/notification-destination.entity';

@Entity({ name: 'apps' })
@Unique('uq_apps_slug', ['slug'])
export class AppEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_apps_account_id')
  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, (account) => account.apps, {
    onDelete: 'CASCADE',
  })
  account!: AccountEntity;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text' })
  apiKeyHash!: string;

  @Column({ type: 'varchar', length: 32 })
  apiKeyPrefix!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => EventEntity, (event) => event.app)
  events?: EventEntity[];

  @OneToMany(() => EventSchemaEntity, (schema) => schema.app)
  eventSchemas?: EventSchemaEntity[];

  @OneToMany(() => NotificationRuleEntity, (rule) => rule.app)
  notificationRules?: NotificationRuleEntity[];

  @OneToMany(
    () => NotificationDestinationEntity,
    (destination) => destination.app,
  )
  notificationDestinations?: NotificationDestinationEntity[];
}
