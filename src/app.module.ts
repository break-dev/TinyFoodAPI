import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PublicGateway } from './common/presentation/gateways/public.gateway';
import { PrivateGateway } from './common/presentation/gateways/private.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [PublicGateway, PrivateGateway],
})
export class AppModule {}
