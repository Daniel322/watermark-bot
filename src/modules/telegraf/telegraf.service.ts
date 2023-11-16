import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, type Context } from 'telegraf';

import { Bind } from '@common/decorators';

@Injectable()
export class TelegrafService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const token = this.configService.get<string>('telegram.token');
    if (token) {
      this.bot = new Telegraf(token);
      this.setListeners();
      this.bot.launch();
    }
  }

  onModuleDestroy() {
    this.bot.stop('SIGINT');
    this.bot.stop('SIGTERM');
  }

  setListeners(): void {
    this.bot.start(this.onStart);
  }

  @Bind
  onStart(ctx: Context): void {
    ctx.reply('Welcome');
  }
}
