import {
  COLORS_TYPES,
  SIZES,
  WATERMARK_TYPES,
} from '@modules/watermark/watermark.types';

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
