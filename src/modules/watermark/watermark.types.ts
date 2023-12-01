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

export const DICTIONARY: Record<Size, SizeData> = {
  s: {
    partInRow: 7,
    partInColumn: 20,
    weightCoefficient: 0.3,
    x: {
      single: {
        topLeft: 1,
        topCenter: 45,
        topRight: 85,
        centerLeft: 1,
        centerCenter: 45,
        centerRight: 85,
        bottomLeft: 1,
        bottomCenter: 45,
        bottomRight: 85,
      },
      pattern: 0.5,
    },
    y: {
      single: {
        topLeft: 5,
        topCenter: 5,
        topRight: 5,
        centerLeft: 50,
        centerCenter: 50,
        centerRight: 50,
        bottomLeft: 95,
        bottomCenter: 95,
        bottomRight: 95,
      },
      pattern: 4,
    },
    defaultFontSize: 40,
  },
  m: {
    partInRow: 4,
    partInColumn: 10,
    weightCoefficient: 0.5,
    x: {
      single: {
        topLeft: 1,
        topCenter: 40,
        topRight: 75,
        centerLeft: 1,
        centerCenter: 40,
        centerRight: 75,
        bottomLeft: 1,
        bottomCenter: 40,
        bottomRight: 75,
      },
      pattern: 1,
    },
    y: {
      single: {
        topLeft: 7,
        topCenter: 7,
        topRight: 7,
        centerLeft: 50,
        centerCenter: 50,
        centerRight: 50,
        bottomLeft: 95,
        bottomCenter: 95,
        bottomRight: 95,
      },
      pattern: 6,
    },
    defaultFontSize: 60,
  },
  l: {
    partInRow: 2,
    partInColumn: 4,
    weightCoefficient: 0.8,
    x: {
      single: {
        topLeft: 1,
        topCenter: 33,
        topRight: 62,
        centerLeft: 1,
        centerCenter: 33,
        centerRight: 62,
        bottomLeft: 1,
        bottomCenter: 33,
        bottomRight: 62,
      },
      pattern: 5,
    },
    y: {
      single: {
        topLeft: 10,
        topCenter: 10,
        topRight: 10,
        centerLeft: 50,
        centerCenter: 50,
        centerRight: 50,
        bottomLeft: 95,
        bottomCenter: 95,
        bottomRight: 95,
      },
      pattern: 10,
    },
    defaultFontSize: 80,
  },
};

export const COLORS: Record<Color, string> = {
  black: '0,0,0',
  white: '255,255,255',
};
