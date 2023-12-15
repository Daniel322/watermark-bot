import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvConfig } from '@common/configs';

import { TelegrafModule } from '@modules/telegraf/telegraf.module';
import { WatermarkModule } from '@modules/watermark/watermark.module';
import { TelegrafLogsModule } from '@modules/telegraf-logs/telegraf-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot(EnvConfig),
    TelegrafModule,
    TelegrafLogsModule,
    WatermarkModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
