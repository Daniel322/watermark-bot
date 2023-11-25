import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';

import {
  COLORS_TYPES,
  SIZES,
  WATERMARK_TYPES,
} from '@modules/watermark/watermark.types';

import { COLORS_T, SIZES_T, WATERMARK_TYPES_T } from './telegraf.translations';
import { ACTIONS } from './telegraf.constants';

@Injectable()
export class TelegrafUiServuce {
  get sizeKeyboard() {
    const buttons = [];

    for (const key in SIZES) {
      const text = SIZES_T[key] ?? key;
      const val = SIZES[key];
      buttons.push(Markup.button.callback(text, val));
    }
    return Markup.inlineKeyboard([buttons]);
  }

  get colorKeyboard() {
    const buttons = [];

    for (const key in COLORS_TYPES) {
      const text = COLORS_T[key] ?? key;
      const val = COLORS_TYPES[key];
      buttons.push(Markup.button.callback(text, val));
    }

    return Markup.inlineKeyboard([buttons]);
  }

  get patternTypeKeyboard() {
    const buttons = [];

    for (const key in WATERMARK_TYPES) {
      const text = WATERMARK_TYPES_T[key] ?? key;
      const val = WATERMARK_TYPES[key];
      buttons.push(Markup.button.callback(text, val));
    }

    return Markup.inlineKeyboard([buttons]);
  }

  get opacityKeyboard() {
    const buttons = [[], [], [], []];

    for (let i = 10; i <= 100; i += 10) {
      const length = buttons[buttons.length - 1].push(
        Markup.button.callback(`${i}%`, `${ACTIONS.OPACITY}|${i / 100}`),
      );
      if (length === 3) buttons.push([]);
    }

    return Markup.inlineKeyboard(buttons);
  }
}
