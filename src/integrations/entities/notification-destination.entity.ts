import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationDestinationKind } from '../../common/enums/domain.enums';
import { AppEntity } from '../../apps/entities/app.entity';
import { IntegrationConnectionEntity } from './integration-connection.entity';

@Entity({ name: 'notification_destinations' })
export class NotificationDestinationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appId!: string;

  @ManyToOne(() => AppEntity, (app) => app.notificationDestinations, {
    onDelete: 'CASCADE',
  })
  app!: AppEntity;

  @Column({ type: 'uuid', nullable: true })
  connectionId!: string | null;

  @ManyToOne(
    () => IntegrationConnectionEntity,
    (connection) => connection.destinations,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  connection!: IntegrationConnectionEntity | null;

  @Column({
    type: 'enum',
    enum: NotificationDestinationKind,
    enumName: 'notification_destination_kind_enum',
  })
  kind!: NotificationDestinationKind;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  webhookUrlEnc!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailAddress!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
