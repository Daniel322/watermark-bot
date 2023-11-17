import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';
import { GenerateWatermarkSvgProps } from './watermark.types';

@Injectable()
export class WatermarkService {
  public defaultSvgWidth: number;
  public defaultSvgHeight: number;
  constructor() {
    this.defaultSvgHeight = 50;
    this.defaultSvgWidth = 150;
  }

  async setWatermarkOnPhoto(
    file: Express.Multer.File,
    text: string,
  ): Promise<Buffer> {
    const watermarkIconBuffer = this.generateWatermarkSvg({ text });

    const imageWithWatermark = sharp(file.buffer)
      .composite([
        {
          input: watermarkIconBuffer,
          top: 300,
          left: 300,
        },
      ])
      .toBuffer();

    return imageWithWatermark;
  }

  async setWatermarkOnPhotoForTelegraf(
    file: Buffer,
    text: string,
  ): Promise<Buffer> {
    const watermarkIconBuffer = this.generateWatermarkSvg({ text });

    const imageWithWatermark = sharp(file)
      .composite([
        {
          input: watermarkIconBuffer,
          top: 300,
          left: 300,
        },
      ])
      .toBuffer();

    return imageWithWatermark;
  }

  generateWatermarkSvg({ text, size = 1 }: GenerateWatermarkSvgProps): Buffer {
    const svg = `
      <svg width="${this.defaultSvgWidth * size}" height="${
        this.defaultSvgHeight * size
      }">
      <style>
      .title { fill: #fff; font-size: ${10 * size * 2}px; font-weight: bold }
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="title">${text}</text>
      </svg>
    `;

    return Buffer.from(svg);
  }
}
