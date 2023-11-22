import { Injectable } from '@nestjs/common';
import { ACTIONS, EMOJI, SETTINGS, SIZE_SETTINGS } from './telegraf.constants';
import { Markup } from 'telegraf';

@Injectable()
export class TelegrafUiServuce {
  userSettings = {
    size: 'm',
  };

  backwardButton(text, data: string) {
    return Markup.button.callback(text, data);
  }

  get settingsInlineKeyboard() {
    return Markup.inlineKeyboard([
      SETTINGS.map(({ text, data }) => Markup.button.callback(text, data)),
      [this.backwardButton('Готово ✅', ACTIONS.EXIT_SETTINGS)],
    ]);
  }

  get sizeInlineKeyboard() {
    const buttons = [
      SIZE_SETTINGS.map(({ text, data }) =>
        Markup.button.callback(
          `${
            data === this.userSettings.size
              ? EMOJI.filledRadio
              : EMOJI.emptyRadio
          } ${text}`,
          data,
        ),
      ),
      [this.backwardButton('Готово ✅', ACTIONS.SETTINGS)],
    ];
    return Markup.inlineKeyboard(buttons);
  }
}
