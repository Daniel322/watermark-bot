import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';
import {
  GenerateSizesT,
  GenerateWatermarkSvgProps,
  GetPatternTextT,
  PatternTypes,
  PattertPart,
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
    if (type === 'single') {
      const { fontSize, x, y } = this.generateSizes({
        size,
        textLength: text.length,
        imageWidth,
        type,
      });

      const svg = `
        <svg width="${imageWidth}" height="${imageHeight}">
        <style>
        .title { fill: #fff; font-size: ${fontSize}px; font-weight: bold; textAlign: left }
        </style>
        <text x="${x}%" y="${y}%" text-anchor="start" class="title">${text}</text>
        </svg>
      `;

      return Buffer.from(svg);
    } else {
      const { weightCoefficient, x, y } = this.generateSizes({
        size,
        textLength: text.length,
        imageWidth,
        type,
      });

      const fontSize = (imageWidth * weightCoefficient) / text.length;

      const patternText = this.generatePattern({ size, text, x, y });

      const svg = `
      <svg width="${imageWidth}" height="${imageHeight}">
      <style>
      .title { fill: #fff; font-size: ${fontSize}px; font-weight: bold; textAlign: left; text-decoration: underline }
      </style>
      ${patternText}
      </svg>
    `;

      return Buffer.from(svg);
    }
  }

  generateSizes({
    size = 's',
    type = 'single',
    textLength,
    imageWidth,
  }: GenerateSizesT) {
    switch (size) {
      case 's': {
        const dynamicSize = Math.floor((imageWidth * 0.3) / textLength);
        return {
          fontSize: dynamicSize > 40 ? 40 : dynamicSize,
          x: type === 'single' ? 1 : 0.5,
          y: type === 'single' ? 5 : 4,
          weightCoefficient: 0.3,
        };
      }
      case 'm': {
        const dynamicSize = Math.floor((imageWidth * 0.5) / textLength);
        return {
          fontSize: dynamicSize > 60 ? 60 : dynamicSize,
          x: 1,
          y: 7,
          weightCoefficient: 0.5,
        };
      }
      case 'l': {
        const dynamicSize = Math.floor((imageWidth * 0.8) / textLength);
        return {
          fontSize: dynamicSize > 80 ? 80 : dynamicSize,
          x: type === 'single' ? 1 : 5,
          y: 10,
          weightCoefficient: 0.8,
        };
      }
      default: {
        return {
          fontSize: 20,
          x: 1,
          y: 5,
          weightCoefficient: 0.3,
        };
      }
    }
  }

  generatePattern({ size, text, x, y }: GetPatternTextT): string {
    const patternParts: PattertPart[] = [];

    const dictionary: Record<Size, PatternTypes> = {
      s: { partInRow: 7, partInColumn: 20 },
      m: { partInRow: 4, partInColumn: 10 },
      l: { partInRow: 2, partInColumn: 4 },
    };

    const partInRow = dictionary[size].partInRow;
    const partInColumn = dictionary[size].partInColumn;
    let partY = y;

    for (let column = 0; column < partInColumn; column++) {
      let partX = x;
      for (let i = 0; i < partInRow; i++) {
        patternParts.push({ x: partX, y: partY });
        partX += 100 / partInRow;
      }
      partY += 100 / partInColumn;
    }

    return patternParts
      .map(
        ({ x, y }) =>
          `<text x="${x}%" y="${y}%" text-anchor="start" class="title">${text}</text>`,
      )
      .join('');
  }
}
