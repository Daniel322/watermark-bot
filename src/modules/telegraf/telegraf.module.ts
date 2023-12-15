import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

import { TelegrafLogsModule } from '@modules/telegraf-logs/telegraf-logs.module';
import { WatermarkModule } from '@modules/watermark/watermark.module';

import { TelegrafService } from './telegraf.service';
import { telegrafProvider } from './telegraf.provider';
import { TelegrafUiServuce } from './telegraf.ui.service';
import { TelegrafUsersStatesService } from './telegraf.users-states.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    CacheModule.register(),
    TelegrafLogsModule,
    WatermarkModule,
  ],
  providers: [
    TelegrafService,
    telegrafProvider,
    TelegrafUiServuce,
    TelegrafUsersStatesService,
  ],
})
export class TelegrafModule {}
