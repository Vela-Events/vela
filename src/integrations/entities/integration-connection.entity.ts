import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IntegrationProvider,
  IntegrationStatus,
} from '../../common/enums/domain.enums';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { NotificationDestinationEntity } from './notification-destination.entity';

@Entity({ name: 'integration_connections' })
export class IntegrationConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, (account) => account.integrationConnections, {
    onDelete: 'CASCADE',
  })
  account!: AccountEntity;

  @Column({
    type: 'enum',
    enum: IntegrationProvider,
    enumName: 'integration_provider_enum',
  })
  provider!: IntegrationProvider;

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    enumName: 'integration_status_enum',
    default: IntegrationStatus.ACTIVE,
  })
  status!: IntegrationStatus;

  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'text' })
  credentialsEnc!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalTeamId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(
    () => NotificationDestinationEntity,
    (destination) => destination.connection,
  )
  destinations?: NotificationDestinationEntity[];
}
