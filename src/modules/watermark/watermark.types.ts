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

export type SetWatermarkOnPhotoForTelegrafType = {
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
};

export type GenerateSizesT = {
  textLength: number;
  imageWidth: number;
  size?: Size;
  type?: WatermarkType;
};

export const dictionary: Record<Size, PatternTypes> = {
  s: { partInRow: 7, partInColumn: 20, weightCoefficient: 0.3 },
  m: { partInRow: 4, partInColumn: 10, weightCoefficient: 0.5 },
  l: { partInRow: 2, partInColumn: 4, weightCoefficient: 0.8 },
};

export const colors: Record<Color, string> = {
  black: '0,0,0',
  white: '255,255,255',
};
