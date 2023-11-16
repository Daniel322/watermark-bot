import { IsNotEmpty, IsString } from 'class-validator';

export class WatermarkBodyDto {
  @IsNotEmpty()
  @IsString()
  text: string;
}
