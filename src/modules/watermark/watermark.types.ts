export type GenerateWatermarkSvgProps = {
  text: string;
  size?: Size;
  position?: string; //TODO: change to union
  style?: Record<string, any>;
};
export type Size = 's' | 'm' | 'l';
