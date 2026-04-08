import { Global, Module } from '@nestjs/common';
import { MessageBusService } from './message-bus.service';

@Global()
@Module({
  providers: [MessageBusService],
  exports: [MessageBusService],
})
export class MessagingModule {}
