import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from '../../common/enums/domain.enums';
import { AppEntity } from '../../apps/entities/app.entity';
import { IntegrationConnectionEntity } from '../../integrations/entities/integration-connection.entity';

@Entity({ name: 'accounts' })
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: Plan,
    enumName: 'plan_enum',
    default: Plan.FREE,
  })
  plan!: Plan;

  @Column({ type: 'int', default: 1 })
  appsLimit!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => AppEntity, (app) => app.account)
  apps?: AppEntity[];

  @OneToMany(
    () => IntegrationConnectionEntity,
    (connection) => connection.account,
  )
  integrationConnections?: IntegrationConnectionEntity[];

  @BeforeInsert()
  normalizeEmail() {
    this.email = this.email.trim().toLowerCase();
  }
}
