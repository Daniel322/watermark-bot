import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Readable } from 'stream';

import { WatermarkService } from './watermark.service';
import { ImageWatermarkBodyDto, WatermarkBodyDto } from './watermark.dto';

@Controller('watermark')
export class WatermarkController {
  constructor(private readonly watermarkService: WatermarkService) {}

  @UseInterceptors(AnyFilesInterceptor())
  @Post()
  async setTextWatermark(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() { text, ...options }: WatermarkBodyDto,
    @Res() response: Response,
  ) {
    try {
      const imgWithWatermark =
        await this.watermarkService.createImageWithTextWatermark({
          file: files[0].buffer,
          text,
          options,
        });

      const stream = Readable.from(imgWithWatermark);

      stream.pipe(response);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  @UseInterceptors(AnyFilesInterceptor())
  @Post('/image')
  async setImageWatermark(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() options: ImageWatermarkBodyDto,
    @Res() response: Response,
  ) {
    try {
      const imgWithWatermark =
        await this.watermarkService.createImageWithImageWatermark({
          file: files[0].buffer,
          watermark: files[1].buffer,
          options,
        });

      const stream = Readable.from(imgWithWatermark);

      stream.pipe(response);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }
}
