import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { Logger } from '@nestjs/common';

import { SYS_MESSAGES } from './telegraf.constants';

export const TELEGRAF_TOKEN = 'TELEGRAF_TOKEN';

export const telegrafProvider = {
  provide: TELEGRAF_TOKEN,
  useFactory: (configService: ConfigService) => {
    const logger = new Logger('telegrafProvider');
    const token = configService.get<string>('telegram.token');
    if (token == null) {
      logger.error(SYS_MESSAGES.TG_TOKEN_MISSING);
      return null;
    }

    return new Telegraf(token);
  },
  inject: [ConfigService],
};
