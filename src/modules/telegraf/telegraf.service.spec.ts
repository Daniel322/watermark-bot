import { Test, TestingModule } from '@nestjs/testing';
import { TelegrafService } from './telegraf.service';
import { ConfigModule } from '@nestjs/config';

describe('TelegrafService', () => {
  let service: TelegrafService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [TelegrafService],
    }).compile();

    service = module.get<TelegrafService>(TelegrafService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
