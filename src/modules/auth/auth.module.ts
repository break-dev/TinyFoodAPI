import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/service/prisma.service';
import './presentation/auth.gateway';

@Module({
  providers: [PrismaService],
})
export class AuthModule {}
