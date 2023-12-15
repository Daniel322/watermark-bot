import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TelegrafLogsService } from './telegraf-logs.service';

@Module({
  imports: [ConfigModule],
  providers: [TelegrafLogsService],
  exports: [TelegrafLogsService],
})
export class TelegrafLogsModule {}
