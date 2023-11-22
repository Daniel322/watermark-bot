import { type BotCommand } from 'telegraf/typings/core/types/typegram';

export const EMOJI = {
  checkMark: '✅',
  filledRadio: '●',
  emptyRadio: '○',
  okHand: '👌',
  gear: '⚙️',
};

export const MESSAGES = <const>{
  WELCOME:
    'Добро пожаловать!\nОтправьте изображение для нанесения водного знака',
  BAD_REQUEST: 'Что-то пошло не так. Попробуй еще раз',
  ASK_TEXT: 'Отправьте текст',
  FILE_NOT_FOUND: 'Фото не найдено. Начните заново с отправки фото',
  CHANGE_SETTINGS: `${EMOJI.gear} Настройки:`,
  CHANGE_SIZE: 'Выберите размер:',
  UPDATE_SETTINGS: `${EMOJI.okHand} Настройки обновлены`,
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
};

export const SETTINGS = <const>[{ text: 'Размер', data: 'size' }];

export const SIZE_SETTINGS = <const>[
  { text: 'S', data: 's' },
  { text: 'M', data: 'm' },
  { text: 'L', data: 'l' },
];

export const COMMANDS = <const>{
  SETTINGS: 'settings',
};

export const ACTIONS = <const>{
  SIZE: 'size',
  SETTINGS: 'settings',
  EXIT_SETTINGS: 'exit-settings',
};

export const COMMANDS_LIST: BotCommand[] = [
  { command: 'settings', description: 'Настройки' },
];

export const EVENTS = <const>{
  MESSAGES: {
    PHOTO: 'photo',
    TEXT: 'text',
  },
};
