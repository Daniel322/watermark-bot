import { Test, TestingModule } from '@nestjs/testing';
import { WatermarkService } from './watermark.service';
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

  // describe('generateSizes', () => {
  //   it('shoud be return a object with properties', () => {
  //     const text = 'test';
  //     const imageWidth = 1000;
  //     const dynamicSize = Math.floor((imageWidth * 0.5) / text.length);
  //     expect(
  //       service.generateSizes({
  //         textLength: text.length,
  //         imageWidth,
  //       }),
  //     ).toEqual({
  //       x: 1,
  //       y: 5,
  //       fontSize: dynamicSize > 40 ? 40 : dynamicSize,
  //       weightCoefficient: 0.3,
  //     });
  //     expect(
  //       service.generateSizes({
  //         textLength: text.length,
  //         imageWidth,
  //         type: 'pattern',
  //       }),
  //     ).toEqual({
  //       x: 0.5,
  //       y: 4,
  //       fontSize: dynamicSize > 40 ? 40 : dynamicSize,
  //       weightCoefficient: 0.3,
  //     });
  //   });
  // });

  // describe('generateWatermarkSvg', () => {
  //   it('should be return a buffer', () => {
  //     const imageWidth = 1000;
  //     const imageHeight = 1000;
  //     expect(
  //       service.generateWatermarkSvg({
  //         text: 'test',
  //         size: 's',
  //         type: 'single',
  //         imageHeight,
  //         imageWidth,
  //       }),
  //     ).toBeInstanceOf(Buffer);
  //   });
  // });

  // describe('setWatermarkOnPhotoForTelegraf', () => {
  //   it('should be return a buffer', async () => {
  //     const file = readFileSync(join(process.cwd(), '7000.png'));

  //     expect(
  //       await service.setWatermarkOnPhotoForTelegraf({ file, text: 'test' }),
  //     ).toBeInstanceOf(Buffer);
  //   });
  // });
});
