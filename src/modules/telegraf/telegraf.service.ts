import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, type Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { Bind } from '@common/decorators';
import { WatermarkService } from '@modules/watermark/watermark.service';

import { MESSAGES, SYS_MESSAGES } from './telegraf.constants';
import { TELEGRAF_TOKEN } from './telegraf.provider';

@Injectable()
export class TelegrafService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegrafService.name);

  settings = {
    size: 'm',
  };

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
      this.setCommands();
      this.bot.launch();
    }
  }

  onModuleDestroy() {
    if (this.bot != null) {
      this.bot.stop('SIGINT');
      this.bot.stop('SIGTERM');
    }
  }

  setCommands(): void {
    this.bot.telegram.setMyCommands([
      {
        command: 'settings',
        description: 'Settings',
      },
    ]);
  }

  setListeners(): void {
    this.bot.start(this.onStart);
    this.bot.command('settings', this.onSettings);
    this.bot.on(message('photo'), this.onPhoto);
    this.bot.on(message('text'), this.onText);
    this.bot.action('size', this.onSize);
  }

  @Bind
  onStart(ctx: Context): void {
    ctx.reply(MESSAGES.WELCOME);
  }

  @Bind
  onSize(ctx: Context): void {
    if ('data' in ctx.callbackQuery) {
      console.log(ctx.callbackQuery.data);
    } else {
      this.logger.error(SYS_MESSAGES.UNKNOWN_ACTION);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onText(ctx: Context): Promise<void> {
    try {
      if ('text' in ctx.message) {
        const { from, text } = ctx.message;

        const buf = await this.cacheManager.get<Buffer>(String(from.id));
        if (buf == null) throw new Error(SYS_MESSAGES.FILE_BUF_NOT_FOUND);

        const bufWithWatermark =
          await this.watermarkService.setWatermarkOnPhotoForTelegraf({
            file: buf,
            text,
            options: {
              // TODO replace to size from settings
              size: 'l',
            },
          });
        await ctx.replyWithPhoto({ source: bufWithWatermark });
      } else {
        this.logger.error(SYS_MESSAGES.NO_TEXT_IN_MESSAGE);
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
          Buffer.from(arrayBuffer).buffer,
          ttl,
        );

        await ctx.reply(MESSAGES.ASK_TEXT);
      } else {
        throw new Error(SYS_MESSAGES.NO_PHOTO_IN_MESSAGE);
      }
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  onSettings(ctx: Context): void {
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('Размер', 'size')],
    ]);
    ctx.replyWithMarkdownV2('test', buttons);
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
