import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';
import {
  GetFontSizeProps,
  GenerateTextWatermarkProps,
  GeneratePatternProps,
  SetTextWatermarkProps,
  WatermarkType,
  colors,
  dictionary,
  WATERMARK_TYPES,
  COLORS_TYPES,
  SIZES,
} from './watermark.types';

@Injectable()
export class WatermarkService {
  constructor() {}

  async createImageWithTextWatermark({
    file,
    text,
    options: { type = WATERMARK_TYPES.single, ...options } = {
      type: WATERMARK_TYPES.single,
    },
  }: SetTextWatermarkProps): Promise<Buffer> {
    const { width, height }: sharp.Metadata = await sharp(file).metadata();

    const generateOptions: GenerateTextWatermarkProps = {
      text,
      imageHeight: height,
      imageWidth: width,
      ...options,
    };

    const textWatermarkBuffer =
      type === WATERMARK_TYPES.single
        ? this.generateSingleWatermarkSvg(generateOptions)
        : this.generatePatternWatermarkSvg(generateOptions);

    const imageWithWatermark = await this.compositeImageAndWatermark(
      file,
      textWatermarkBuffer,
    );

    return imageWithWatermark;
  }

  compositeImageAndWatermark(
    image: Buffer,
    watermark: Buffer,
  ): Promise<Buffer> {
    return sharp(image)
      .composite([{ input: watermark, top: 0, left: 0 }])
      .toBuffer();
  }

  generateSingleWatermarkSvg({
    text,
    imageWidth,
    imageHeight,
    size = SIZES.s,
    opacity = 1,
    color = COLORS_TYPES.white,
  }: GenerateTextWatermarkProps): Buffer {
    const fontSize = this.getFontSize({
      size,
      textLength: text.length,
      imageWidth,
    });

    const { x, y } = dictionary[size];

    const svg = `
      <svg width="${imageWidth}" height="${imageHeight}">
      <style>
      .title { fill: rgba(${
        colors[color]
      }, ${opacity}); font-size: ${fontSize}px; font-weight: bold; textAlign: left }
      </style>
      <text x="${this.getCoordUtil(
        x,
        WATERMARK_TYPES.single,
      )}%" y="${this.getCoordUtil(
        y,
        WATERMARK_TYPES.single,
      )}%" text-anchor="start" class="title">${text}</text>
      </svg>
    `;

    return Buffer.from(svg);
  }

  generatePatternWatermarkSvg({
    text,
    size = SIZES.s,
    imageWidth,
    imageHeight,
    opacity = 1,
    color = COLORS_TYPES.white,
  }: GenerateTextWatermarkProps): Buffer {
    const { weightCoefficient, x, y } = dictionary[size];

    const fontSize = (imageWidth * weightCoefficient) / text.length;

    const patternText = this.generatePattern({
      size,
      text,
      x: this.getCoordUtil(x, WATERMARK_TYPES.pattern),
      y: this.getCoordUtil(y, WATERMARK_TYPES.pattern),
    });

    const svg = `
    <svg width="${imageWidth}" height="${imageHeight}">
    <style>
    .title { fill: rgba(${colors[color]}, ${opacity}); font-size: ${fontSize}px; font-weight: bold; textAlign: left; text-decoration: underline }
    </style>
    ${patternText}
    </svg>
  `;

    return Buffer.from(svg);
  }

  generatePattern({ size, text, x, y }: GeneratePatternProps): string {
    const patternParts: string[] = [];

    const { partInRow, partInColumn } = dictionary[size];
    let partY = y;

    for (let column = 0; column < partInColumn; column++) {
      let partX = x;
      for (let row = 0; row < partInRow; row++) {
        patternParts.push(
          `<text x="${partX}%" y="${partY}%" text-anchor="start" class="title">${text}</text>`,
        );
        partX += 100 / partInRow;
      }
      partY += 100 / partInColumn;
    }

    return patternParts.join('');
  }

  getFontSize({ size = SIZES.s, textLength, imageWidth }: GetFontSizeProps) {
    const { defaultFontSize, weightCoefficient } = dictionary[size];

    const dynamicSize = Math.floor(
      (imageWidth * weightCoefficient) / textLength,
    );

    return dynamicSize > defaultFontSize ? defaultFontSize : dynamicSize;
  }

  getCoordUtil(
    value: Record<WatermarkType, number> | number,
    type: WatermarkType,
  ) {
    return typeof value === 'number' ? value : value[type];
  }
}
