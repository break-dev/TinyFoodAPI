import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  static db: PrismaClient;

  constructor(configService: ConfigService) {
    const url = configService.get<string>('DATABASE_URL');

    // Aseguramos que la variable esté en el entorno antes de inicializar
    process.env.DATABASE_URL = url;

    super({});

    PrismaService.db = this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
