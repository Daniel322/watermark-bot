export type GenerateWatermarkSvgProps = {
  text: string;
  size?: Size;
  position?: string; //TODO: change to union
  style?: Record<string, any>;
  type?: WatermarkType;
  imageWidth: number;
  imageHeight: number;
};
export type Size = 's' | 'm' | 'l';

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
};

export type GenerateSizesT = {
  textLength: number;
  imageWidth: number;
  size?: Size;
  type?: WatermarkType;
};
