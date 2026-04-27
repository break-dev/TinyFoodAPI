import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PublicGateway } from './common/presentation/gateways/public.gateway';
import { PrivateGateway } from './common/presentation/gateways/private.gateway';
import { UserModule } from './modules/usuario/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [PublicGateway, PrivateGateway],
})
export class AppModule {}
