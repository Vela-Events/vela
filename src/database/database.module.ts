import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmModuleOptions } from './typeorm.config';

@Module({})
export class DatabaseModule {
  static register(): DynamicModule {
    if (process.env.SKIP_DATABASE === 'true') {
      return {
        module: DatabaseModule,
      };
    }

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: typeOrmModuleOptions,
        }),
      ],
    };
  }
}
