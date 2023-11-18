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
import { WatermarkBodyDto } from './watermark.dto';

@Controller('watermark')
export class WatermarkController {
  constructor(private readonly watermarkService: WatermarkService) {}

  @UseInterceptors(AnyFilesInterceptor())
  @Post()
  async setWatermark(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() { text, ...options }: WatermarkBodyDto,
    @Res() response: Response,
  ) {
    try {
      const imgWithWatermark =
        await this.watermarkService.setWatermarkOnPhotoForTelegraf({
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
}
