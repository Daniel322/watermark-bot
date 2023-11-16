import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvConfig } from '@common/configs';
import { TelegrafModule } from '@modules/telegraf/telegraf.module';

@Module({
  imports: [ConfigModule.forRoot(EnvConfig), TelegrafModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
