import {
  COLORS_TYPES,
  SIZES,
  WATERMARK_TYPES,
} from '@modules/watermark/watermark.constants';
import { BOT_STATES } from './telegraf.constants';

export const COLORS_T: Record<keyof typeof COLORS_TYPES, string> = {
  white: 'Белый',
  black: 'Черный',
};

export const WATERMARK_TYPES_T: Record<keyof typeof WATERMARK_TYPES, string> = {
  single: 'Одиночный',
  pattern: 'Повтор',
};

export const SIZES_T: Record<keyof typeof SIZES, string> = {
  l: 'Большой',
  m: 'Средний',
  s: 'Маленький',
};

export const BOT_STATES_T: Record<keyof typeof BOT_STATES, string> = {
  ADD_BG_PIC: 'добавление изображения',
  ADD_TEXT: 'добавления текста',
  ADD_PIC: 'выбора картинки',
  CHOOSE_WM_TYPE: 'выбора стиля расположения',
  CHOOSE_SIZE: 'выбора размера',
  CHOOSE_OPACITY: 'выбора прозрачности',
  CHOOSE_COLOR: 'выбора цвета',
  CHOOSE_POSITION: 'выбора расположения',
  CHOOSE_ROTATION: 'выбора угла',
};
