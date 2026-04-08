import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Plan } from '../common/enums/domain.enums';
import { AccountsService } from '../accounts/accounts.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('issues a JWT for a social auth user', async () => {
    const ensureAccount = jest.fn().mockResolvedValue({
      id: 'acct_1',
      email: 'user@example.com',
      name: 'Test User',
      plan: Plan.FREE,
      appsLimit: 3,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const signAsync = jest.fn().mockResolvedValue('jwt-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AccountsService,
          useValue: { ensureAccount },
        },
        {
          provide: JwtService,
          useValue: { signAsync },
        },
      ],
    }).compile();

    const service = module.get(AuthService);
    const result = await service.issueSocialToken({
      provider: 'google',
      email: 'user@example.com',
      name: 'Test User',
    });

    expect(ensureAccount).toHaveBeenCalledWith('user@example.com', 'Test User');
    expect(signAsync).toHaveBeenCalled();
    expect(result.accessToken).toBe('jwt-token');
    expect(result.account.email).toBe('user@example.com');
  });
});
