import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Size } from './watermark.types';

export class WatermarkBodyDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  size: Size;
}
