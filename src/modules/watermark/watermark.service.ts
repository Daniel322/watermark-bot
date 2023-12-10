import { Injectable, Logger } from '@nestjs/common';

import * as sharp from 'sharp';

import {
  COLORS,
  COLORS_TYPES,
  DICTIONARY,
  PATTERNS_FOR_COMPOSITE,
  POSITION_COORDINATES_COEFFICIENTS,
  POSITION_TYPES,
  SIZES,
  SIZE_COEFFICIENTS,
  WATERMARK_TYPES,
} from './watermark.constants';
import {
  GetFontSizeProps,
  GenerateWatermarkProps,
  GeneratePatternProps,
  SetTextWatermarkProps,
  WatermarkType,
  CompositePosition,
  PositionType,
  SetImageWatermarkProps,
  SetSizeToImageWatermarkProps,
  CompositeImageAndWatermarkPatternProps,
} from './watermark.types';

@Injectable()
export class WatermarkService {
  private readonly logger = new Logger(WatermarkService.name);
  constructor() {}

  //CORE METHODS FOR GENERATE WATERMARKS WITH TEXT OR IMAGE

  async createImageWithImageWatermark({
    file,
    watermark,
    options: {
      position = POSITION_TYPES.centerCenter,
      size = SIZES.s,
      type = WATERMARK_TYPES.single,
      ...options
    } = {
      type: WATERMARK_TYPES.single,
      size: SIZES.s,
      position: POSITION_TYPES.centerCenter,
    },
  }: SetImageWatermarkProps): Promise<Buffer> {
    const { width, height } = await this.getImageMetadata(file);

    const sizedWatermark = await this.setOptionsToImageWatermark({
      watermark,
      imageHeight: height,
      imageWidth: width,
      size,
      ...options,
    });

    if (type === WATERMARK_TYPES.single) {
      const coefficients = POSITION_COORDINATES_COEFFICIENTS[size];

      const compositeOptions: CompositePosition =
        this.generatePositionCoordinates({
          height,
          width,
          coefficients,
          position,
        });

      return this.compositeImageAndWatermark(file, [
        { input: sizedWatermark, ...compositeOptions },
      ]);
    } else {
      return this.compositeImageAndWatermarkPattern({
        image: file,
        watermark: sizedWatermark,
        size,
        height,
        width,
      });
    }
  }

