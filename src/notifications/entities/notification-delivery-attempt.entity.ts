import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notification_delivery_attempts' })
@Index('idx_notification_delivery_attempts_app_created', ['appId', 'createdAt'])
@Index('idx_notification_delivery_attempts_destination_created', [
  'destinationId',
  'createdAt',
])
export class NotificationDeliveryAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appId!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'uuid' })
  ruleId!: string;

  @Column({ type: 'uuid' })
  destinationId!: string;

  @Column({ type: 'varchar', length: 32 })
  channel!: string;

  @Column({ type: 'int' })
  attemptNumber!: number;

  @Column({ type: 'varchar', length: 32 })
  status!: 'pending' | 'delivered' | 'failed';

  @Column({ type: 'int', nullable: true })
  responseCode!: number | null;

  @Column({ type: 'text', nullable: true })
  responseBody!: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
