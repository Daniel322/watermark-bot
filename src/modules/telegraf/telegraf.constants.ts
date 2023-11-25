import { type BotCommand } from 'telegraf/typings/core/types/typegram';

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
};

export const MESSAGES = <const>{
  WELCOME: `${EMOJI.HOORAY} Добро пожаловать!\n\n${EMOJI.ART} Отправьте изображение для нанесения водного знака:`,
  BAD_REQUEST: `${EMOJI.CONFUSED} Что-то пошло не так. Попробуй еще раз`,
  ASK_TEXT: `${EMOJI.NOTE} Введите текст:`,
  FILE_NOT_FOUND: `${EMOJI.CROSS} Фото не найдено. Начните заново с отправки фото`,
  CHANGE_SETTINGS: `${EMOJI.GEAR} Настройки:`,
  CHOOSE_SIZE: `${EMOJI.RULER} Выберите размер:`,
  UPDATE_SETTINGS: `${EMOJI.OK_HAND} Настройки обновлены`,
  CHOOSE_COLOR: `${EMOJI.PALETTE} Выберите цвет:`,
  CHOOSE_PLACEMENT_STYLE: `${EMOJI.CHOOSE_NUMBER} Выберите стиль расположения:`,
  CHOOSE_OPACITY: `${EMOJI.WHITE_SQUARE} Выберите прозрачность:`,
  COMPLETE: `${EMOJI.GLITTER} Ваш результат:`,
  HELP: `${EMOJI.QUESTION_MARK} Чтобы начать, отправьте изображение, на которое хотите поместить водяной знак`,
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

export const COMMANDS = <const>{
  HELP: 'help',
};

export const ACTIONS = <const>{
  OPACITY: 'opacity',
};

export const COMMANDS_LIST: BotCommand[] = [
  { command: 'help', description: 'Помощь' },
];

export const EVENTS = <const>{
  MESSAGES: {
    PHOTO: 'photo',
    TEXT: 'text',
  },
};
