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

export type WatermarkType = 'single' | 'position';

export type SetWatermarkOnPhotoForTelegrafType = {
  file: Buffer;
  text: string;
  options?: Partial<GenerateWatermarkSvgProps>;
};
