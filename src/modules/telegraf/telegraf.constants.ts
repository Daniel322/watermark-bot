import { type BotCommand } from 'telegraf/typings/core/types/typegram';

import { type BotStates } from './telegraf.types';
import { BOT_STATES_T } from './telegraf.translations';

export const EMOJI = {
  CHECK_MARK: '✅',
  FILLED_RADIO: '●',
  EMPTY_RADIO: '○',
  OK_HAND: '👌',
  GEAR: '⚙️',
  PALETTE: '🎨',
  RULER: '📏',
  REPEAT: '🔁',
  ART: '🖼️',
  NOTE: '📝',
  CROSS: '❌',
  CONFUSED: '⁉️',
  HOORAY: '🙌',
  CHOOSE_NUMBER: '🔢',
  WHITE_SQUARE: '⬜',
  GLITTER: '✨',
  QUESTION_MARK: '❓',
  TOP_DOWN_ARROW: '↕️',
  CYCLE: '🔄',
  TOP_ARROW: '⬆️',
  TOP_RIGHT_ARROW: '↗️',
  RIGHT_ARROW: '➡️',
  BOTTOM_RIGTH_ARROW: '↘️',
  BOTTOM_ARROW: '⬇️',
  BOTTOM_LEFT_ARROW: '↙️',
  LEFT_ARROW: '⬅️',
  TOP_LEFT_ARROW: '↖️',
  RECORD: '⏺️',
};

export const MESSAGES = <const>{
  WELCOME: `${EMOJI.HOORAY} Добро пожаловать!\n\n${EMOJI.ART} Отправьте изображение для нанесения водного знака:`,
  BAD_REQUEST: `${EMOJI.CONFUSED} Что-то пошло не так. Попробуй еще раз`,
  ASK_TEXT: `${EMOJI.NOTE} Введите текст:`,
  ASK_WATERMARK: `${EMOJI.NOTE}/${EMOJI.ART} Введите текст или отправьте изображение:`,
  FILE_NOT_FOUND: `${EMOJI.CROSS} Фото не найдено. Начните заново с отправки фото`,
  CHANGE_SETTINGS: `${EMOJI.GEAR} Настройки:`,
  CHOOSE_SIZE: `${EMOJI.RULER} Выберите размер:`,
  UPDATE_SETTINGS: `${EMOJI.OK_HAND} Настройки обновлены`,
  CHOOSE_COLOR: `${EMOJI.PALETTE} Выберите цвет:`,
  CHOOSE_PLACEMENT_STYLE: `${EMOJI.CHOOSE_NUMBER} Выберите стиль расположения:`,
  CHOOSE_OPACITY: `${EMOJI.WHITE_SQUARE} Выберите прозрачность:`,
  COMPLETE: `${EMOJI.GLITTER} Ваш результат:`,
  HELP: `${EMOJI.QUESTION_MARK} Чтобы начать, отправьте изображение, на которое хотите поместить водяной знак`,
  USER_STATE_NOT_FOUND: `${EMOJI.REPEAT} Активная сессия не найдена. Начните заново с отправки изображения`,
  CONTINUE_FROM_STATE(state: BotStates): string {
    return `${EMOJI.CROSS} Нельзя выполнить данное действие\nПродолжите с ${BOT_STATES_T[state]} или начните заново с отправки фото`;
  },
  CHOOSE_POSITION: `${EMOJI.TOP_DOWN_ARROW} Выберите расположение:`,
  CHOOSE_ROTATION: `${EMOJI.CYCLE} Введите угол поворота в градусах:`,
  ROTATION_PARSE_ERROR: `${EMOJI.CROSS} Невозможно обработать входные данные. Введите число:`,
  ONLY_IMAGES_AVAILABILE: `${EMOJI.CROSS} Отправьте изображение`,
};

export const SYS_MESSAGES = <const>{
  NO_FILE_IN_MESSAGE: 'NO_FILE_IN_MESSAGE',
  FILE_REQUEST_ERROR: 'FILE_REQUEST_ERROR',
  FILE_BUF_NOT_FOUND: 'FILE_BUF_NOT_FOUND',
  TG_TOKEN_MISSING: 'TG_TOKEN_MISSING',
  NO_TEXT_IN_MESSAGE: 'NO_TEXT_IN_MESSAGE',
  NO_PHOTO_IN_MESSAGE: 'NO_PHOTO_IN_MESSAGE',
  UNKNOWN_ACTION: 'UNKNOWN_ACTION',
  NO_DATA_ON_CHANGE_SIZE: 'NO_DATA_ON_CHANGE_SIZE',
  USER_STATE_NOT_FOUND: 'USER_STATE_NOT_FOUND',
  WRONG_STATE_ON_TEXT: 'WRONG_STATE_ON_TEXT',
  UNHANDLED_STATE_TO_SKIP: 'UNHANDLED_STATE_TO_SKIP',
  NO_DOCUMENT_IN_MESSAGE: 'NO_DOCUMENT_IN_MESSAGE',
};

export const COMMANDS = <const>{
  HELP: 'help',
};

export const ACTIONS = <const>{
  OPACITY: 'opacity',
  POSITION: 'positon',
  ROTATION: 'rotation',
  SKIP: 'skip',
};

export const COMMANDS_LIST: BotCommand[] = [
  { command: 'help', description: 'Помощь' },
];

export const EVENTS = <const>{
  MESSAGES: {
    PHOTO: 'photo',
    TEXT: 'text',
    DOCUMENT: 'document',
  },
};

export const BOT_STATES = <const>{
  ADD_BG_PIC: 'ADD_BG_PIC',
  ADD_WATERMARK: 'ADD_WATERMARK',
  CHOOSE_WM_TYPE: 'CHOOSE_WM_TYPE',
  CHOOSE_POSITION: 'CHOOSE_POSITION',
  CHOOSE_ROTATION: 'CHOOSE_ROTATION',
  CHOOSE_SIZE: 'CHOOSE_SIZE',
  CHOOSE_OPACITY: 'CHOOSE_OPACITY',
  CHOOSE_COLOR: 'CHOOSE_COLOR',
};
