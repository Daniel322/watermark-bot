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

export type Size = keyof typeof SIZES;

export type Color = keyof typeof COLORS_TYPES;

export type WatermarkType = keyof typeof WATERMARK_TYPES;

export type GenerateTextWatermarkProps = {
  text: string;
  size?: Size;
  position?: string; //TODO: change to union
  type?: WatermarkType;
  imageWidth: number;
  imageHeight: number;
  opacity?: number;
  color?: Color;
};

export type SetTextWatermarkProps = {
  file: Buffer;
  text: string;
  options?: Partial<GenerateTextWatermarkProps>;
};

export type GeneratePatternProps = {
  size: Size;
  text: string;
  y: number;
  x: number;
};

export type GetFontSizeProps = {
  textLength: number;
  imageWidth: number;
  size?: Size;
};

export type SizeData = {
  partInRow: number;
  partInColumn: number;
  weightCoefficient: number;
  x: Record<WatermarkType, number> | number;
  y: Record<WatermarkType, number> | number;
  defaultFontSize: number;
};

export const dictionary: Record<Size, SizeData> = {
  s: {
    partInRow: 7,
    partInColumn: 20,
    weightCoefficient: 0.3,
    x: {
      single: 1,
      pattern: 0.5,
    },
    y: {
      single: 5,
      pattern: 4,
    },
    defaultFontSize: 40,
  },
  m: {
    partInRow: 4,
    partInColumn: 10,
    weightCoefficient: 0.5,
    x: 1,
    y: 7,
    defaultFontSize: 60,
  },
  l: {
    partInRow: 2,
    partInColumn: 4,
    weightCoefficient: 0.8,
    x: {
      single: 1,
      pattern: 5,
    },
    y: 10,
    defaultFontSize: 80,
  },
};

export const colors: Record<Color, string> = {
  black: '0,0,0',
  white: '255,255,255',
};
