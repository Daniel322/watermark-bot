import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';
import {
  GetFontSizeProps,
  GenerateWatermarkProps,
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
  SetImageWatermarkProps,
  SetSizeToImageWatermarkProps,
  Size,
} from './watermark.types';

@Injectable()
export class WatermarkService {
  constructor() {}

  async createImageWithImageWatermark({
    file,
    watermark,
    options: { position = 'topLeft', size = 's', type = 'single', ...options },
  }: SetImageWatermarkProps) {
    const { width, height }: sharp.Metadata = await sharp(file).metadata();

    const sizedWatermark = await this.setOptionsToImageWatermark({
      watermark,
      imageHeight: height,
      imageWidth: width,
      size,
      ...options,
    });

    const POSITION_COORDINATES_COEFFICIENTS = {
      s: {
        top: {
          center: 0.45,
          bottom: 0.9,
        },
        left: {
          center: 0.45,
          right: 0.9,
        },
      },
      m: {
        top: {
          center: 0.4,
          bottom: 0.8,
        },
        left: {
          center: 0.4,
          right: 0.8,
        },
      },
      l: {
        top: {
          center: 0.35,
          bottom: 0.7,
        },
        left: {
          center: 0.35,
          right: 0.7,
        },
      },
    } as const;

    const coefficients = POSITION_COORDINATES_COEFFICIENTS[size];

    const POSITION_COORDINATES: Record<PositionType, CompositePosition> = {
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

    const compositeOptions: CompositePosition = POSITION_COORDINATES[position];

    if (type === 'single') {
      return this.compositeImageAndWatermark(
        file,
        sizedWatermark,
        compositeOptions,
      );
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
    const { width, height }: sharp.Metadata = await sharp(file).metadata();

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

  compositeImageAndWatermarkPattern({ image, watermark, size, height, width }) {
    const patternsForComposite = {
      s: { rows: 4, columns: 4 },
      m: { rows: 3, columns: 3 },
      l: { rows: 2, columns: 2 },
    } as const;

    const currentPattern = patternsForComposite[size];

    const patternParts: sharp.OverlayOptions[] = [];
    let top = 0;
    for (let column = 0; column < currentPattern.columns; column++) {
      let left = 0;
      for (let row = 0; row < currentPattern.rows; row++) {
        patternParts.push({ input: watermark, top, left });
        left += Math.floor(width / currentPattern.rows);
      }
      top += Math.floor(height / currentPattern.columns);
    }

    return sharp(image).composite(patternParts).toBuffer();
  }

  async setOptionsToImageWatermark({
    watermark,
    imageWidth: width,
    imageHeight: height,
    size = 's',
    opacity = 1,
    rotate = 0,
  }: SetSizeToImageWatermarkProps): Promise<Buffer> {
    //TODO: move to constatns
    const sizeCoefficients: Record<Size, number> = {
      s: 0.1,
      m: 0.2,
      l: 0.3,
    };

    const withoutOpacity = 255;

    const opacityBufferValue = Math.round(opacity * withoutOpacity);
    const opacityBuffer = Buffer.alloc(width * height, opacityBufferValue);

    const result = await sharp(watermark)
      .png()
      .resize(
        Math.floor(width * sizeCoefficients[size]),
        Math.floor(height * sizeCoefficients[size]),
      )
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
      .rotate(Number(rotate), { background: 'rgba(0,0,0,0)' })
      .toBuffer();

    return result;
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
      transform="rotate(${rotate})"
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
  }: GenerateWatermarkProps): Buffer {
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
}
