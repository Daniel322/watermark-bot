import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Context, Telegraf, Telegram } from 'telegraf';
import { Update, UserFromGetMe } from 'telegraf/typings/core/types/typegram';
import { Deunionize } from 'telegraf/typings/deunionize';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';

import { WatermarkService } from '@modules/watermark/watermark.service';

import { TelegrafService } from './telegraf.service';
import { TELEGRAF_TOKEN } from './telegraf.provider';
import {
  ACTIONS,
  BOT_STATES,
  COMMANDS,
  COMMANDS_LIST,
  MESSAGES,
  SYS_MESSAGES,
} from './telegraf.constants';
import { TelegrafUiServuce } from './telegraf.ui.service';
import { TelegrafUsersStatesService } from './telegraf.users-states.service';
import {
  COLORS_TYPES,
  SIZES,
  WATERMARK_TYPES,
} from '@modules/watermark/watermark.types';

const makeTelegrafMock = () => {
  const tg = new Telegraf('');
  tg.launch = jest.fn(() => Promise.resolve());
  tg.stop = jest.fn();
  tg.start = jest.fn();
  tg.on = jest.fn();
  tg.command = jest.fn();
  tg.action = jest.fn();
  Object.assign(tg.telegram, {
    getFileLink: () => Promise.resolve('http://localhost'),
    setMyCommands: jest.fn(),
  });
  return tg;
};

const makeTelegrafMockContext = (update = {}) => {
  const ctx = new Context(
    update as Deunionize<Update>,
    {} as Telegram,
    {} as UserFromGetMe,
  );
  ctx.reply = jest.fn();
  ctx.replyWithPhoto = jest.fn();
  ctx.editMessageText = jest.fn();
  return ctx;
};

const makeMockCacheManager = () => {
  const store = new Map();
  return {
    store,
    set: jest.fn((key: string, value: unknown) => {
      store.set(key, value);
    }),
    get: jest.fn((key: string) => {
      return store.get(key);
    }),
  };
};

const makeHttpServiceMock = () => new HttpService();

const makeTelefrafUiServiceMock = () => ({
  patternTypeKeyboard: ['1', '2'],
});

const makeTelegrafUserStateServiceMock = () => ({
  hasState: jest.fn(),
  getState: jest.fn(),
  update: jest.fn(),
});

