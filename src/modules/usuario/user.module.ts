import { Module } from '@nestjs/common';
import { UserGateway } from './presentation/user.gateway';

@Module({})
export class UserModule {
  constructor() {
    // Inicializa el gateway para registrar los eventos en el Dispatcher
    UserGateway;
  }
}