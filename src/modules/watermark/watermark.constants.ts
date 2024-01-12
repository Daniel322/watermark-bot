import { Color, Size, SizeData } from './watermark.types';

export const POSITION_COORDINATES_COEFFICIENTS = {
  s: {
    top: {
      center: 0.45,
      bottom: 0.9,
    },
    left: {
      center: 0.45,
      right: 0.9,
    },
  },
  m: {
    top: {
      center: 0.4,
      bottom: 0.8,
    },
    left: {
      center: 0.4,
      right: 0.8,
    },
  },
  l: {
    top: {
      center: 0.35,
      bottom: 0.7,
    },
    left: {
      center: 0.35,
      right: 0.7,
    },
  },
} as const;

export const PATTERNS_FOR_COMPOSITE = {
  s: { rows: 4, columns: 4 },
  m: { rows: 3, columns: 3 },
  l: { rows: 2, columns: 2 },
} as const;

export const SIZE_COEFFICIENTS: Record<Size, number> = {
  s: 0.1,
  m: 0.2,
  l: 0.3,
};

export const SIZES = {
  s: 's',
  m: 'm',
  l: 'l',
} as const;

export const WATERMARK_TYPES = {
  single: 'single',
  pattern: 'pattern',
} as const;

export const COLORS_TYPES = {
  white: 'white',
  black: 'black',
} as const;

export const POSITION_TYPES = {
  topLeft: 'topLeft',
  topCenter: 'topCenter',
  topRight: 'topRight',
  centerLeft: 'centerLeft',
  centerCenter: 'centerCenter',
  centerRight: 'centerRight',
  bottomLeft: 'bottomLeft',
  bottomCenter: 'bottomCenter',
  bottomRight: 'bottomRight',
} as const;

export const DICTIONARY: Record<Size, SizeData> = {
  s: {
    weightCoefficient: 0.3,
    defaultFontSize: 30,
  },
  m: {
    weightCoefficient: 0.5,
    defaultFontSize: 50,
  },
  l: {
    weightCoefficient: 0.8,
    defaultFontSize: 70,
  },
};

export const COLORS: Record<Color, string> = {
  black: '0,0,0',
  white: '255,255,255',
};
