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

  describe('generateSizes', () => {
    it('shoud be return a object with properties', () => {
      expect(service.generateSizes('s')).toEqual({
        width: 180,
        height: 50,
        fontSize: 20,
      });
      expect(service.generateSizes('m')).toEqual({
        width: 350,
        height: 100,
        fontSize: 40,
      });
      expect(service.generateSizes('l')).toEqual({
        width: 600,
        height: 150,
        fontSize: 60,
      });
    });
  });

  describe('generateWatermarkSvg', () => {
    it('should be return a buffer', () => {
      expect(
        service.generateWatermarkSvg({ text: 'test', size: 's' }),
      ).toBeInstanceOf(Buffer);
    });
  });

  describe('setWatermarkOnPhotoForTelegraf', () => {
    it('should be return a buffer', async () => {
      const file = readFileSync(join(process.cwd(), '7000.png'));

      expect(
        await service.setWatermarkOnPhotoForTelegraf({ file, text: 'test' }),
      ).toBeInstanceOf(Buffer);
    });
  });
});
