import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: 'Basic service health check',
    schema: {
      example: {
        status: 'ok',
        service: 'vela-be',
      },
    },
  })
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOkResponse({
    description: 'Readiness check for database and broker dependencies',
  })
  async getReadiness() {
    try {
      return await this.healthService.getReadiness();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'vela-be',
        message,
      });
    }
  }
}
