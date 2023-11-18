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
    const watermarkIconBuffer = this.generateWatermarkSvg({ text, ...options });

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
  }: GenerateWatermarkSvgProps): Buffer {
    const { width, height, fontSize } = this.generateSizes(size);
    const svg = `
      <svg width="${width}" height="${height}">
      <style>
      .title { fill: #fff; font-size: ${fontSize}px; font-weight: bold; textAlign: left }
      </style>
      <text x="1%" y="30%" text-anchor="start" class="title">${text}</text>
      </svg>
    `;

    return Buffer.from(svg);
  }

  generateSizes(size: Size = 's') {
    switch (size) {
      case 's': {
        return {
          width: 180,
          height: 50,
          fontSize: 20,
        };
      }
      case 'm': {
        return {
          width: 350,
          height: 100,
          fontSize: 40,
        };
      }
      case 'l': {
        return {
          width: 600,
          height: 150,
          fontSize: 60,
        };
      }
      default: {
        return {
          width: 150,
          height: 50,
          fontSize: 20,
        };
      }
    }
  }
}
