import { GenerateTextWatermarkProps } from '@modules/watermark/watermark.types';
import { BOT_STATES } from './telegraf.constants';

export interface SelectedOptions
  extends Omit<GenerateTextWatermarkProps, 'imageWidth' | 'imageHeight'> {
  file: Buffer;
}

export type BotStates = keyof typeof BOT_STATES;
