import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/service/prisma.service';

@Module({
  providers: [PrismaService],
})
export class AuthModule {}
