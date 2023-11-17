import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { TelegrafService } from './telegraf.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [TelegrafService],
})
export class TelegrafModule {}
