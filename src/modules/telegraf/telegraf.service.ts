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
  COLORS_TYPES,
  Color,
  SIZES,
  Size,
  WATERMARK_TYPES,
  WatermarkType,
} from '@modules/watermark/watermark.types';

import {
  ACTIONS,
  COMMANDS,
  COMMANDS_LIST,
  EVENTS,
  MESSAGES,
  SYS_MESSAGES,
} from './telegraf.constants';
import { TELEGRAF_TOKEN } from './telegraf.provider';
import { TelegrafUiServuce } from './telegraf.ui.service';
import { TmpTypeName } from './telegraf.types';

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
    this.bot.command(COMMANDS.HELP, this.onHelp);
    this.bot.on(message(EVENTS.MESSAGES.PHOTO), this.onPhoto);
    this.bot.on(message(EVENTS.MESSAGES.TEXT), this.onText);
    this.bot.action(Object.values(COLORS_TYPES), this.onColor);
    this.bot.action(Object.values(WATERMARK_TYPES), this.onPlacementStyle);
    this.bot.action(Object.values(SIZES), this.onSize);
    this.bot.action(new RegExp(ACTIONS.OPACITY), this.onOpacity);
  }

  @Bind
  onStart(ctx: Context): void {
    ctx.reply(MESSAGES.WELCOME);
  }

  @Bind
  async onPhoto(ctx: Context): Promise<void> {
    try {
      if ('photo' in ctx.message) {
        const { photo, from } = ctx.message;
        // with highest resolution
        const file = photo.at(-1);

        if (file == null) throw new Error(SYS_MESSAGES.NO_FILE_IN_MESSAGE);

        const fileLink = await this.bot.telegram.getFileLink(file.file_id);
        const arrayBuffer = await this.getFile(fileLink.href);

        const ttl = this.configService.get<number>('cache.fileBufTtl');

        await this.cacheManager.set(
          String(from.id),
          { file: Buffer.from(arrayBuffer).buffer, text: '' },
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
  async onText(ctx: Context): Promise<void> {
    try {
      if ('text' in ctx.message) {
        const { from, text } = ctx.message;

        const userInput = await this.cacheManager.get<TmpTypeName>(
          String(from.id),
        );

        if (userInput.file == null) {
          throw new Error(SYS_MESSAGES.FILE_BUF_NOT_FOUND);
        }

        const ttl = this.configService.get<number>('cache.fileBufTtl');

        userInput.text = text;

        await this.cacheManager.set(String(from.id), userInput, ttl);

        await ctx.replyWithMarkdownV2(
          MESSAGES.CHOOSE_PLACEMENT_STYLE,
          this.uiService.patternTypeKeyboard,
        );
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
  async onPlacementStyle(ctx: Context): Promise<void> {
    if ('data' in ctx.callbackQuery) {
      const { data, from } = ctx.callbackQuery;

      const userInput = await this.cacheManager.get<TmpTypeName>(
        String(from.id),
      );

      const ttl = this.configService.get<number>('cache.fileBufTtl');

      userInput.type = data as WatermarkType;

      await this.cacheManager.set(String(from.id), userInput, ttl);

      await ctx.editMessageText(
        MESSAGES.CHOOSE_SIZE,
        this.uiService.sizeKeyboard,
      );
    } else {
      this.logger.error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onSize(ctx: Context): Promise<void> {
    if ('data' in ctx.callbackQuery) {
      const { data, from } = ctx.callbackQuery;

      const userInput = await this.cacheManager.get<TmpTypeName>(
        String(from.id),
      );

      const ttl = this.configService.get<number>('cache.fileBufTtl');

      userInput.size = data as Size;

      await this.cacheManager.set(String(from.id), userInput, ttl);

      await ctx.editMessageText(
        MESSAGES.CHOOSE_OPACITY,
        this.uiService.opacityKeyboard,
      );
    } else {
      this.logger.error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onOpacity(ctx: Context): Promise<void> {
    if ('data' in ctx.callbackQuery) {
      const { data, from } = ctx.callbackQuery;

      const userInput = await this.cacheManager.get<TmpTypeName>(
        String(from.id),
      );

      const ttl = this.configService.get<number>('cache.fileBufTtl');

      const [, rawOpacity] = data.split('|');

      userInput.opacity = Number(rawOpacity);

      await this.cacheManager.set(String(from.id), userInput, ttl);

      await ctx.editMessageText(
        MESSAGES.CHOOSE_COLOR,
        this.uiService.colorKeyboard,
      );
    } else {
      this.logger.error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onColor(ctx: Context): Promise<void> {
    if ('data' in ctx.callbackQuery) {
      const { data, from } = ctx.callbackQuery;

      const userInput = await this.cacheManager.get<TmpTypeName>(
        String(from.id),
      );

      userInput.color = data as Color;

      const bufWithWatermark =
        await this.watermarkService.createImageWithTextWatermark(userInput);
      await Promise.all([
        ctx.editMessageText(MESSAGES.COMPLETE),
        ctx.replyWithPhoto({ source: bufWithWatermark }),
      ]);
    } else {
      this.logger.error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  onHelp(ctx: Context): void {
    ctx.reply(MESSAGES.HELP);
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
