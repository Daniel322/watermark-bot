import { GenerateWatermarkProps } from '@modules/watermark/watermark.types';
import { BOT_STATES } from './telegraf.constants';

export interface SelectedOptions
  extends Omit<GenerateWatermarkProps, 'imageWidth' | 'imageHeight'> {
  file: Buffer;
}

export type BotStates = keyof typeof BOT_STATES;
