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
import { User } from '@telegraf/types';

import { Bind } from '@common/decorators';
import { WatermarkService } from '@modules/watermark/watermark.service';
import {
  COLORS_TYPES,
  Color,
  PositionType,
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
    this.bot.action(new RegExp(ACTIONS.POSITION), this.onPosition);
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
  onText(ctx: Context): void {
    try {
      if (!('text' in ctx.message)) {
        throw new Error(SYS_MESSAGES.NO_TEXT_IN_MESSAGE);
      }

      const { from, text } = ctx.message;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      const state = this.userStatesService.getState(from.id);

      if (state === BOT_STATES.ADD_TEXT) {
        return this.onWatermarkText(ctx, from.id, text);
      }
      if (state === BOT_STATES.CHOOSE_ROTATION) {
        return this.onRotationText(ctx, from.id, text);
      }

      throw new Error(SYS_MESSAGES.WRONG_STATE_ON_TEXT);
    } catch (error) {
      this.logger.error(error.message);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  onWatermarkText(ctx, id: number, text: string): void {
    if (!this.tryTransistToGivenState(ctx, id, BOT_STATES.CHOOSE_WM_TYPE)) {
      return;
    }

    this.userStatesService.update(id, { text });

    ctx.replyWithMarkdownV2(
      MESSAGES.CHOOSE_PLACEMENT_STYLE,
      this.uiService.patternTypeKeyboard,
    );
  }

  onRotationText(ctx, id: number, text: string): void {
    const rotate = Number(text);
    if (Number.isNaN(rotate)) {
      ctx.reply(MESSAGES.ROTATION_PARSE_ERROR);
    } else {
      if (!this.tryTransistToGivenState(ctx, id, BOT_STATES.CHOOSE_SIZE)) {
        return;
      }

      this.userStatesService.update(id, {
        rotate,
      });

      ctx.replyWithMarkdownV2(
        MESSAGES.CHOOSE_SIZE,
        this.uiService.sizeKeyboard,
      );
    }
  }

  @Bind
  onPlacementStyle(ctx: Context): void {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      if (
        !this.tryTransistToGivenState(ctx, from.id, BOT_STATES.CHOOSE_POSITION)
      ) {
        return;
      }

      this.userStatesService.update(from.id, { type: data as WatermarkType });

      ctx.editMessageText(
        MESSAGES.CHOOSE_POSITION,
        this.uiService.positionKeyboard,
      );
    } catch (error) {
      this.logger.error(error.message);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  onPosition(ctx: Context): void {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      if (!this.tryTransistToGivenState(ctx, from.id, BOT_STATES.CHOOSE_SIZE)) {
        return;
      }

      const [, position] = data.split('|') as [string, PositionType];

      this.userStatesService.update(from.id, {
        position,
      });

      ctx.editMessageText(MESSAGES.CHOOSE_SIZE, this.uiService.sizeKeyboard);
    } catch (error) {
      this.logger.error(error.message);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  onSize(ctx: Context): void {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      if (
        !this.tryTransistToGivenState(ctx, from.id, BOT_STATES.CHOOSE_OPACITY)
      ) {
        return;
      }

      this.userStatesService.update(from.id, { size: data as Size });

      ctx.editMessageText(
        MESSAGES.CHOOSE_OPACITY,
        this.uiService.opacityKeyboard,
      );
    } catch (error) {
      this.logger.error(error.message);
      ctx.reply(MESSAGES.BAD_REQUEST);
    }
  }

  @Bind
  onOpacity(ctx: Context): void {
    try {
      if (!('data' in ctx.callbackQuery)) {
        throw new Error(SYS_MESSAGES.NO_DATA_ON_CHANGE_SIZE);
      }

      const { data, from } = ctx.callbackQuery;

      if (!this.userStatesService.hasState(from.id)) {
        this.logger.error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
        return this.stateNotFoundReply(ctx);
      }

      if (
        !this.tryTransistToGivenState(ctx, from.id, BOT_STATES.CHOOSE_COLOR)
      ) {
        return;
      }

      const [, rawOpacity] = data.split('|');

      this.userStatesService.update(from.id, { opacity: Number(rawOpacity) });

      ctx.editMessageText(MESSAGES.CHOOSE_COLOR, this.uiService.colorKeyboard);
    } catch (error) {
      this.logger.error(error.message);
      ctx.reply(MESSAGES.BAD_REQUEST);
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

      const { file, text, ...options } = this.userStatesService.getStateData(
        from.id,
      );

      const bufWithWatermark =
        await this.watermarkService.createImageWithTextWatermark({
          file,
          text,
          options,
        });

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

  tryTransistToGivenState(
    ctx: Context,
    id: User['id'],
    state: BotStates,
  ): boolean {
    const isSuccess = this.userStatesService.goto(id, state);

    if (!isSuccess) {
      const state = this.userStatesService.getState(id);
      if (ctx.callbackQuery != null) {
        ctx.editMessageText(MESSAGES.CONTINUE_FROM_STATE(state));
      } else {
        ctx.reply(MESSAGES.CONTINUE_FROM_STATE(state));
      }
      return false;
    }

    return true;
  }

  stateNotFoundReply(ctx: Context): void {
    if (ctx.callbackQuery != null) {
      ctx.editMessageText(MESSAGES.USER_STATE_NOT_FOUND);
    } else {
      ctx.reply(MESSAGES.USER_STATE_NOT_FOUND);
    }
  }
}
