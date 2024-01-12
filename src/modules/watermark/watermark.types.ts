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

export type SetWatermarkProps = {
  image: Buffer;
  watermark: Buffer | string;
  options: Partial<GenerateWatermarkProps>;
};

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

export type SizeData = {
  weightCoefficient: number;
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

export type CompositeImageAndWatermarkPatternProps = {
  image: Buffer;
  watermark: Buffer;
  height: number;
  width: number;
  size: Size;
};

export type GeneratePositionCoordinatesProps = {
  height: number;
  width: number;
  position: PositionType;
  coefficients:
    | {
        top: {
          center: number;
          bottom: number;
        };
      }
    | {
        left: {
          center: number;
          right: number;
        };
      };
};
