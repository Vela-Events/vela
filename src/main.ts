import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin:
      process.env.CORS_ORIGINS?.split(',').map((value) => value.trim()) ?? true,
    credentials: true,
  });
  app.use(
    json({
      limit: process.env.INGEST_MAX_BODY_BYTES
        ? `${process.env.INGEST_MAX_BODY_BYTES}b`
        : '1mb',
    }),
  );
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vela Backend API')
    .setDescription(
      'Vela Event Intelligence backend surface.\n\n' +
        '**Bearer:** Account JWT from `POST /v1/auth/token` for protected HTTP routes.\n' +
        '**`POST /v1/ingest`:** App API key via **`x-api-key`** header only (see Authorize → x-api-key).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Account JWT from `POST /v1/auth/token` for protected routes (not used for ingest).',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'App API key — required for `POST /v1/ingest` only.',
      },
      'x-api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

void bootstrap();
