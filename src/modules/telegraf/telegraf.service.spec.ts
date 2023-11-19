import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Context, Telegraf, Telegram } from 'telegraf';
import { Update, UserFromGetMe } from 'telegraf/typings/core/types/typegram';
import { Deunionize } from 'telegraf/typings/deunionize';

import { WatermarkService } from '@modules/watermark/watermark.service';

import { TelegrafService } from './telegraf.service';
import { TELEGRAF_TOKEN } from './telegraf-provider';
import { MESSAGES } from './constants';

const TELEGRAM_USER_MOCK = {
  id: Date.now(),
};

const TELEGRAF_PROVIDER_MOCK = (() => {
  const tg = new Telegraf('');
  tg.launch = jest.fn(() => Promise.resolve());
  tg.stop = jest.fn();
  tg.start = jest.fn();
  tg.on = jest.fn();

  return tg;
})();

const makeTelegrafMockContext = (update = {}) => {
  const ctx = new Context(
    update as Deunionize<Update>,
    {} as Telegram,
    {} as UserFromGetMe,
  );
  ctx.reply = jest.fn();
  ctx.replyWithPhoto = jest.fn();
  return ctx;
};

const CACHE_MANAGER_MOCK = {
  store: new Map(),
  set: jest.fn((key: string, value: unknown) => {
    CACHE_MANAGER_MOCK.store.set(key, value);
  }),
  get: jest.fn((key: string) => {
    return CACHE_MANAGER_MOCK.store.get(key);
  }),
};

describe('TelegrafService', () => {
  let service: TelegrafService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        TelegrafService,
        {
          provide: WatermarkService,
          useValue: {
            setWatermarkOnPhotoForTelegraf(buf: Buffer): Buffer {
              return buf;
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: CACHE_MANAGER_MOCK,
        },
        {
          provide: TELEGRAF_TOKEN,
          useValue: TELEGRAF_PROVIDER_MOCK,
        },
      ],
    }).compile();

    service = module.get<TelegrafService>(TelegrafService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit should launch bot', () => {
    service.setListeners = jest.fn();
    service.onModuleInit();
    expect(service.setListeners).toHaveBeenCalled();
    expect(TELEGRAF_PROVIDER_MOCK.launch).toHaveBeenCalled();
  });

  it('onModuleDestroy should call telegraf stop method with right signals', () => {
    service.onModuleDestroy();
    expect(TELEGRAF_PROVIDER_MOCK.stop).toHaveBeenCalledWith('SIGINT');
    expect(TELEGRAF_PROVIDER_MOCK.stop).toHaveBeenCalledWith('SIGTERM');
  });

  it('setListeners should set bot listeners', () => {
    service.setListeners();

    expect(TELEGRAF_PROVIDER_MOCK.start).toHaveBeenCalledWith(service.onStart);

    expect(TELEGRAF_PROVIDER_MOCK.on).toHaveBeenCalledWith(
      expect.any(Function),
      service.onPhoto,
    );
    expect(TELEGRAF_PROVIDER_MOCK.on).toHaveBeenCalledWith(
      expect.any(Function),
      service.onText,
    );

    expect(TELEGRAF_PROVIDER_MOCK.start).toHaveBeenCalledTimes(1);
    expect(TELEGRAF_PROVIDER_MOCK.on).toHaveBeenCalledTimes(2);
  });

  it('onStart should send welcome message', () => {
    const ctx = makeTelegrafMockContext();
    service.onStart(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.WELCOME);
  });

  describe('onText', () => {
    it('Should reply with BAD_REQUEST message if "text" is not in message', async () => {
      const ctx = makeTelegrafMockContext({ message: {} });
      await service.onText(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should reply with BAD_REQUEST message if "text" is not in message', async () => {
      const ctx = makeTelegrafMockContext({ message: {} });
      await service.onText(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should reply with FILE_NOT_FOUND file was not found in cache', async () => {
      const ctx = makeTelegrafMockContext({
        message: { text: 'test', from: TELEGRAM_USER_MOCK },
      });
      await service.onText(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.FILE_NOT_FOUND);
    });

    it('Should reply with file buffer if it was found', async () => {
      const buf = Buffer.alloc(10);
      buf.fill('A');

      CACHE_MANAGER_MOCK.set(String(TELEGRAM_USER_MOCK.id), buf.buffer);

      const ctx = makeTelegrafMockContext({
        message: { text: 'test', from: TELEGRAM_USER_MOCK },
      });

      await service.onText(ctx);
      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          source: buf.buffer,
        }),
      );
    });
  });
});
