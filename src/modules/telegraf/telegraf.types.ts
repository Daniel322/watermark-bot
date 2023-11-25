import { GenerateTextWatermarkProps } from '@modules/watermark/watermark.types';

export interface TmpTypeName
  extends Omit<GenerateTextWatermarkProps, 'imageWidth' | 'imageHeight'> {
  file: Buffer;
}
