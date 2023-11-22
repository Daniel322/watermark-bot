import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

import { WatermarkModule } from '@modules/watermark/watermark.module';

import { TelegrafService } from './telegraf.service';
import { telegrafProvider } from './telegraf.provider';
import { TelegrafUiServuce } from './telegraf.ui.service';

@Module({
  imports: [ConfigModule, HttpModule, CacheModule.register(), WatermarkModule],
  providers: [TelegrafService, telegrafProvider, TelegrafUiServuce],
})
export class TelegrafModule {}