describe('TelegrafService', () => {
  let service: TelegrafService;

  const cacheManager = makeMockCacheManager();
  const telegraf = makeTelegrafMock();
  const httpService = makeHttpServiceMock();
  const telegrafUiServuce = makeTelefrafUiServiceMock();
  const telegrafUsersStatesService = makeTelegrafUserStateServiceMock();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        TelegrafService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: WatermarkService,
          useValue: {
            createImageWithTextWatermark({ file }): Buffer {
              return file;
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: TELEGRAF_TOKEN,
          useValue: telegraf,
        },
        {
          provide: TelegrafUiServuce,
          useValue: telegrafUiServuce,
        },
        {
          provide: TelegrafUsersStatesService,
          useValue: telegrafUsersStatesService,
        },
      ],
    }).compile();

    service = module.get<TelegrafService>(TelegrafService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('Should launch bot', () => {
      service.setCommands = () => {};
      service.setListeners = () => {};
      service.onModuleInit();
      expect(telegraf.launch).toHaveBeenCalled();
    });

    it('Should call setListeners', () => {
      service.setListeners = jest.fn();
      service.setCommands = () => {};
      service.onModuleInit();
      expect(service.setListeners).toHaveBeenCalled();
    });

    it('Should call setCommands', () => {
      service.setCommands = jest.fn();
      service.setListeners = () => {};
      service.onModuleInit();
      expect(service.setCommands).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('Should call telegraf stop method with right signals', () => {
      service.onModuleDestroy();
      expect(telegraf.stop).toHaveBeenCalledWith('SIGINT');
      expect(telegraf.stop).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('setCommands', () => {
    it('Should set bot commands', () => {
      service.setCommands();
      expect(telegraf.telegram.setMyCommands).toHaveBeenCalledWith(
        expect.arrayContaining(
          COMMANDS_LIST.map((item) => expect.objectContaining(item)),
        ),
      );
    });
  });

  describe('setListeners', () => {
    it('Should set bot listeners', () => {
      service.setListeners();

      expect(telegraf.start).toHaveBeenCalledWith(service.onStart);

      expect(telegraf.on).toHaveBeenCalledWith(
        expect.any(Function),
        service.onPhoto,
      );
      expect(telegraf.on).toHaveBeenCalledWith(
        expect.any(Function),
        service.onText,
      );
      expect(telegraf.action).toHaveBeenCalledWith(
        Object.values(COLORS_TYPES),
        service.onColor,
      );
      expect(telegraf.action).toHaveBeenCalledWith(
        Object.values(WATERMARK_TYPES),
        service.onPlacementStyle,
      );
      expect(telegraf.action).toHaveBeenCalledWith(
        Object.values(SIZES),
        service.onSize,
      );
      expect(telegraf.action).toHaveBeenCalledWith(
        new RegExp(ACTIONS.OPACITY),
        service.onOpacity,
      );
      expect(telegraf.action).toHaveBeenCalledWith(
        new RegExp(ACTIONS.POSITION),
        service.onPosition,
      );

      expect(telegraf.start).toHaveBeenCalledTimes(1);
      expect(telegraf.command).toHaveBeenCalledTimes(1);
      expect(telegraf.on).toHaveBeenCalledTimes(2);
      expect(telegraf.action).toHaveBeenCalledTimes(5);
    });
  });

  describe('onStart', () => {
    it('Should send welcome message', () => {
      const ctx = makeTelegrafMockContext();
      service.onStart(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.WELCOME);
    });
  });

  describe('onText', () => {
    it('Should reply with BAD_REQUEST message if "text" is not in message', () => {
      const ctx = makeTelegrafMockContext({ message: {} });
      service.onText(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Shoud call stateNotFoundReply if user state was not found', () => {
      const ctx = makeTelegrafMockContext({
        message: {
          text: 'test',
          from: { id: Date.now() },
        },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => false);
      service.stateNotFoundReply = jest.fn();

      service.onText(ctx);

      expect(service.stateNotFoundReply).toHaveBeenCalled();
    });

    it('Should call onWatermarkText if current user state is ADD_TEXT', () => {
      const ctx = makeTelegrafMockContext({
        message: {
          text: 'test',
          from: { id: Date.now() },
        },
      });

      telegrafUsersStatesService.hasState = jest.fn(() => true);
      telegrafUsersStatesService.getState = jest.fn(() => BOT_STATES.ADD_TEXT);
      service.onWatermarkText = jest.fn();

      service.onText(ctx);

      expect(service.onWatermarkText).toHaveBeenCalled();
    });

    it('Should call onWatermarkText if current user state is CHOOSE_ROTATION', () => {
      const ctx = makeTelegrafMockContext({
        message: {
          text: 'test',
          from: { id: Date.now() },
        },
      });

      telegrafUsersStatesService.hasState = jest.fn(() => true);
      telegrafUsersStatesService.getState = jest.fn(
        () => BOT_STATES.CHOOSE_ROTATION,
      );
      service.onRotationText = jest.fn();

      service.onText(ctx);

      expect(service.onRotationText).toHaveBeenCalled();
    });
  });

  describe('onWatermarkText', () => {
    it('Should return undefined if could not transist to the given state', () => {
      const ctx = makeTelegrafMockContext();
      service.tryTransistToGivenState = jest.fn(() => false);
      expect(service.onWatermarkText(ctx, 1, 'test')).toBeUndefined();
    });

    it('Should reply with if it transist to given state', () => {
      const ctx = makeTelegrafMockContext();
      ctx.replyWithMarkdownV2 = jest.fn();
      service.tryTransistToGivenState = jest.fn(() => true);

      service.onWatermarkText(ctx, 1, 'test');

      expect(ctx.replyWithMarkdownV2).toHaveBeenCalledWith(
        MESSAGES.CHOOSE_PLACEMENT_STYLE,
        telegrafUiServuce.patternTypeKeyboard,
      );
    });
  });

  // describe('onPhoto', () => {
  //   it('Should reply with BAD_REQUEST message if "photo" is not in message', async () => {
  //     const ctx = makeTelegrafMockContext({ message: {} });
  //     await service.onPhoto(ctx);
  //     expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
  //   });

  //   it('Should reply with BAD_REQUEST message if "photo" is empty', async () => {
  //     const ctx = makeTelegrafMockContext({ message: { photo: [] } });
  //     await service.onPhoto(ctx);
  //     expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
  //   });

  //   it('Should set file buffer with user id to cache manager', async () => {
  //     const ctxData = {
  //       message: {
  //         photo: [
  //           {
  //             file_id: String(Date.now()),
  //           },
  //         ],
  //         from: {
  //           id: Date.now(),
  //         },
  //       },
  //     };
  //     const ctx = makeTelegrafMockContext(ctxData);
  //     const buf = Buffer.alloc(10);
  //     buf.fill('A');

  //     service.getFile = () => Promise.resolve(buf.buffer);
  //     await service.onPhoto(ctx);

  //     const cacheVal = cacheManager.get(String(ctxData.message.from.id));
  //     expect(cacheVal).toBe(buf.buffer);
  //   });
  // });

  // it('Should reply with ASK_TEXT', async () => {
  //   const ctxData = {
  //     message: {
  //       photo: [
  //         {
  //           file_id: String(Date.now()),
  //         },
  //       ],
  //       from: {
  //         id: Date.now(),
  //       },
  //     },
  //   };
  //   const ctx = makeTelegrafMockContext(ctxData);
  //   const buf = Buffer.alloc(10);
  //   buf.fill('A');

  //   service.getFile = () => Promise.resolve(buf.buffer);
  //   await service.onPhoto(ctx);

  //   expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ASK_TEXT);
  // });

  // describe('getFile', () => {
  //   it('Should return ArrayBuffer', async () => {
  //     const arrayBuffer = new ArrayBuffer(10);
  //     httpService.get = () =>
  //       new Observable((sub) => {
  //         sub.next({ data: arrayBuffer } as AxiosResponse);
  //       });
  //     const result = await service.getFile('http://localhost');
  //     expect(result).toBe(arrayBuffer);
  //   });

  //   it('Should throw FILE_REQUEST_ERROR in case request was failed', async () => {
  //     try {
  //       httpService.get = () =>
  //         new Observable((sub) => {
  //           sub.error(SYS_MESSAGES.FILE_REQUEST_ERROR);
  //         });
  //       await service.getFile('http://localhost');
  //       expect(true).toBe(false);
  //     } catch (error) {
  //       expect(error.message).toBe(SYS_MESSAGES.FILE_REQUEST_ERROR);
  //     }
  //   });
  // });

  // describe('onSize', () => {
  //   it('Should reply with BAD_REQUEST if data is not in cb query', () => {
  //     const ctx = makeTelegrafMockContext({ callback_query: {} });
  //     service.onSize(ctx);
  //     expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
  //   });
  //   it('Should edit message with value given from sizeInlineKeyboard on ui service', () => {
  //     const ctx = makeTelegrafMockContext({ callback_query: { data: 'l' } });

  //     service.onSize(ctx);

  //     expect(ctx.editMessageText).toHaveBeenCalledWith(
  //       MESSAGES.CHANGE_SIZE,
  //       telegrafUiServuce.sizeInlineKeyboard,
  //     );
  //   });
  // });

  // describe('onSettings', () => {
  // it('Should edit message to a settings keyboard if "command" is not in ctx', () => {
  //   const ctx = makeTelegrafMockContext();

  //   service.onSettings(ctx);

  //   expect(ctx.editMessageText).toHaveBeenCalledWith(
  //     MESSAGES.CHANGE_SETTINGS,
  //     telegrafUiServuce.settingsInlineKeyboard,
  //   );
  // });

  // it('Should reply with mardown of settings keyboard if "command" is in ctx', () => {
  //   const ctx = makeTelegrafMockContext({ command: COMMANDS.SETTINGS });
  //   Object.assign(ctx, { command: COMMANDS.SETTINGS });

  //   ctx.replyWithMarkdownV2 = jest.fn();

  //   service.onSettings(ctx);

  //   expect(ctx.replyWithMarkdownV2).toHaveBeenCalledWith(
  //     MESSAGES.CHANGE_SETTINGS,
  //     telegrafUiServuce.settingsInlineKeyboard,
  //   );
  // });
  // });

  // describe('onChangeSizeSettings', () => {
  //   it('Should reply with BAD_REQUEST if data is not in cb query', () => {
  //     const ctx = makeTelegrafMockContext({ callback_query: {} });
  //     service.onSize(ctx);
  //     expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
  //   });

  //   // it('Should edit message with sizeInlineKeyboard of ui service', () => {
  //   //   const ctx = makeTelegrafMockContext({
  //   //     callback_query: { data: ACTIONS.SIZE },
  //   //   });

  //   //   service.onChangeSizeSettings(ctx);

  //   //   expect(ctx.editMessageText).toHaveBeenCalledWith(
  //   //     MESSAGES.CHANGE_SIZE,
  //   //     telegrafUiServuce.sizeInlineKeyboard,
  //   //   );
  //   // });
  // });

  // describe('onExitSettings', () => {
  //   it('Should edit message with UPDATE_SETTINGS message', () => {
  //     // const ctx = makeTelegrafMockContext();
  //     // service.onExitSettings(ctx);
  //     // expect(ctx.editMessageText).toHaveBeenCalledWith(
  //     //   MESSAGES.UPDATE_SETTINGS,
  //     // );
  //   });
  // });
});
