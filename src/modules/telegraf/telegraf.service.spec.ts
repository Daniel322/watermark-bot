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
} from '@modules/watermark/watermark.constants';

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
  ctx.replyWithMarkdownV2 = jest.fn();
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
  sizeKeyboard: ['1', '2'],
  positionKeyboard: ['1', '2'],
  opacityKeyboard: ['1', '2'],
  colorKeyboard: ['1', '2'],
});

const makeTelegrafUserStateServiceMock = () => ({
  hasState: jest.fn(),
  getState: jest.fn(),
  update: jest.fn(),
  getStateData: jest.fn(),
  goto: jest.fn(),
  remove: jest.fn(),
  add: jest.fn(),
});

const makeWatermarkServiceMock = () => ({
  createImageWithTextWatermark: jest.fn(({ file }) => {
    return file;
  }),
  createImageWithImageWatermark: jest.fn(({ watermark }) => {
    return watermark;
  }),
});

describe('TelegrafService', () => {
  let service: TelegrafService;

  const cacheManager = makeMockCacheManager();
  const telegraf = makeTelegrafMock();
  const httpService = makeHttpServiceMock();
  const telegrafUiServuce = makeTelefrafUiServiceMock();
  const telegrafUsersStatesService = makeTelegrafUserStateServiceMock();
  const watermarkService = makeWatermarkServiceMock();

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
          useValue: watermarkService,
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
      expect(telegraf.on).toHaveBeenCalledTimes(3);
      expect(telegraf.action).toHaveBeenCalledTimes(6);
    });
  });

  describe('onStart', () => {
    it('Should send welcome message', () => {
      const ctx = makeTelegrafMockContext();
      service.onStart(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.WELCOME);
    });
  });

  describe('onDocument', () => {
    it('Should reply with BAD_REQUEST message if "document" is not in message', async () => {
      const ctx = makeTelegrafMockContext({ message: {} });
      await service.onDocument(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should reply with ONLY_IMAGES_AVAILABILE if sent document is not an image', async () => {
      const ctx = makeTelegrafMockContext({
        message: {
          document: {
            mime_type: 'pdf',
          },
        },
      });
      await service.onDocument(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ONLY_IMAGES_AVAILABILE);
    });

    it('Should call processPhoto', async () => {
      const ctx = makeTelegrafMockContext({
        message: {
          document: { file_id: 1, mime_type: 'image/png' },
          from: { id: Date.now() },
        },
      });

      service.processPhoto = jest.fn();
      await service.onDocument(ctx);

      expect(service.processPhoto).toHaveBeenCalled();
    });
  });

  describe('onPhoto', () => {
    it('Should reply with BAD_REQUEST message if "photo" is not in message', async () => {
      const ctx = makeTelegrafMockContext({ message: {} });
      await service.onPhoto(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should reply with BAD_REQUEST message if "photo" array is empty', async () => {
      const ctx = makeTelegrafMockContext({ message: { photo: [] } });
      await service.onPhoto(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should call processPhoto', async () => {
      const ctx = makeTelegrafMockContext({
        message: { photo: [{ file_id: 1 }], from: { id: Date.now() } },
      });
      service.processPhoto = jest.fn();
      await service.onPhoto(ctx);

      expect(service.processPhoto).toHaveBeenCalled();
    });
  });

  describe('processPhoto', () => {
    it('Should call onBackgroundPhoto if user has no state', async () => {
      const ctx = makeTelegrafMockContext({
        message: { photo: [{ file_id: 1 }], from: { id: Date.now() } },
      });

      service.getFile = async () => Buffer.alloc(10).fill('A');

      service.onBackgroundPhoto = jest.fn(() => null);
      await service.onPhoto(ctx);

      expect(service.onBackgroundPhoto).toHaveBeenCalled();
    });

    it('Should call onBackgroundPhoto if user has state that is not equal to ADD_WATERMARK', async () => {
      const ctx = makeTelegrafMockContext({
        message: { photo: [{ file_id: 1 }], from: { id: Date.now() } },
      });

      telegrafUsersStatesService.hasState = jest.fn(() => true);
      telegrafUsersStatesService.getState = jest.fn(
        () => BOT_STATES.CHOOSE_OPACITY,
      );
      service.getFile = async () => Buffer.alloc(10).fill('A');

      service.onBackgroundPhoto = jest.fn(() => null);
      await service.onPhoto(ctx);

      expect(service.onBackgroundPhoto).toHaveBeenCalled();
    });

    it('Should call onWatermarkPhoto if user has state that is equal to ADD_WATERMARK', async () => {
      const ctx = makeTelegrafMockContext({
        message: { photo: [{ file_id: 1 }], from: { id: Date.now() } },
      });

      telegrafUsersStatesService.hasState = jest.fn(() => true);
      telegrafUsersStatesService.getState = jest.fn(
        () => BOT_STATES.ADD_WATERMARK,
      );
      service.getFile = async () => Buffer.alloc(10).fill('A');

      service.onWatermarkPhoto = jest.fn(() => null);
      await service.onPhoto(ctx);

      expect(service.onWatermarkPhoto).toHaveBeenCalled();
    });
  });

  describe('onBackgroundPhoto', () => {
    it('Should reply with ASK_WATERMARK', () => {
      const ctx = makeTelegrafMockContext();
      service.onBackgroundPhoto(ctx, 1, Buffer.from('test'));
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ASK_WATERMARK);
    });

    it('Should call update user state with given file', () => {
      const ctx = makeTelegrafMockContext();
      const file = Buffer.from('test');
      service.onBackgroundPhoto(ctx, 1, file);
      expect(telegrafUsersStatesService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ file }),
      );
    });
  });

  describe('onWatermarkPhoto', () => {
    it('Should return undefined if could not transist to the given state', () => {
      const ctx = makeTelegrafMockContext();
      service.tryTransistToGivenState = jest.fn(() => false);
      expect(
        service.onWatermarkPhoto(ctx, 1, Buffer.from('test')),
      ).toBeUndefined();
    });

    it('Should call update user state with given file', () => {
      const ctx = makeTelegrafMockContext();
      const watermarkFile = Buffer.from('test');
      service.tryTransistToGivenState = jest.fn(() => true);
      telegrafUsersStatesService.update = jest.fn();
      service.onWatermarkPhoto(ctx, 1, watermarkFile);
      expect(telegrafUsersStatesService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ watermarkFile }),
      );
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
      telegrafUsersStatesService.getState = jest.fn(
        () => BOT_STATES.ADD_WATERMARK,
      );
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

    it('Should reply with CHOOSE_PLACEMENT_STYLE if it transist to given state', () => {
      const ctx = makeTelegrafMockContext();
      service.tryTransistToGivenState = jest.fn(() => true);

      service.onWatermarkText(ctx, 1, 'test');

      expect(ctx.replyWithMarkdownV2).toHaveBeenCalledWith(
        MESSAGES.CHOOSE_PLACEMENT_STYLE,
        telegrafUiServuce.patternTypeKeyboard,
      );
    });
  });

  describe('onRotationText', () => {
    it('Should reply with ROTATION_PARSE_ERROR if given text is not a number', () => {
      const ctx = makeTelegrafMockContext();
      service.onRotationText(ctx, 1, 'test');
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ROTATION_PARSE_ERROR);
    });

    it('Should return undefined if could not transist to the given state', () => {
      const ctx = makeTelegrafMockContext();
      service.tryTransistToGivenState = jest.fn(() => false);
      expect(service.onRotationText(ctx, 1, '1')).toBeUndefined();
    });

    it('Should reply with CHOOSE_SIZE if it transist to given state', () => {
      const ctx = makeTelegrafMockContext();
      service.tryTransistToGivenState = jest.fn(() => true);

      service.onRotationText(ctx, 1, '1');

      expect(ctx.replyWithMarkdownV2).toHaveBeenCalledWith(
        MESSAGES.CHOOSE_SIZE,
        telegrafUiServuce.patternTypeKeyboard,
      );
    });
  });

  describe('onPlacementStyle', () => {
    it('Should reply with BAD_REQUEST message if "data" is not in callbackQuery', () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      service.onPlacementStyle(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should return undefined if could not transist to the given state', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => false);
      expect(service.onPlacementStyle(ctx)).toBeUndefined();
    });

    it('Should reply with CHOOSE_POSITION if it transist to given state', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: 'test', from: { id: Date.now() } },
      });
      service.tryTransistToGivenState = jest.fn(() => true);
      telegrafUsersStatesService.hasState = jest.fn(() => true);

      service.onPlacementStyle(ctx);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        MESSAGES.CHOOSE_POSITION,
        telegrafUiServuce.positionKeyboard,
      );
    });
  });

  describe('onPosition', () => {
    it('Should reply with BAD_REQUEST message if "data" is not in callbackQuery', () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      service.onPosition(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should return undefined if could not transist to the given state', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => false);
      expect(service.onPosition(ctx)).toBeUndefined();
    });

    it('Should reply with CHOOSE_SIZE if it transist to given state', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: 'test', from: { id: Date.now() } },
      });
      service.tryTransistToGivenState = jest.fn(() => true);
      telegrafUsersStatesService.hasState = jest.fn(() => true);

      service.onPosition(ctx);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        MESSAGES.CHOOSE_SIZE,
        telegrafUiServuce.sizeKeyboard,
      );
    });
  });

  describe('onSize', () => {
    it('Should reply with BAD_REQUEST message if "data" is not in callbackQuery', () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      service.onSize(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should return undefined if could not transist to the given state', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => false);
      expect(service.onSize(ctx)).toBeUndefined();
    });

    it('Should reply with CHOOSE_OPACITY if it transist to given state', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: 'test', from: { id: Date.now() } },
      });
      service.tryTransistToGivenState = jest.fn(() => true);
      telegrafUsersStatesService.hasState = jest.fn(() => true);

      service.onSize(ctx);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        MESSAGES.CHOOSE_OPACITY,
        telegrafUiServuce.opacityKeyboard,
      );
    });
  });

  describe('onOpacity', () => {
    it('Should reply with BAD_REQUEST message if "data" is not in callbackQuery', () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      service.onOpacity(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should return undefined if could not transist to the given state', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => false);
      expect(service.onOpacity(ctx)).toBeUndefined();
    });

    it('Should reply with CHOOSE_COLOR if it transist to given state and watemark file is null', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: 'test', from: { id: Date.now() } },
      });
      service.tryTransistToGivenState = jest.fn(() => true);
      telegrafUsersStatesService.hasState = jest.fn(() => true);
      telegrafUsersStatesService.getStateData = jest.fn(() => ({}));

      service.onOpacity(ctx);

      expect(ctx.editMessageText).toHaveBeenCalledWith(
        MESSAGES.CHOOSE_COLOR,
        telegrafUiServuce.colorKeyboard,
      );
    });

    it('Should call onColor if watermark file is not null', () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: 'test', from: { id: Date.now() } },
      });
      service.tryTransistToGivenState = jest.fn(() => true);
      telegrafUsersStatesService.hasState = jest.fn(() => true);
      telegrafUsersStatesService.getStateData = jest.fn(() => ({
        watermarkFile: Buffer.from('A'),
      }));

      jest.spyOn(service, 'onColor');

      service.onOpacity(ctx);

      expect(service.onColor).toHaveBeenCalledWith(ctx);
    });
  });

  describe('onColor', () => {
    it('Should reply with BAD_REQUEST message if "data" is not in callbackQuery', async () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      await service.onColor(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });

    it('Should return undefined if could not transist to the given state', async () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => false);

      const result = await service.onColor(ctx);
      expect(result).toBeUndefined();
    });

    it('Should reply with photo and COMPLETE message', async () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => true);

      const buf = Buffer.alloc(10);
      buf.fill('A');

      telegrafUsersStatesService.getStateData = jest.fn(() => ({
        file: buf,
      }));

      await service.onColor(ctx);

      expect(ctx.editMessageText).toHaveBeenCalledWith(MESSAGES.COMPLETE);
      expect(ctx.replyWithPhoto).toHaveBeenCalledWith(
        expect.objectContaining({ source: buf }),
      );
    });

    it('Should call createImageWithImageWatermark if watermark file was given', async () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => true);

      telegrafUsersStatesService.getStateData = jest.fn(() => ({
        file: Buffer.from('test'),
        watermarkFile: Buffer.from('test'),
      }));

      watermarkService.createImageWithImageWatermark.mockClear();

      await service.onColor(ctx);

      expect(watermarkService.createImageWithImageWatermark).toHaveBeenCalled();
    });

    it('Should call createImageWithTextWatermark if watermark text was given', async () => {
      const ctx = makeTelegrafMockContext({
        callback_query: { data: '1', from: { id: Date.now() } },
      });
      telegrafUsersStatesService.hasState = jest.fn(() => true);

      telegrafUsersStatesService.getStateData = jest.fn(() => ({
        file: Buffer.from('test'),
        watermarkFile: null,
      }));

      watermarkService.createImageWithTextWatermark.mockClear();

      await service.onColor(ctx);

      expect(watermarkService.createImageWithTextWatermark).toHaveBeenCalled();
    });
  });

  describe('onHelp', () => {
    it('Should reply with HELP message', () => {
      const ctx = makeTelegrafMockContext();
      service.onHelp(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.HELP);
    });
  });

  describe('getFile', () => {
    it('Should return ArrayBuffer', async () => {
      const arrayBuffer = new ArrayBuffer(10);
      httpService.get = () =>
        new Observable((sub) => {
          sub.next({ data: arrayBuffer } as AxiosResponse);
        });
      const result = await service.getFile('http://localhost');
      expect(result).toBe(arrayBuffer);
    });

    it('Should throw FILE_REQUEST_ERROR in case request was failed', async () => {
      try {
        httpService.get = () =>
          new Observable((sub) => {
            sub.error(SYS_MESSAGES.FILE_REQUEST_ERROR);
          });
        await service.getFile('http://localhost');
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe(SYS_MESSAGES.FILE_REQUEST_ERROR);
      }
    });
  });

  describe('tryTransistToGivenState', () => {
    it('Should return fase if transition was not sucessfull', () => {
      const ctx = makeTelegrafMockContext();
      telegrafUsersStatesService.goto = jest.fn(() => false);

      expect(
        service.tryTransistToGivenState(ctx, 1, BOT_STATES.ADD_WATERMARK),
      ).toBeFalsy();
    });

    it('Should return true if transition was sucessfull', () => {
      const ctx = makeTelegrafMockContext();
      telegrafUsersStatesService.goto = jest.fn(() => true);

      expect(
        service.tryTransistToGivenState(ctx, 1, BOT_STATES.ADD_WATERMARK),
      ).toBeTruthy();
    });

    it('Should reply with CONTINUE_FROM_STATE message if transition was not succesfull and callback_query is null', () => {
      const ctx = makeTelegrafMockContext();
      telegrafUsersStatesService.goto = jest.fn(() => false);
      telegrafUsersStatesService.getState = jest.fn(
        () => BOT_STATES.ADD_BG_PIC,
      );
      service.tryTransistToGivenState(ctx, 1, BOT_STATES.ADD_WATERMARK);
      expect(ctx.reply).toHaveBeenCalledWith(
        MESSAGES.CONTINUE_FROM_STATE(BOT_STATES.ADD_BG_PIC),
      );
    });

    it('Should editMessageText with CONTINUE_FROM_STATE message if transition was not succesfull and callback_query is not null', () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      telegrafUsersStatesService.goto = jest.fn(() => false);
      telegrafUsersStatesService.getState = jest.fn(
        () => BOT_STATES.ADD_BG_PIC,
      );
      service.tryTransistToGivenState(ctx, 1, BOT_STATES.ADD_WATERMARK);
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        MESSAGES.CONTINUE_FROM_STATE(BOT_STATES.ADD_BG_PIC),
      );
    });
  });

  describe('stateNotFoundReply', () => {
    it('Should editMessageText with USER_STATE_NOT_FOUND message if callback_query is not null', () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      service.stateNotFoundReply(ctx);
      expect(ctx.editMessageText).toHaveBeenCalledWith(
        MESSAGES.USER_STATE_NOT_FOUND,
      );
    });

    it('Should reply with USER_STATE_NOT_FOUND message if callback_query is null', () => {
      const ctx = makeTelegrafMockContext();
      service.stateNotFoundReply(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.USER_STATE_NOT_FOUND);
    });
  });

  describe('onSkip', () => {
    it('Should reply with BAD_REQUEST message if "data" is not in callbackQuery', () => {
      const ctx = makeTelegrafMockContext({ callback_query: {} });
      service.onSkip(ctx);
      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.BAD_REQUEST);
    });
  });
});
