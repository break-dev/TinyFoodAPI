import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PantryModule } from './modules/main/pantry.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles en cualquier módulo
    }),
    PantryModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
