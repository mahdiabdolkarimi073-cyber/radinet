import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'; import { PrismaClient } from '@prisma/client';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (e) {
      console.warn('[PrismaService] Database offline or connection issue, continuing with graceful handling');
    }
  }
  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
    } catch {}
  }
}