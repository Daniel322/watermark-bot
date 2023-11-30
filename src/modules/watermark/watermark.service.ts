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
  PositionType,
  DICTIONARY,
  Coordinates,
  GenerateRotateArgsProps,
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

    console.log(
      this.generateRotateArgs({ rotate, position, imageWidth, imageHeight }),
      imageWidth,
      imageHeight,
    );

    const { x: xTranslate, y: yTranslate } = this.generateRotateArgs({
      rotate,
      position,
      imageWidth,
      imageHeight,
    });

    const svg = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${imageWidth}"
        height="${imageHeight}"
        viewBox="0 0 ${imageWidth} ${imageHeight}"
        class="svg"
      >
      <style>
      .svg {
      }
      .title { fill: rgba(${COLORS[color]}, ${opacity});
      font-size: ${fontSize}px;
      font-weight: bold;
      text-align: left;
      transform-box: content-box;
    }
      </style>
      <defs>
      <filter x="0" y="0" width="1" height="1" id="solid">
        <feFlood flood-color="yellow" result="bg" />
        <feMerge>
          <feMergeNode in="bg"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
      <text
        x="${this.getCoordUtil(x, WATERMARK_TYPES.single, position)}%"
      y="${this.getCoordUtil(y, WATERMARK_TYPES.single, position)}%"
      text-anchor="start"
      filter="url(#solid)"
      class="title"
      id="text"
      transform="rotate(${rotate}, ${xTranslate}, ${yTranslate})"
    >
      ${text}
    </text>
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

  generateRotateArgs({
    position,
    rotate,
    imageHeight,
    imageWidth,
  }: GenerateRotateArgsProps): Coordinates {
    switch (position) {
      case 'topLeft': {
        if (rotate >= 0 && rotate < 80) {
          return { x: 0, y: 30 };
        } else if (rotate >= 80 && rotate <= 90) {
          return { x: 0, y: 40 };
        } else if (rotate < 0 && rotate >= -25) {
          return { x: 150, y: 50 };
        } else if (rotate < -25 && rotate >= -90) {
          // return { x: 150, y: 80 };
          return { x: imageWidth * 0.117, y: imageHeight * 0.0625 };
        }
      }
      case 'topCenter': {
        if (rotate >= 0 && rotate <= 10) {
          return { x: 500, y: 0 };
        } else if (rotate > 10 && rotate <= 90) {
          return { x: 600, y: 0 };
        } else if (rotate < 0 && rotate >= -90) {
          return { x: 800, y: 0 };
        }
      }
      case 'topRight': {
        if (rotate >= 0 && rotate <= 90) {
          return { x: 1100, y: 0 };
        }
      }
    }
  }
}
