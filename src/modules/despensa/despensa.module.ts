import { Module, OnModuleInit } from '@nestjs/common';
import { DespensaGateway } from './presentation/despensa.gateway';

@Module({
  providers: [],
})
export class DespensaModule implements OnModuleInit {
  onModuleInit() {
    DespensaGateway.register();
  }
}
