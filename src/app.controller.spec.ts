import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';

describe('HealthController', () => {
  it('returns a basic health payload', () => {
    const controller = new HealthController({
      getHealth: jest.fn().mockReturnValue({
        status: 'ok',
        service: 'vela-be',
      }),
      getReadiness: jest.fn(),
    } as unknown as HealthService);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'vela-be',
    });
  });
});
