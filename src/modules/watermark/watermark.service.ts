import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';
import {
  GetFontSizeProps,
  GenerateTextWatermarkProps,
  GeneratePatternProps,
  SetTextWatermarkProps,
  WatermarkType,
  COLORS,
  WATERMARK_TYPES,
  COLORS_TYPES,
  SIZES,
  POSITION_TYPES,
  CompositePosition,
  TransformValues,
  PositionType,
  DICTIONARY,
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

    const compositeOptions: CompositePosition = { top: 0, left: 0 };

    const imageWithWatermark = await this.compositeImageAndWatermark(
      file,
      textWatermarkBuffer,
      compositeOptions,
    );

    return imageWithWatermark;
  }

  compositeImageAndWatermark(
    image: Buffer,
    watermark: Buffer,
    options: CompositePosition = { top: 0, left: 0 },
  ): Promise<Buffer> {
    return sharp(image)
      .composite([{ input: watermark, ...options }])
      .toBuffer();
  }

  generateSingleWatermarkSvg({
    text,
    imageWidth,
    imageHeight,
    size = SIZES.s,
    opacity = 1,
    color = COLORS_TYPES.white,
    rotate = 0,
    position = POSITION_TYPES.topLeft,
  }: GenerateTextWatermarkProps): Buffer {
    const fontSize = this.getFontSize({
      size,
      textLength: text.length,
      imageWidth,
    });

    const { x, y } = DICTIONARY[size];

    const { translateX, translateY } = this.generateTransformTextValues(rotate);

    const svg = `
      <svg width="${imageWidth}" height="${imageHeight}" style="border:2px solid red">
      <rect x="0" y="0" width="${imageWidth}" height="${imageHeight}" style="fill:blue; stroke:pink; stroke-width:5; fill-opacity:0.1; stroke-opacity:0.9;" />
      <style>
      .title { fill: rgba(${COLORS[color]}, ${opacity});
      font-size: ${fontSize}px;
      font-weight: bold;
      textAlign: left;
      transform: rotate(${rotate}) translate(${translateX}, ${translateY});
    }
      </style>
      <text x="${this.getCoordUtil(
        x,
        WATERMARK_TYPES.single,
        position,
      )}%" y="${this.getCoordUtil(
        y,
        WATERMARK_TYPES.single,
        position,
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
    const { weightCoefficient, x, y } = DICTIONARY[size];

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
    .title { fill: rgba(${COLORS[color]}, ${opacity}); font-size: ${fontSize}px; font-weight: bold; textAlign: left }
    </style>
    ${patternText}
    </svg>
  `;

    return Buffer.from(svg);
  }

  generatePattern({ size, text, x, y }: GeneratePatternProps): string {
    const patternParts: string[] = [];

    const { partInRow, partInColumn } = DICTIONARY[size];
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
    const { defaultFontSize, weightCoefficient } = DICTIONARY[size];

    const dynamicSize = Math.floor(
      (imageWidth * weightCoefficient) / textLength,
    );

    return dynamicSize > defaultFontSize ? defaultFontSize : dynamicSize;
  }

  getCoordUtil(
    value: Record<WatermarkType, Record<PositionType, number> | number>,
    type: WatermarkType,
    position: PositionType = POSITION_TYPES.topLeft,
  ) {
    return type === WATERMARK_TYPES.pattern
      ? value[type]
      : value[type][position];
  }

  generateTransformTextValues(rotate: number): TransformValues {
    if (rotate >= 0) {
      return {
        translateX: rotate > 10 ? rotate - 10 : 0,
        translateY: 0,
      };
    } else {
      return {
        translateX: 0,
        translateY: rotate <= -10 ? -(rotate * 2) : 0,
      };
    }
  }
}
