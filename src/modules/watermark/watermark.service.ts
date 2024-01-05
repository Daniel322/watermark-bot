import { Injectable, Logger } from '@nestjs/common';

import sharp, { OverlayOptions, Metadata } from 'sharp';

import {
  COLORS,
  DICTIONARY,
  PATTERNS_FOR_COMPOSITE,
  POSITION_COORDINATES_COEFFICIENTS,
  POSITION_TYPES,
  SIZES,
  SIZE_COEFFICIENTS,
  WATERMARK_TYPES,
} from './watermark.constants';
import {
  GenerateWatermarkProps,
  SetTextWatermarkProps,
  CompositePosition,
  PositionType,
  SetImageWatermarkProps,
  SetSizeToImageWatermarkProps,
  CompositeImageAndWatermarkPatternProps,
  GeneratePositionCoordinatesProps,
  SetWatermarkProps,
} from './watermark.types';

@Injectable()
export class WatermarkService {
  private readonly logger = new Logger(WatermarkService.name);
  constructor() {}

  //CORE PUBLIC METHODS FOR GENERATE WATERMARKS WITH TEXT OR IMAGE

  async setWatermarkToImage({
    image,
    watermark,
    options = {
      type: WATERMARK_TYPES.single,
      size: SIZES.s,
      position: POSITION_TYPES.centerCenter,
    },
  }: SetWatermarkProps): Promise<Buffer> {
    try {
      if (typeof watermark === 'string') {
        return this.createImageWithTextWatermark({
          file: image,
          text: watermark,
          options,
        });
      }

      if (Buffer.isBuffer(watermark)) {
        return this.createImageWithImageWatermark({
          file: image,
          watermark,
          options,
        });
      }

      throw new Error('invalid format of watermark');
    } catch (error) {
      this.logger.error(error?.message ?? JSON.stringify(error));
      throw new Error(error);
    }
  }

  async createImageWithImageWatermark({
    file,
    watermark,
    options: {
      position = POSITION_TYPES.centerCenter,
      size = SIZES.s,
      type = WATERMARK_TYPES.single,
      imageHeight,
      imageWidth,
      ...options
    } = {
      type: WATERMARK_TYPES.single,
      size: SIZES.s,
      position: POSITION_TYPES.centerCenter,
    },
  }: SetImageWatermarkProps): Promise<Buffer> {
    try {
      if (!imageHeight || !imageWidth) {
        const { width, height } = await this.getImageMetadata(file);
        imageWidth = width;
        imageHeight = height;
      }

      const sizedWatermark = await this.setOptionsToImageWatermark({
        watermark,
        imageHeight,
        imageWidth,
        size,
        ...options,
      });

      if (type === WATERMARK_TYPES.single) {
        const coefficients = POSITION_COORDINATES_COEFFICIENTS[size];

        const compositeOptions: CompositePosition =
          this.generatePositionCoordinates({
            height: imageHeight,
            width: imageWidth,
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
          height: imageHeight,
          width: imageWidth,
        });
      }
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }

  async createImageWithTextWatermark({
    file,
    text,
    options = {
      type: WATERMARK_TYPES.single,
    },
  }: SetTextWatermarkProps): Promise<Buffer> {
    try {
      const { width, height } = await this.getImageMetadata(file);

      const generateOptions: GenerateWatermarkProps = {
        text,
        imageHeight: height,
        imageWidth: width,
        ...options,
      };

      const imageFromTextBuffer = await this.generateImageFromWatermarkText(
        text,
        generateOptions,
      );

      const imageWithWatermark = await this.createImageWithImageWatermark({
        file,
        watermark: imageFromTextBuffer,
        options: generateOptions,
      });

      return imageWithWatermark;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }

  //CORE SHARP METHODS

  private compositeImageAndWatermark(
    image: Buffer,
    options: OverlayOptions[],
  ): Promise<Buffer> {
    try {
      return sharp(image).composite(options).toBuffer();
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }

  private async getImageMetadata(image: Buffer): Promise<Metadata> {
    try {
      const metadata = await sharp(image).metadata();

      return metadata;
    } catch (error) {
      throw new Error(error);
    }
  }

  //METHODS FOR SET OPTIONS TO IMAGE WATERMARK

  private async setOptionsToImageWatermark({
    watermark,
    imageWidth: width,
    imageHeight: height,
    size = SIZES.s,
    opacity = 1,
    rotate = 0,
  }: SetSizeToImageWatermarkProps): Promise<Buffer> {
    try {
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
        .rotate(Number(rotate), { background: 'rgba(0,0,0,0)' })
        .toBuffer();

      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }

  private compositeImageAndWatermarkPattern({
    image,
    watermark,
    size,
    height,
    width,
  }: CompositeImageAndWatermarkPatternProps): Promise<Buffer> {
    const currentPattern = PATTERNS_FOR_COMPOSITE[size];

    const patternParts: OverlayOptions[] = [];
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

  private generatePositionCoordinates({
    height,
    width,
    position,
    coefficients,
  }: GeneratePositionCoordinatesProps): CompositePosition {
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

  private async generateImageFromWatermarkText(
    text: string,
    {
      color,
      size = SIZES.s,
      imageWidth,
      imageHeight,
    }: Partial<GenerateWatermarkProps>,
  ): Promise<Buffer> {
    const svgWidth = Math.floor(imageWidth * (SIZE_COEFFICIENTS[size] + 0.2));
    const svgHeight = Math.floor(imageHeight * (SIZE_COEFFICIENTS[size] + 0.2));

    const { defaultFontSize } = DICTIONARY[size];

    const dynamicSize = Math.floor(
      svgWidth / (text.length > 6 ? text.length / 2 : text.length),
    );

    const fontSize =
      dynamicSize > defaultFontSize ? defaultFontSize : dynamicSize;

    this.logger.log(
      `generated fontSize -> ${dynamicSize},
      choosed font size -> ${fontSize},
      svg width -> ${svgWidth},
      image width -> ${imageWidth},
      svg height -> ${svgHeight},
      image height -> ${imageHeight}`,
    );

    const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${svgWidth}px"
      height="${svgHeight}px"
      viewBox="0 0 ${svgWidth} ${svgHeight}"
      overflow="auto"
    >
    <style>
    .title { fill: rgba(${COLORS[color]});
    font-size: ${fontSize}px;
    font-weight: bold;
    text-align: center;
  }
    </style>
    <text
      x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    class="title"
  >
    ${text}
  </text>
    </svg>
  `;

    const svgBuffer = Buffer.from(svg);

    return sharp(svgBuffer).png().toBuffer();
  }
}
