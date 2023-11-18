import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, type Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { Bind } from '@common/decorators';
import { WatermarkService } from '@modules/watermark/watermark.service';

import { MESSAGES, SYS_MESSAGES } from './constants';
import { TELEGRAF_TOKEN } from './telegraf-provider';

@Injectable()
export class TelegrafService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegrafService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly watermarkService: WatermarkService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Optional()
    @Inject(TELEGRAF_TOKEN)
    private readonly bot: Telegraf,
  ) {}

  onModuleInit(): void {
    if (this.bot != null) {
      this.setListeners();
      this.bot.launch();
    }
  }

  onModuleDestroy() {
    if (this.bot != null) {
      this.bot.stop('SIGINT');
      this.bot.stop('SIGTERM');
    }
  }

  setListeners(): void {
    this.bot.start(this.onStart);
    this.bot.on(message('photo'), this.onPhoto);
    this.bot.on(message('text'), this.onText);
  }

  @Bind
  onStart(ctx: Context): void {
    ctx.reply(MESSAGES.WELCOME);
  }

  @Bind
  async onText(ctx: Context): Promise<void> {
    try {
      if ('text' in ctx.message) {
        const { from, text } = ctx.message;

        const buf = await this.cacheManager.get<Buffer>(String(from.id));
        if (buf == null) throw new Error(SYS_MESSAGES.FILE_BUF_NOT_FOUND);

        const bufWithWatermark =
          await this.watermarkService.setWatermarkOnPhotoForTelegraf(buf, text);
        await ctx.replyWithPhoto({ source: bufWithWatermark });
      } else {
        await ctx.reply(MESSAGES.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.FILE_NOT_FOUND);
    }
  }

  @Bind
  async onPhoto(ctx: Context): Promise<void> {
    try {
      if ('photo' in ctx.message) {
        const { photo, from } = ctx.message;
        const file = photo.at(-1);

        if (file == null) throw new Error(SYS_MESSAGES.NO_FILE_IN_MESSAGE);

        const fileLink = await this.bot.telegram.getFileLink(file.file_id);
        const arrayBuffer = await this.getFile(fileLink.href);

        const ttl = this.configService.get<number>('cache.fileBufTtl');
        await this.cacheManager.set(
          String(from.id),
          Buffer.from(arrayBuffer),
          ttl,
        );

        await ctx.reply(MESSAGES.ASK_TEXT);
      }
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  async getFile(url: string): Promise<ArrayBuffer> {
    try {
      const request = this.httpService.get<Buffer>(url, {
        responseType: 'arraybuffer',
      });
      const { data } = await firstValueFrom(request);
      return data;
    } catch (error) {
      throw new Error(SYS_MESSAGES.FILE_REQUEST_ERROR);
    }
  }
}