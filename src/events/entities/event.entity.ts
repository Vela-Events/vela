import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EVENT_LEVELS, type EventLevel } from '../../common/enums/domain.enums';
import { AppEntity } from '../../apps/entities/app.entity';
import { EventSchemaEntity } from '../../schemas/entities/event-schema.entity';

@Entity({ name: 'events' })
@Index('idx_events_app_time', ['appId', 'occurredAt'])
@Index('idx_events_app_event_time', ['appId', 'eventName', 'occurredAt'])
@Index('idx_events_app_customer_time', ['appId', 'customerId', 'occurredAt'])
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appId!: string;

  @ManyToOne(() => AppEntity, (app) => app.events, { onDelete: 'CASCADE' })
  app!: AppEntity;

  @Column({ type: 'varchar', length: 255 })
  eventName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerId!: string | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: EVENT_LEVELS,
    enumName: 'event_level_enum',
  })
  level!: EventLevel;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 48, nullable: true })
  schemaId!: string | null;

  @ManyToOne(() => EventSchemaEntity, (schema) => schema.events, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  schema!: EventSchemaEntity | null;

  @Column({ type: 'timestamptz' })
  occurredAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  ingestedAt!: Date;
}
