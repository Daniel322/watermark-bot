import { Test, TestingModule } from '@nestjs/testing';

import { TelegrafUiServuce } from './telegraf.ui.service';
import { ACTIONS, EMOJI, SETTINGS, SIZE_SETTINGS } from './telegraf.constants';

type CallbackButton = {
  callback_data: string;
  text: string;
  hide: boolean;
};

type InlineKeyboard = Array<CallbackButton[]> | CallbackButton[];

describe('TelegrafUiServuce', () => {
  let service: TelegrafUiServuce;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [TelegrafUiServuce],
    }).compile();

    service = module.get<TelegrafUiServuce>(TelegrafUiServuce);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('settingsInlineKeyboard', () => {
    it('Should return call of Markup inlineKeyboard with the settings keyboard', () => {
      const {
        reply_markup: { inline_keyboard },
      } = service.settingsInlineKeyboard;

      expect(inline_keyboard).toStrictEqual<InlineKeyboard>(
        expect.arrayContaining([
          expect.arrayContaining(
            SETTINGS.map(({ text, data }) =>
              expect.objectContaining({
                callback_data: data,
                text,
                hide: false,
              }),
            ),
          ),
          expect.arrayContaining([
            expect.objectContaining({
              callback_data: ACTIONS.EXIT_SETTINGS,
              text: 'Готово ✅',
              hide: false,
            }),
          ]),
        ]),
      );
      console.log(inline_keyboard);
    });
  });

  describe('sizeInlineKeyboard', () => {
    it('Should return call of Markup inlineKeyboard with the size keyboard', () => {
      const {
        reply_markup: { inline_keyboard },
      } = service.sizeInlineKeyboard;

      expect(inline_keyboard).toStrictEqual<InlineKeyboard>(
        expect.arrayContaining([
          expect.arrayContaining(
            SIZE_SETTINGS.map(({ text, data }) =>
              expect.objectContaining({
                callback_data: data,
                text: `${
                  data === service.userSettings.size
                    ? EMOJI.filledRadio
                    : EMOJI.emptyRadio
                } ${text}`,
                hide: false,
              }),
            ),
          ),
          expect.arrayContaining([
            expect.objectContaining({
              callback_data: ACTIONS.SETTINGS,
              text: 'Готово ✅',
              hide: false,
            }),
          ]),
        ]),
      );
      console.log(inline_keyboard);
    });
  });

  describe('backwardButton', () => {
    it('Should return callback button with given args', () => {
      const inlineKeyboard: CallbackButton = {
        text: 'some text',
        callback_data: 'data',
        hide: false,
      };

      expect(
        service.backwardButton(
          inlineKeyboard.text,
          inlineKeyboard.callback_data,
        ),
      ).toStrictEqual(expect.objectContaining(inlineKeyboard));
    });
  });
});
