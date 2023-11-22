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

import {
  ACTIONS,
  COMMANDS,
  COMMANDS_LIST,
  EVENTS,
  MESSAGES,
  SIZE_SETTINGS,
  SYS_MESSAGES,
} from './telegraf.constants';
import { TELEGRAF_TOKEN } from './telegraf.provider';
import { TelegrafUiServuce } from './telegraf.ui.service';

@Injectable()
export class TelegrafService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegrafService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly watermarkService: WatermarkService,
    private readonly uiService: TelegrafUiServuce,
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
    this.bot.telegram.setMyCommands(COMMANDS_LIST);
  }

  setListeners(): void {
    this.bot.start(this.onStart);
    this.bot.command(COMMANDS.SETTINGS, this.onSettings);
    this.bot.on(message(EVENTS.MESSAGES.PHOTO), this.onPhoto);
    this.bot.on(message(EVENTS.MESSAGES.TEXT), this.onText);
    this.bot.action(ACTIONS.SIZE, this.onSize);
    this.bot.action(ACTIONS.SETTINGS, this.onSettings);
    this.bot.action(ACTIONS.EXIT_SETTINGS, this.onExitSettings);
    this.bot.action(
      SIZE_SETTINGS.map((item) => item.data),
      this.onChangeSizeSettings,
    );
  }

  @Bind
  onStart(ctx: Context): void {
    ctx.reply(MESSAGES.WELCOME);
  }

  @Bind
  async onSize(ctx: Context): Promise<void> {
    if ('data' in ctx.callbackQuery) {
      ctx.editMessageText(
        MESSAGES.CHANGE_SIZE,
        this.uiService.sizeInlineKeyboard,
      );
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
    if ('command' in ctx) {
      ctx.replyWithMarkdownV2(
        MESSAGES.CHANGE_SETTINGS,
        this.uiService.settingsInlineKeyboard,
      );
    } else {
      ctx.editMessageText(
        MESSAGES.CHANGE_SETTINGS,
        this.uiService.settingsInlineKeyboard,
      );
    }
  }

  @Bind
  onChangeSizeSettings(ctx: Context): void {
    if ('data' in ctx.callbackQuery) {
      this.uiService.userSettings.size = ctx.callbackQuery.data;
      ctx.editMessageText(
        MESSAGES.CHANGE_SIZE,
        this.uiService.sizeInlineKeyboard,
      );
    } else {
      this.logger.error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  onExitSettings(ctx: Context): void {
    ctx.editMessageText(MESSAGES.UPDATE_SETTINGS);
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
