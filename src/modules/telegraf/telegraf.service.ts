import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, type Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Bind } from '@common/decorators';

import { MESSAGES, SYS_MESSAGES } from './constants';

@Injectable()
export class TelegrafService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

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
    this.bot.on(message('photo'), this.onPhoto);
  }

  @Bind
  onStart(ctx: Context): void {
    ctx.reply(MESSAGES.WELCOME);
  }

  @Bind
  async onPhoto(ctx: Context): Promise<void> {
    try {
      if ('photo' in ctx.message) {
        const [file] = ctx.message.photo;
        if (file == null) throw new Error(SYS_MESSAGES.NO_FILE_IN_MESSAGE);

        const fileLink = await this.bot.telegram.getFileLink(file.file_id);
        const buf = await this.getFile(fileLink.href);
        // TODO add saving buffer into cache with user id as key
        await ctx.reply(MESSAGES.ASK_TEXT);
      }
    } catch(error) {
      console.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  async getFile(url: string): Promise<ArrayBuffer> {
    try {
      const request = this.httpService.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
      const { data } = await firstValueFrom(request);
      return data;
    } catch(error) {
      throw new Error(SYS_MESSAGES.FILE_REQUEST_ERROR);
    }
  }
}
