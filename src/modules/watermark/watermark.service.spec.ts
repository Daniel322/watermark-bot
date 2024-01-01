import { Test, TestingModule } from '@nestjs/testing';

import { readFileSync } from 'fs';
import { join } from 'path';

import { WatermarkService } from './watermark.service';
import { GenerateWatermarkProps } from './watermark.types';
import { SIZES, WATERMARK_TYPES } from './watermark.constants';

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

  describe('compositeImageAndWatermark', () => {
    const file = readFileSync(join(process.cwd(), '7000.png'));
    const watermark = readFileSync(join(process.cwd(), '7000.png'));

    it('should be defined', async () => {
      expect(
        await service['compositeImageAndWatermark'](file, [
          { input: watermark, top: 0, left: 0 },
        ]),
      ).toBeDefined();
    });

    it('should return a instance of buffer', async () => {
      expect(
        await service['compositeImageAndWatermark'](file, [
          { input: watermark, top: 0, left: 0 },
        ]),
      ).toBeInstanceOf(Buffer);
    });

    it('should throw an error if file is invalid', () => {
      const badBuffer = Buffer.from([0, 0, 0, 0]);
      expect(() =>
        service['compositeImageAndWatermark'](badBuffer, [
          {
            input: watermark,
            top: 0,
            left: 0,
          },
        ]),
      ).rejects.toThrow();
    });

    it('should throw an error if watermark is invalid', () => {
      const badBuffer = Buffer.from([0, 0, 0, 0]);
      expect(() =>
        service['compositeImageAndWatermark'](file, [
          {
            input: badBuffer,
            top: 0,
            left: 0,
          },
        ]),
      ).rejects.toThrow();
    });
  });

  describe('getImageMetadata', () => {
    const file = readFileSync(join(process.cwd(), '7000.png'));

    it('shoul be defined', async () => {
      expect(await service['getImageMetadata'](file)).toBeDefined();
    });

    it('should return sharp metadata object', async () => {
      expect(await service['getImageMetadata'](file)).toHaveProperty('width');
      expect(await service['getImageMetadata'](file)).toHaveProperty('height');
    });

    it('should return error', async () => {
      const badBuffer = Buffer.from([0, 0, 0, 0]);
      expect(async () => {
        await service['getImageMetadata'](badBuffer);
      }).rejects.toThrow();
    });
  });

  describe('setOptionsToImageWatermark', () => {
    const watermark = readFileSync(join(process.cwd(), '7000.png'));

    const options: GenerateWatermarkProps = {
      text: 'test',
      imageWidth: 1000,
      imageHeight: 1000,
    };

    const badBuffer = Buffer.from([0, 0, 0, 0]);

    it('should be defined', async () => {
      expect(
        await service['setOptionsToImageWatermark']({ watermark, ...options }),
      ).toBeDefined();
    });

    it('should return a instance of buffer', async () => {
      expect(
        await service['setOptionsToImageWatermark']({ watermark, ...options }),
      ).toBeInstanceOf(Buffer);
    });

    it('should throw an error', async () => {
      expect(async () => {
        await service['setOptionsToImageWatermark']({
          watermark: badBuffer,
          ...options,
        });
      }).rejects.toThrow();
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
        await service['compositeImageAndWatermarkPattern']({
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
        await service['compositeImageAndWatermarkPattern']({
          watermark,
          image,
          size,
          width,
          height,
        }),
      ).toBeInstanceOf(Buffer);
    });

    it('should call compositeImageAndWatermark', () => {
      service['compositeImageAndWatermark'] = jest.fn();
      service['compositeImageAndWatermarkPattern']({
        watermark,
        image,
        size,
        width,
        height,
      });

      expect(service['compositeImageAndWatermark']).toHaveBeenCalled();
    });

    it('should call compositeImageAndWatermark one time', () => {
      service['compositeImageAndWatermark'] = jest.fn();
      service['compositeImageAndWatermarkPattern']({
        watermark,
        image,
        size,
        width,
        height,
      });

      expect(service['compositeImageAndWatermark']).toHaveBeenCalledTimes(1);
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

    it('should call getImageMetadata', async () => {
      jest.spyOn(service, 'getImageMetadata' as keyof WatermarkService);

      await service.createImageWithTextWatermark({ file, text: 'test' });

      expect(service['getImageMetadata']).toHaveBeenCalled();
      expect(service['getImageMetadata']).toHaveBeenCalledTimes(1);
    });

    it('should throw an error', async () => {
      const badBuffer = Buffer.from([0, 0, 0, 0]);
      expect(async () => {
        await service.createImageWithTextWatermark({
          file: badBuffer,
          text: 'test',
        });
      }).rejects.toThrow();
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

    it('should call getImageMetadata', async () => {
      jest.spyOn(service, 'getImageMetadata' as keyof WatermarkService);

      await service.createImageWithImageWatermark({ file, watermark: file });

      expect(service['getImageMetadata']).toHaveBeenCalled();
      expect(service['getImageMetadata']).toHaveBeenCalledTimes(1);
    });

    it('should call setOptionsToImageWatermark', async () => {
      jest.spyOn(
        service,
        'setOptionsToImageWatermark' as keyof WatermarkService,
      );

      await service.createImageWithImageWatermark({ file, watermark: file });

      expect(service['setOptionsToImageWatermark']).toHaveBeenCalled();
      expect(service['setOptionsToImageWatermark']).toHaveBeenCalledTimes(1);
    });

    it('should call generatePositionCoordinates if type single', async () => {
      jest.spyOn(
        service,
        'generatePositionCoordinates' as keyof WatermarkService,
      );

      await service.createImageWithImageWatermark({
        file,
        watermark: file,
        options: { type: WATERMARK_TYPES.single },
      });

      expect(service['generatePositionCoordinates']).toHaveBeenCalled();
      expect(service['generatePositionCoordinates']).toHaveBeenCalledTimes(1);
    });

    it('should call compositeImageAndWatermark if type single', async () => {
      jest.spyOn(
        service,
        'compositeImageAndWatermark' as keyof WatermarkService,
      );

      await service.createImageWithImageWatermark({
        file,
        watermark: file,
        options: { type: WATERMARK_TYPES.single },
      });

      expect(service['compositeImageAndWatermark']).toHaveBeenCalled();
      expect(service['compositeImageAndWatermark']).toHaveBeenCalledTimes(1);
    });

    it('should call compositeImageAndWatermarkPattern if type pattern', async () => {
      jest.spyOn(
        service,
        'compositeImageAndWatermarkPattern' as keyof WatermarkService,
      );

      await service.createImageWithImageWatermark({
        file,
        watermark: file,
        options: { type: WATERMARK_TYPES.pattern },
      });

      expect(service['compositeImageAndWatermarkPattern']).toHaveBeenCalled();
      expect(
        service['compositeImageAndWatermarkPattern'],
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw an error', async () => {
      const badBuffer = Buffer.from([0, 0, 0, 0]);
      expect(async () => {
        await service.createImageWithImageWatermark({
          file: badBuffer,
          watermark: badBuffer,
        });
      }).rejects.toThrow();
    });
  });
});
