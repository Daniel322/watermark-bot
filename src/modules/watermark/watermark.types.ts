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

export type GenerateTextWatermarkProps = {
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

export type SizeDataV2 = {
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

export const dictionary: Record<Size, SizeData> = {
  s: {
    partInRow: 7,
    partInColumn: 20,
    weightCoefficient: 0.3,
    x: {
      single: 3,
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
    y: 6,
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

export const dictionaryV2: Record<Size, SizeDataV2> = {
  s: {
    partInRow: 7,
    partInColumn: 20,
    weightCoefficient: 0.3,
    x: {
      single: {
        topLeft: 1,
        topCenter: 50,
        topRight: 75,
        centerLeft: 1,
        centerCenter: 50,
        centerRight: 75,
        bottomLeft: 1,
        bottomCenter: 50,
        bottomRight: 75,
      },
      pattern: 0.5,
    },
    y: {
      single: {
        topLeft: 1,
        topCenter: 1,
        topRight: 1,
        centerLeft: 50,
        centerCenter: 50,
        centerRight: 50,
        bottomLeft: 90,
        bottomCenter: 90,
        bottomRight: 90,
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
        topCenter: 50,
        topRight: 75,
        centerLeft: 1,
        centerCenter: 50,
        centerRight: 75,
        bottomLeft: 1,
        bottomCenter: 50,
        bottomRight: 75,
      },
      pattern: 1,
    },
    y: {
      single: {
        topLeft: 1,
        topCenter: 1,
        topRight: 1,
        centerLeft: 50,
        centerCenter: 50,
        centerRight: 50,
        bottomLeft: 90,
        bottomCenter: 90,
        bottomRight: 90,
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
        topCenter: 50,
        topRight: 75,
        centerLeft: 1,
        centerCenter: 50,
        centerRight: 75,
        bottomLeft: 1,
        bottomCenter: 50,
        bottomRight: 75,
      },
      pattern: 5,
    },
    y: {
      single: {
        topLeft: 1,
        topCenter: 1,
        topRight: 1,
        centerLeft: 50,
        centerCenter: 50,
        centerRight: 50,
        bottomLeft: 90,
        bottomCenter: 90,
        bottomRight: 90,
      },
      pattern: 10,
    },
    defaultFontSize: 80,
  },
};

export const colors: Record<Color, string> = {
  black: '0,0,0',
  white: '255,255,255',
};

export const POSITIONS: Record<PositionType, Coordinates> = {
  topLeft: { x: 0, y: 0 },
  topCenter: { x: 0.4, y: 0 },
  topRight: { x: 0.75, y: 0 },
  centerLeft: { x: 0, y: 0.45 },
  centerCenter: { x: 0.4, y: 0.45 },
  centerRight: { x: 0.75, y: 0.45 },
  bottomLeft: { x: 0, y: 0.9 },
  bottomCenter: { x: 0.4, y: 0.9 },
  bottomRight: { x: 0.75, y: 0.9 },
};
