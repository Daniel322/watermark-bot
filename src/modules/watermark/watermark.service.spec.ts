import { Test, TestingModule } from '@nestjs/testing';
import { WatermarkService } from './watermark.service';
import {
  GeneratePatternProps,
  GenerateTextWatermarkProps,
  dictionary,
} from './watermark.types';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    it('should be return number or record with numbers of watermark type', () => {
      const { x: xS, y: yS } = dictionary['s'];
      const { x: xM, y: yM } = dictionary['m'];
      const { x: xL, y: yL } = dictionary['l'];

      expect(service.getCoordUtil(xS, 'single')).toEqual<number>(1);
      expect(service.getCoordUtil(xS, 'pattern')).toEqual<number>(0.5);
      expect(service.getCoordUtil(yS, 'single')).toEqual<number>(5);
      expect(service.getCoordUtil(yS, 'pattern')).toEqual<number>(4);
      expect(service.getCoordUtil(xM, 'single')).toEqual<number>(1);
      expect(service.getCoordUtil(xM, 'pattern')).toEqual<number>(1);
      expect(service.getCoordUtil(yM, 'single')).toEqual<number>(7);
      expect(service.getCoordUtil(yM, 'pattern')).toEqual<number>(7);
      expect(service.getCoordUtil(xL, 'single')).toEqual<number>(1);
      expect(service.getCoordUtil(xL, 'pattern')).toEqual<number>(5);
      expect(service.getCoordUtil(yL, 'single')).toEqual<number>(10);
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
    const options: GenerateTextWatermarkProps = {
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
    const options: GenerateTextWatermarkProps = {
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
        await service.compositeImageAndWatermark(file, watermark),
      ).toBeDefined();
    });

    it('should be return a instance of buffer', async () => {
      expect(
        await service.compositeImageAndWatermark(file, watermark),
      ).toBeInstanceOf(Buffer);
    });
  });

  describe('createImageWithTextWatermark', () => {
    const file = readFileSync(join(process.cwd(), '7000.png'));
    it('should be defined', async () => {
      expect(
        await service.createImageWithTextWatermark({ file, text: 'test' }),
      ).toBeDefined();
    });

    it('should be return a instance of buffer', async () => {
      expect(
        await service.createImageWithTextWatermark({ file, text: 'test' }),
      ).toBeInstanceOf(Buffer);
    });
  });
});
