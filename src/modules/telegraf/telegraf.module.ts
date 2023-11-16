import { Module } from '@nestjs/common';

import { TelegrafService } from './telegraf.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [TelegrafService],
})
export class TelegrafModule {}
