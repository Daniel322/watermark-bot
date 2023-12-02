import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';

import {
  COLORS_TYPES,
  POSITION_TYPES,
  SIZES,
  WATERMARK_TYPES,
} from '@modules/watermark/watermark.constants';

import { COLORS_T, SIZES_T, WATERMARK_TYPES_T } from './telegraf.translations';
import { ACTIONS, BOT_STATES, EMOJI } from './telegraf.constants';

@Injectable()
export class TelegrafUiServuce {
  get sizeKeyboard() {
    const buttons = [];

    for (const key in SIZES) {
      const text = SIZES_T[key] ?? key;
      const val = SIZES[key];
      buttons.push(Markup.button.callback(text, val));
    }
    return Markup.inlineKeyboard([
      buttons,
      [
        Markup.button.callback(
          'Пропустить',
          `${ACTIONS.SKIP}|${BOT_STATES.CHOOSE_OPACITY}`,
        ),
      ],
    ]);
  }

  get colorKeyboard() {
    const buttons = [];

    for (const key in COLORS_TYPES) {
      const text = COLORS_T[key] ?? key;
      const val = COLORS_TYPES[key];
      buttons.push(Markup.button.callback(text, val));
    }

    return Markup.inlineKeyboard([
      buttons,
      [Markup.button.callback('Пропустить', ACTIONS.SKIP)],
    ]);
  }

  get patternTypeKeyboard() {
    const buttons = [];

    for (const key in WATERMARK_TYPES) {
      const text = WATERMARK_TYPES_T[key] ?? key;
      const val = WATERMARK_TYPES[key];
      buttons.push(Markup.button.callback(text, val));
    }

    return Markup.inlineKeyboard([
      buttons,
      [
        Markup.button.callback(
          'Пропустить',
          `${ACTIONS.SKIP}|${BOT_STATES.CHOOSE_POSITION}`,
        ),
      ],
    ]);
  }

  get opacityKeyboard() {
    const buttons = [[], [], [], []];

    for (let i = 10; i <= 100; i += 10) {
      const length = buttons[buttons.length - 1].push(
        Markup.button.callback(`${i}%`, `${ACTIONS.OPACITY}|${i / 100}`),
      );
      if (length === 3) buttons.push([]);
    }
    buttons.push([
      Markup.button.callback(
        'Пропустить',
        `${ACTIONS.SKIP}|${BOT_STATES.CHOOSE_COLOR}`,
      ),
    ]);
    return Markup.inlineKeyboard(buttons);
  }

  get positionKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          EMOJI.TOP_LEFT_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.topLeft}`,
        ),
        Markup.button.callback(
          EMOJI.TOP_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.topCenter}`,
        ),
        Markup.button.callback(
          EMOJI.TOP_RIGHT_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.topRight}`,
        ),
      ],
      [
        Markup.button.callback(
          EMOJI.LEFT_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.centerLeft}`,
        ),
        Markup.button.callback(
          EMOJI.RECORD,
          `${ACTIONS.POSITION}|${POSITION_TYPES.centerCenter}`,
        ),
        Markup.button.callback(
          EMOJI.RIGHT_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.centerRight}`,
        ),
      ],
      [
        Markup.button.callback(
          EMOJI.BOTTOM_LEFT_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.bottomLeft}`,
        ),
        Markup.button.callback(
          EMOJI.BOTTOM_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.bottomCenter}`,
        ),
        Markup.button.callback(
          EMOJI.BOTTOM_RIGTH_ARROW,
          `${ACTIONS.POSITION}|${POSITION_TYPES.bottomRight}`,
        ),
      ],
      [
        Markup.button.callback(
          'Пропустить',
          `${ACTIONS.SKIP}|${BOT_STATES.CHOOSE_SIZE}`,
        ),
      ],
    ]);
  }
}
