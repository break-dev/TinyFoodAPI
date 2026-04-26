import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  static db: PrismaClient;

  async onModuleInit() {
    await this.$connect();
    PrismaService.db = this;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
