import { Test, TestingModule } from '@nestjs/testing';

import { readFileSync } from 'fs';
import { join } from 'path';

import { WatermarkService } from './watermark.service';
import {
  GeneratePatternProps,
  GenerateWatermarkProps,
} from './watermark.types';
import { DICTIONARY, SIZES } from './watermark.constants';

describe('WatermarkService', () => {
  let service: WatermarkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WatermarkService],
    }).compile();

    service = module.get<WatermarkService>(WatermarkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCoordUtil', () => {
    it('should return number or record with numbers of watermark type', () => {
      const { x: xS, y: yS } = DICTIONARY['s'];
      const { x: xM, y: yM } = DICTIONARY['m'];
      const { x: xL, y: yL } = DICTIONARY['l'];

      expect(service.getCoordUtil(xS, 'single')).toEqual<number>(45);
      expect(service.getCoordUtil(xS, 'pattern')).toEqual<number>(0.5);
      expect(service.getCoordUtil(yS, 'single')).toEqual<number>(50);
      expect(service.getCoordUtil(yS, 'pattern')).toEqual<number>(4);
      expect(service.getCoordUtil(xM, 'single')).toEqual<number>(40);
      expect(service.getCoordUtil(xM, 'pattern')).toEqual<number>(1);
      expect(service.getCoordUtil(yM, 'single')).toEqual<number>(50);
      expect(service.getCoordUtil(yM, 'pattern')).toEqual<number>(6);
      expect(service.getCoordUtil(xL, 'single')).toEqual<number>(33);
      expect(service.getCoordUtil(xL, 'pattern')).toEqual<number>(5);
      expect(service.getCoordUtil(yL, 'single')).toEqual<number>(50);
      expect(service.getCoordUtil(yL, 'pattern')).toEqual<number>(10);
    });
  });

  describe('getFontSize', () => {
    it('get number of font size', () => {
      const defaultOptions = { textLength: 10, imageWidth: 1000 };
      expect(typeof service.getFontSize(defaultOptions)).toBe('number');
    });
  });

  describe('generatePattern', () => {
    it('generate pattern string', () => {
      const options: GeneratePatternProps = {
        text: 'test',
        x: 1,
        y: 5,
        size: 's',
      };

      expect(typeof service.generatePattern(options)).toBe('string');
    });
  });

  describe('generatePatternWatermarkSvg', () => {
    const options: GenerateWatermarkProps = {
      text: 'test',
      imageWidth: 500,
      imageHeight: 500,
    };

    it('return defined value', () => {
      expect(service.generatePatternWatermarkSvg(options)).toBeDefined();
    });

    it('return instance of buffer', () => {
      expect(service.generatePatternWatermarkSvg(options)).toBeInstanceOf(
        Buffer,
      );
    });
  });

  describe('generateSingleWatermarkSvg', () => {
    const options: GenerateWatermarkProps = {
      text: 'test',
      imageWidth: 1000,
      imageHeight: 1000,
    };

    it('return defined value', () => {
      expect(service.generateSingleWatermarkSvg(options)).toBeDefined();
    });

    it('return instance of buffer', () => {
      expect(service.generateSingleWatermarkSvg(options)).toBeInstanceOf(
        Buffer,
      );
    });
  });

  describe('compositeImageAndWatermark', () => {
    const file = readFileSync(join(process.cwd(), '7000.png'));
    const watermark = readFileSync(join(process.cwd(), '7000.png'));

    it('should be defined', async () => {
      expect(
        await service.compositeImageAndWatermark(file, [
          { input: watermark, top: 0, left: 0 },
        ]),
      ).toBeDefined();
    });

    it('should return a instance of buffer', async () => {
      expect(
        await service.compositeImageAndWatermark(file, [
          { input: watermark, top: 0, left: 0 },
        ]),
      ).toBeInstanceOf(Buffer);
    });
  });

  describe('getImageMetadata', () => {
    const file = readFileSync(join(process.cwd(), '7000.png'));

    it('shoul be defined', async () => {
      expect(await service.getImageMetadata(file)).toBeDefined();
    });

    it('should return sharp metadata object', async () => {
      expect(await service.getImageMetadata(file)).toHaveProperty('width');
      expect(await service.getImageMetadata(file)).toHaveProperty('height');
    });

    it('should return error', async () => {
      const badBuffer = Buffer.from([0, 0, 0, 0]);
      expect(async () => {
        await service.getImageMetadata(badBuffer);
      }).rejects.toThrow();
    });
  });

  describe('createImageWithTextWatermark', () => {
    const file = readFileSync(join(process.cwd(), '7000.png'));
    it('should be defined', async () => {
      expect(
        await service.createImageWithTextWatermark({ file, text: 'test' }),
      ).toBeDefined();
    });

    it('should return a instance of buffer', async () => {
      expect(
        await service.createImageWithTextWatermark({ file, text: 'test' }),
      ).toBeInstanceOf(Buffer);
    });
  });

  describe('createImageWithImageWatermark', () => {
    const file = readFileSync(join(process.cwd(), '7000.png'));

    it('should be defined', async () => {
      expect(
        await service.createImageWithImageWatermark({
          file,
          watermark: file,
        }),
      ).toBeDefined();
    });

    it('should return a instance of buffer', async () => {
      expect(
        await service.createImageWithImageWatermark({ file, watermark: file }),
      ).toBeInstanceOf(Buffer);
    });
  });

  describe('setOptionsToImageWatermark', () => {
    const watermark = readFileSync(join(process.cwd(), '7000.png'));
    const options: GenerateWatermarkProps = {
      text: 'test',
      imageWidth: 1000,
      imageHeight: 1000,
    };

    it('should be defined', async () => {
      expect(
        await service.setOptionsToImageWatermark({ watermark, ...options }),
      ).toBeDefined();
    });

    it('should return a instance of buffer', async () => {
      expect(
        await service.setOptionsToImageWatermark({ watermark, ...options }),
      ).toBeInstanceOf(Buffer);
    });
  });

  describe('compositeImageAndWatermarkPattern', () => {
    const watermark = readFileSync(join(process.cwd(), '7000.png'));
    const image = watermark;
    const size = SIZES.s;
    const height = 1000;
    const width = 1000;

    it('should be defined', async () => {
      expect(
        await service.compositeImageAndWatermarkPattern({
          watermark,
          image,
          size,
          width,
          height,
        }),
      ).toBeDefined();
    });

    it('should return a instance of buffer', async () => {
      expect(
        await service.compositeImageAndWatermarkPattern({
          watermark,
          image,
          size,
          width,
          height,
        }),
      ).toBeInstanceOf(Buffer);
    });
  });
});
