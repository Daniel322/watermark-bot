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
  BOT_STATES,
  COMMANDS,
  COMMANDS_LIST,
  EVENTS,
  MESSAGES,
  SYS_MESSAGES,
} from './telegraf.constants';
import { TELEGRAF_TOKEN } from './telegraf.provider';
import { TelegrafUiServuce } from './telegraf.ui.service';
import { TelegrafUsersStatesService } from './telegraf.users-states.service';
import { BotStates } from './telegraf.types';

@Injectable()
export class TelegrafService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegrafService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly watermarkService: WatermarkService,
    private readonly uiService: TelegrafUiServuce,
    private readonly userStatesService: TelegrafUsersStatesService,
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
      if (!('photo' in ctx.message)) {
        throw new Error(SYS_MESSAGES.NO_PHOTO_IN_MESSAGE);
      }

      const { photo, from } = ctx.message;
      // with highest resolution
      const file = photo.at(-1);

      if (file == null) throw new Error(SYS_MESSAGES.NO_FILE_IN_MESSAGE);

      this.userStatesService.add(from.id);

      const fileLink = await this.bot.telegram.getFileLink(file.file_id);
      const arrayBuffer = await this.getFile(fileLink.href);

      this.userStatesService.update(from.id, {
        file: Buffer.from(arrayBuffer),
      });
      this.userStatesService.goto(from.id, BOT_STATES.ADD_TEXT);

      await ctx.reply(MESSAGES.ASK_TEXT);
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onText(ctx: Context): Promise<void> {
    try {
      if (!('text' in ctx.message)) {
        throw new Error(SYS_MESSAGES.NO_TEXT_IN_MESSAGE);
      }

      const { from, text } = ctx.message;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      const isSuccess = this.userStatesService.goto(
        from.id,
        BOT_STATES.CHOOSE_WM_TYPE,
      );

      if (!isSuccess) {
        const state = this.userStatesService.getState(from.id);
        return this.cannotTransistToStateReply(ctx, state);
      }

      this.userStatesService.update(from.id, { text });

      await ctx.replyWithMarkdownV2(
        MESSAGES.CHOOSE_PLACEMENT_STYLE,
        this.uiService.patternTypeKeyboard,
      );
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onPlacementStyle(ctx: Context): Promise<void> {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      const isSuccess = this.userStatesService.goto(
        from.id,
        BOT_STATES.CHOOSE_SIZE,
      );

      if (!isSuccess) {
        const state = this.userStatesService.getState(from.id);
        return this.cannotTransistToStateReply(ctx, state);
      }

      this.userStatesService.update(from.id, { type: data as WatermarkType });

      await ctx.editMessageText(
        MESSAGES.CHOOSE_SIZE,
        this.uiService.sizeKeyboard,
      );
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onSize(ctx: Context): Promise<void> {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      const isSuccess = this.userStatesService.goto(
        from.id,
        BOT_STATES.CHOOSE_OPACITY,
      );

      if (!isSuccess) {
        const state = this.userStatesService.getState(from.id);
        return this.cannotTransistToStateReply(ctx, state);
      }

      this.userStatesService.update(from.id, { size: data as Size });

      await ctx.editMessageText(
        MESSAGES.CHOOSE_OPACITY,
        this.uiService.opacityKeyboard,
      );
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onOpacity(ctx: Context): Promise<void> {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      const isSuccess = this.userStatesService.goto(
        from.id,
        BOT_STATES.CHOOSE_COLOR,
      );

      if (!isSuccess) {
        const state = this.userStatesService.getState(from.id);
        return this.cannotTransistToStateReply(ctx, state);
      }

      const [, rawOpacity] = data.split('|');

      this.userStatesService.update(from.id, { opacity: Number(rawOpacity) });

      await ctx.editMessageText(
        MESSAGES.CHOOSE_COLOR,
        this.uiService.colorKeyboard,
      );
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  async onColor(ctx: Context): Promise<void> {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      this.userStatesService.update(from.id, { color: data as Color });

      const selectedOptions = this.userStatesService.getStateData(from.id);

      const bufWithWatermark =
        await this.watermarkService.createImageWithTextWatermark(
          selectedOptions,
        );

      await Promise.all([
        ctx.editMessageText(MESSAGES.COMPLETE),
        ctx.replyWithPhoto({ source: bufWithWatermark }),
      ]);

      this.userStatesService.remove(from.id);
    } catch (error) {
      this.logger.error(error.message);
      await ctx.reply(MESSAGES.BAD_REQUEST);
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

  stateNotFoundReply(ctx: Context): void {
    ctx.reply(MESSAGES.USER_STATE_NOT_FOUND);
  }

  cannotTransistToStateReply(ctx: Context, state: BotStates): void {
    ctx.reply(MESSAGES.CONTINUE_FROM_STATE(state));
  }
}
