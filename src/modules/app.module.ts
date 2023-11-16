import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvConfig } from '@common/configs';

import { WatermarkModule } from './watermark/watermark.module';

@Module({
  imports: [ConfigModule.forRoot(EnvConfig), WatermarkModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
