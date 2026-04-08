import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '../../common/enums/domain.enums';
import { AccountEntity } from '../entities/account.entity';

export class AccountResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: Plan })
  plan!: Plan;

  @ApiProperty()
  appsLimit!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: AccountEntity): AccountResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      plan: entity.plan,
      appsLimit: entity.appsLimit,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
