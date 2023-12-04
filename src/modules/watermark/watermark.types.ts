import {
  COLORS_TYPES,
  POSITION_TYPES,
  SIZES,
  WATERMARK_TYPES,
} from './watermark.constants';

export type Size = keyof typeof SIZES;

export type Color = keyof typeof COLORS_TYPES;

export type WatermarkType = keyof typeof WATERMARK_TYPES;

export type PositionType = keyof typeof POSITION_TYPES;

export type SetPositionKeys = 'position' | 'imageHeight' | 'imageWidth';

export type SetTextWatermarkProps = {
  file: Buffer;
  text: string;
  options?: Partial<GenerateWatermarkProps>;
};

export type SetImageWatermarkProps = Omit<SetTextWatermarkProps, 'text'> & {
  watermark: Buffer;
};

export type GenerateWatermarkProps = {
  text: string;
  imageWidth: number;
  imageHeight: number;
  size?: Size;
  position?: PositionType;
  type?: WatermarkType;
  opacity?: number;
  color?: Color;
  rotate?: number;
};

export type SetSizeToImageWatermarkProps = Omit<
  GenerateWatermarkProps,
  'text'
> & {
  watermark: Buffer;
};

export type GenerateRotateArgsKeys =
  | 'rotate'
  | 'position'
  | 'imageWidth'
  | 'imageHeight';

export type GenerateRotateArgsProps = Pick<
  GenerateWatermarkProps,
  GenerateRotateArgsKeys
>;

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
  x: Record<WatermarkType, Record<PositionType, number> | number>;
  y: Record<WatermarkType, Record<PositionType, number> | number>;
  defaultFontSize: number;
};

export type Coordinates = {
  x: number;
  y: number;
};

export type CompositePosition = {
  top: number;
  left: number;
};

export type TransformValues = {
  translateX: number;
  translateY: number;
};
