export type GenerateWatermarkSvgProps = {
  text: string;
  size?: Size;
  position?: string; //TODO: change to union
  type?: WatermarkType;
  imageWidth: number;
  imageHeight: number;
  opacity?: number;
  color?: Color;
};
export type Size = 's' | 'm' | 'l';

export type Color = 'white' | 'black';

export type WatermarkType = 'single' | 'pattern';

export type SetTextWatermarkType = {
  file: Buffer;
  text: string;
  options?: Partial<GenerateWatermarkSvgProps>;
};

export type GetPatternTextT = {
  size: Size;
  text: string;
  y: number;
  x: number;
};

export type PattertPart = {
  x: number;
  y: number;
};

export type PatternTypes = {
  partInRow: number;
  partInColumn: number;
  weightCoefficient: number;
  x: Record<WatermarkType, number> | number;
  y: Record<WatermarkType, number> | number;
  defaultFontSize: number;
};

export type GenerateSizesT = {
  textLength: number;
  imageWidth: number;
  size?: Size;
};

export const dictionary: Record<Size, PatternTypes> = {
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
