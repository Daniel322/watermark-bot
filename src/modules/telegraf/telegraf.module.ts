import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

import { TelegrafService } from './telegraf.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    CacheModule.register(),
  ],
  providers: [TelegrafService],
})
export class TelegrafModule {}
