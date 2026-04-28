import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/service/prisma.service';
import './presentation/comida.gateway';

@Module({
  providers: [PrismaService],
})
export class ComidaModule {}
