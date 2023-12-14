import { Test, TestingModule } from '@nestjs/testing';

import { readFileSync } from 'fs';
import { join } from 'path';

import { WatermarkService } from './watermark.service';
import {
  GeneratePatternProps,
  GenerateWatermarkProps,
  GetXCoordinateProps,
  PositionType,
} from './watermark.types';
import { DICTIONARY, SIZES, WATERMARK_TYPES } from './watermark.constants';

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

      expect(service['getCoordUtil'](xS, 'single')).toEqual<number>(45);
      expect(service['getCoordUtil'](xS, 'pattern')).toEqual<number>(0.5);
      expect(service['getCoordUtil'](yS, 'single')).toEqual<number>(50);
      expect(service['getCoordUtil'](yS, 'pattern')).toEqual<number>(4);
      expect(service['getCoordUtil'](xM, 'single')).toEqual<number>(40);
      expect(service['getCoordUtil'](xM, 'pattern')).toEqual<number>(1);
      expect(service['getCoordUtil'](yM, 'single')).toEqual<number>(50);
      expect(service['getCoordUtil'](yM, 'pattern')).toEqual<number>(6);
      expect(service['getCoordUtil'](xL, 'single')).toEqual<number>(33);
      expect(service['getCoordUtil'](xL, 'pattern')).toEqual<number>(5);
      expect(service['getCoordUtil'](yL, 'single')).toEqual<number>(50);
      expect(service['getCoordUtil'](yL, 'pattern')).toEqual<number>(10);
    });
  });

  describe('getXCoordinateUtil', () => {
    const options: Omit<GetXCoordinateProps, 'position'> = {
      imageWidth: 1000,
      fontSize: 50,
      text: 'test',
    };

    const leftPositionArr: PositionType[] = [
      'topLeft',
      'centerLeft',
      'bottomLeft',
    ];

    for (const position of leftPositionArr) {
      it('should be defined', () => {
        expect(
          service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toBeDefined();
      });

      it('should return number', () => {
        expect(
          typeof service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toBe('number');
      });

      it('should return 1', () => {
        expect(
          service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toEqual(1);
      });
    }

    const centerPositionArr: PositionType[] = [
      'topCenter',
      'centerCenter',
      'bottomCenter',
    ];

    for (const position of centerPositionArr) {
      it('should be defined', () => {
        expect(
          service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toBeDefined();
      });

      it('should return number', () => {
        expect(
          typeof service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toBe('number');
      });

      it('should return 45', () => {
        expect(
          service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toEqual(45);
      });
    }

    const rightPositionArr: PositionType[] = [
      'bottomRight',
      'centerRight',
      'topRight',
    ];

    for (const position of rightPositionArr) {
      it('should be defined', () => {
        expect(
          service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toBeDefined();
      });

      it('should return number', () => {
        expect(
          typeof service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toBe('number');
      });

      it('should return 80', () => {
        expect(
          service['getXCoordinateUtil']({
            ...options,
            position: position,
          }),
        ).toEqual(80);
      });
    }

    it('should throw', () => {
      const getXCoordinateUtilWithInvalidPosition = () => {
        return service['getXCoordinateUtil']({
          ...options,
          position: 'invalid position' as PositionType,
        });
      };

      expect(getXCoordinateUtilWithInvalidPosition).toThrow('INVALID POSITION');
    });
  });

  describe('getFontSize', () => {
    const defaultOptions = { textLength: 10, imageWidth: 1000 };
    it('get number of font size', () => {
      expect(typeof service['getFontSize'](defaultOptions)).toBe('number');
    });

    for (const size of Object.values(SIZES)) {
      const { defaultFontSize, weightCoefficient } = DICTIONARY[size];

      const dynamicSize = Math.floor(
        (defaultOptions.imageWidth * weightCoefficient) /
          defaultOptions.textLength,
      );
      it('should return default font size from dictionary', () => {
        expect(
          service['getFontSize']({ size, imageWidth: 1000, textLength: 1 }),
        ).toEqual(defaultFontSize);
      });

      it('should return dynamicSize', () => {
        expect(service['getFontSize']({ ...defaultOptions, size })).toEqual(
          dynamicSize,
        );
      });
    }
  });

  describe('generatePattern', () => {
    it('generate pattern string', () => {
      const options: GeneratePatternProps = {
        text: 'test',
        x: 1,
        y: 5,
        size: 's',
        imageWidth: 1000,
        imageHeight: 500,
        fontSize: 75,
      };

      expect(typeof service['generatePattern'](options)).toBe('string');
    });
  });

  describe('generatePatternWatermarkSvg', () => {
    const options: GenerateWatermarkProps = {
      text: 'test',
      imageWidth: 500,
      imageHeight: 500,
    };

    it('return defined value', () => {
      expect(service['generatePatternWatermarkSvg'](options)).toBeDefined();
    });

    it('return instance of buffer', () => {
      expect(service['generatePatternWatermarkSvg'](options)).toBeInstanceOf(
        Buffer,
      );
    });

    it('should call generate pattern method', () => {
      service['generatePattern'] = jest.fn();

      service['generatePatternWatermarkSvg'](options);

      expect(service['generatePattern']).toHaveBeenCalled();
      expect(service['generatePattern']).toHaveBeenCalledTimes(1);
    });

    it('should call getCoordUtil method', () => {
      service['getCoordUtil'] = jest.fn();

      service['generatePatternWatermarkSvg'](options);

      expect(service['getCoordUtil']).toHaveBeenCalled();
      expect(service['getCoordUtil']).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateSingleWatermarkSvg', () => {
    const options: GenerateWatermarkProps = {
      text: 'test',
      imageWidth: 1000,
      imageHeight: 1000,
    };

    it('return defined value', () => {
      expect(service['generateSingleWatermarkSvg'](options)).toBeDefined();
    });

    it('return instance of buffer', () => {
      expect(service['generateSingleWatermarkSvg'](options)).toBeInstanceOf(
        Buffer,
      );
    });

    it('should call getFontSize method', () => {
      service['getFontSize'] = jest.fn();

      service['generateSingleWatermarkSvg'](options);

      expect(service['getFontSize']).toHaveBeenCalled();
      expect(service['getFontSize']).toHaveBeenCalledTimes(1);
    });

    it('should call getXCoordinateUtil method', () => {
      service['getXCoordinateUtil'] = jest.fn();

      service['generateSingleWatermarkSvg'](options);

      expect(service['getXCoordinateUtil']).toHaveBeenCalled();
      expect(service['getXCoordinateUtil']).toHaveBeenCalledTimes(1);
    });

    it('should call getXCoordinateUtil method', () => {
      service['getCoordUtil'] = jest.fn();

      service['generateSingleWatermarkSvg'](options);

      expect(service['getCoordUtil']).toHaveBeenCalled();
      expect(service['getCoordUtil']).toHaveBeenCalledTimes(1);
    });
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

    it('should throw if file is invalid', () => {
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

    it('should throw if watermark is invalid', () => {
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

    it('should to throw', async () => {
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

    it('should call generateSingleWatermarkSvg if type single', async () => {
      jest.spyOn(
        service,
        'generateSingleWatermarkSvg' as keyof WatermarkService,
      );

      await service.createImageWithTextWatermark({
        file,
        text: 'test',
        options: { type: WATERMARK_TYPES.single },
      });

      expect(service['generateSingleWatermarkSvg']).toHaveBeenCalled();
      expect(service['generateSingleWatermarkSvg']).toHaveBeenCalledTimes(1);
    });

    it('should call generatePatternWatermarkSvg if type pattern', async () => {
      jest.spyOn(
        service,
        'generatePatternWatermarkSvg' as keyof WatermarkService,
      );

      await service.createImageWithTextWatermark({
        file,
        text: 'test',
        options: { type: WATERMARK_TYPES.pattern },
      });

      expect(service['generatePatternWatermarkSvg']).toHaveBeenCalled();
      expect(service['generatePatternWatermarkSvg']).toHaveBeenCalledTimes(1);
    });

    it('should call compositeImageAndWatermark', async () => {
      jest.spyOn(
        service,
        'compositeImageAndWatermark' as keyof WatermarkService,
      );

      await service.createImageWithTextWatermark({
        file,
        text: 'test',
        options: { type: WATERMARK_TYPES.pattern },
      });

      expect(service['compositeImageAndWatermark']).toHaveBeenCalled();
      expect(service['compositeImageAndWatermark']).toHaveBeenCalledTimes(1);
    });

    it('should throw', async () => {
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

    it('should throw', async () => {
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