  async createImageWithTextWatermark({
    file,
    text,
    options: { type = WATERMARK_TYPES.single, ...options } = {
      type: WATERMARK_TYPES.single,
    },
  }: SetTextWatermarkProps): Promise<Buffer> {
    this.logger.log(`text in createImage with watermark -> ${text}`);
    const { width, height } = await this.getImageMetadata(file);

    const generateOptions: GenerateWatermarkProps = {
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

    const imageWithWatermark = await this.compositeImageAndWatermark(file, [
      { input: textWatermarkBuffer, ...compositeOptions },
    ]);

    return imageWithWatermark;
  }

  //CORE SHARP METHODS

  compositeImageAndWatermark(
    image: Buffer,
    options: sharp.OverlayOptions[],
  ): Promise<Buffer> {
    return sharp(image).composite(options).toBuffer();
  }

  async getImageMetadata(image: Buffer): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(image).metadata();

      return metadata;
    } catch (error) {
      throw new Error(error);
    }
  }

  //METHODS FOR SET OPTIONS TO IMAGE WATERMARK

  async setOptionsToImageWatermark({
    watermark,
    imageWidth: width,
    imageHeight: height,
    size = SIZES.s,
    opacity = 1,
    rotate = 0,
  }: SetSizeToImageWatermarkProps): Promise<Buffer> {
    const withoutOpacity = 255;

    const opacityBufferValue = Math.round(opacity * withoutOpacity);
    const opacityBuffer = Buffer.alloc(width * height, opacityBufferValue);

    const result = await sharp(watermark)
      .png()
      .resize({
        width: Math.floor(width * SIZE_COEFFICIENTS[size]),
        height: Math.floor(height * SIZE_COEFFICIENTS[size]),
        fit: 'contain',
        background: 'rgba(0,0,0,0)',
      })
      .composite([
        {
          input: opacityBuffer,
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .unflatten()
      .rotate(Number(rotate), { background: 'rgba(0,0,0,0)' })
      .toBuffer();

    return result;
  }

  compositeImageAndWatermarkPattern({
    image,
    watermark,
    size,
    height,
    width,
  }: CompositeImageAndWatermarkPatternProps): Promise<Buffer> {
    const currentPattern = PATTERNS_FOR_COMPOSITE[size];

    const patternParts: sharp.OverlayOptions[] = [];
    let top = Math.floor(height * 0.1);
    for (let column = 0; column < currentPattern.columns; column++) {
      let left = Math.floor(width * 0.1);
      for (let row = 0; row < currentPattern.rows; row++) {
        patternParts.push({ input: watermark, top, left });
        left += Math.floor(width / currentPattern.rows);
      }
      top += Math.floor(height / currentPattern.columns);
    }

    return this.compositeImageAndWatermark(image, patternParts);
  }

  generatePositionCoordinates({
    height,
    width,
    position,
    coefficients,
  }): CompositePosition {
    const positionCoordinates: Record<PositionType, CompositePosition> = {
      topLeft: { top: 0, left: 0 },
      topCenter: {
        top: 0,
        left: Math.floor(width * coefficients['left']['center']),
      },
      topRight: {
        top: 0,
        left: Math.floor(width * coefficients['left']['right']),
      },
      centerLeft: {
        top: Math.floor(height * coefficients['top']['center']),
        left: 0,
      },
      centerCenter: {
        top: Math.floor(height * coefficients['top']['center']),
        left: Math.floor(width * coefficients['left']['center']),
      },
      centerRight: {
        top: Math.floor(height * coefficients['top']['center']),
        left: Math.floor(width * coefficients['left']['right']),
      },
      bottomLeft: {
        top: Math.floor(height * coefficients['top']['bottom']),
        left: 0,
      },
      bottomCenter: {
        top: Math.floor(height * coefficients['top']['bottom']),
        left: Math.floor(width * coefficients['left']['center']),
      },
      bottomRight: {
        top: Math.floor(height * coefficients['top']['bottom']),
        left: Math.floor(width * coefficients['left']['right']),
      },
    };

    return positionCoordinates[position];
  }

  //METHODS FOR SET OPTIONS TO TEXT WATERMARK

  generateSingleWatermarkSvg({
    text,
    imageWidth,
    imageHeight,
    size = SIZES.s,
    opacity = 1,
    color = COLORS_TYPES.white,
    rotate = 0,
    position = POSITION_TYPES.centerCenter,
  }: GenerateWatermarkProps): Buffer {
    const fontSize = this.getFontSize({
      size,
      textLength: text.length,
      imageWidth,
    });

    const { x, y } = DICTIONARY[size];

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
      <text
        x="${this.getCoordUtil(x, WATERMARK_TYPES.single, position)}%"
      y="${this.getCoordUtil(y, WATERMARK_TYPES.single, position)}%"
      text-anchor="start"
      filter="url(#solid)"
      class="title"
      id="text"
      transform="rotate(${rotate})"
    >
      ${text}
    </text>
      </svg>
    `;

    this.logger.log(`generated svg in generateSingleWatermarkSvg -> ${svg}`);

    return Buffer.from(svg);
  }

  generatePatternWatermarkSvg({
    text,
    size = SIZES.s,
    imageWidth,
    imageHeight,
    opacity = 1,
    color = COLORS_TYPES.white,
  }: GenerateWatermarkProps): Buffer {
    const { weightCoefficient, x, y } = DICTIONARY[size];

    const fontSize = (imageWidth * weightCoefficient) / text.length;

    const patternText = this.generatePattern({
      size,
      text,
      x: this.getCoordUtil(x, WATERMARK_TYPES.pattern),
      y: this.getCoordUtil(y, WATERMARK_TYPES.pattern),
    });

    this.logger.log(
      `generated svg pattern in generatePattern -> ${patternText}`,
    );

    const svg = `
    <svg width="${imageWidth}" height="${imageHeight}">
    <style>
    .title {
      fill: rgba(${COLORS[color]}, ${opacity});
      font-size: ${fontSize}px;
      font-weight: bold;
      textAlign: left;
    }
    </style>
    ${patternText}
    </svg>
  `;

    this.logger.log(`generated svg in generatePatternWatermarkSvg -> ${svg}`);

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
    position: PositionType = POSITION_TYPES.centerCenter,
  ) {
    return type === WATERMARK_TYPES.pattern
      ? value[type]
      : value[type][position];
  }
}
