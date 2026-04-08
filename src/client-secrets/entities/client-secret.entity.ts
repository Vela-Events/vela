import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountEntity } from '../../accounts/entities/account.entity';

@Entity({ name: 'client_secrets' })
export class ClientSecretEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  account?: AccountEntity;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'text' })
  keyHash!: string;

  @Column({ type: 'varchar', length: 32 })
  @Index()
  keyPrefix!: string;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastUsedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
