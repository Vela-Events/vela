import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AppEntity } from '../../apps/entities/app.entity';
import { EventEntity } from '../../events/entities/event.entity';

@Entity({ name: 'event_schemas' })
@Unique('uq_event_schemas_app_event_name', ['appId', 'eventName'])
export class EventSchemaEntity {
  @PrimaryColumn({ type: 'varchar', length: 48 })
  id!: string;

  @Column({ type: 'uuid' })
  appId!: string;

  @ManyToOne(() => AppEntity, (app) => app.eventSchemas, {
    onDelete: 'CASCADE',
  })
  app!: AppEntity;

  @Column({ type: 'varchar', length: 255 })
  eventName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  fields!: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  metadataFields!: Array<Record<string, unknown>>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => EventEntity, (event) => event.schema)
  events?: EventEntity[];
}
