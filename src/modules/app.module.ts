import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvConfig } from '@common/configs';

import { TelegrafModule } from '@modules/telegraf/telegraf.module';
import { WatermarkModule } from '@modules/watermark/watermark.module';

@Module({
  imports: [ConfigModule.forRoot(EnvConfig), TelegrafModule, WatermarkModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
