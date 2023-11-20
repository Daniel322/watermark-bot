import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';
import {
  GenerateWatermarkSvgProps,
  SetWatermarkOnPhotoForTelegrafType,
  Size,
} from './watermark.types';

@Injectable()
export class WatermarkService {
  constructor() {}

  async setWatermarkOnPhotoForTelegraf({
    file,
    text,
    options,
  }: SetWatermarkOnPhotoForTelegrafType): Promise<Buffer> {
    const { width, height }: sharp.Metadata = await sharp(file).metadata();

    console.log(width, height, options);

    const watermarkIconBuffer = this.generateWatermarkSvg({
      text,
      ...options,
      imageHeight: height,
      imageWidth: width,
    });

    const imageWithWatermark = sharp(file)
      .composite([
        {
          input: watermarkIconBuffer,
          top: 0,
          left: 0,
        },
      ])
      .toBuffer();

    return imageWithWatermark;
  }

  generateWatermarkSvg({
    text,
    size = 's',
    type = 'single',
    imageWidth,
    imageHeight,
  }: GenerateWatermarkSvgProps): Buffer {
    console.log(imageWidth, imageHeight);
    if (type === 'single') {
      const { width, height, fontSize } = this.generateSizes(size, text.length);

      if (width > imageWidth) {
        throw new Error('WATERMARK_SIZE_MORE_THAN_ORIGINAL_IMAGE');
      }
      const svg = `
        <svg width="${width}" height="${height}">
        <style>
        .title { fill: #fff; font-size: ${fontSize}px; font-weight: bold; textAlign: left }
        </style>
        <text x="1%" y="30%" text-anchor="start" class="title">${text}</text>
        </svg>
      `;

      return Buffer.from(svg);
    } else {
      const square: number = imageWidth * imageHeight;
    }
  }

  generateSizes(size: Size = 's', textLength: number) {
    switch (size) {
      case 's': {
        return {
          width: 10 * textLength,
          height: 50,
          fontSize: 20,
        };
      }
      case 'm': {
        return {
          width: 20 * textLength,
          height: 100,
          fontSize: 40,
        };
      }
      case 'l': {
        return {
          width: 30 * textLength,
          height: 150,
          fontSize: 60,
        };
      }
      default: {
        return {
          width: 20 * textLength,
          height: 50,
          fontSize: 20,
        };
      }
    }
  }
}
