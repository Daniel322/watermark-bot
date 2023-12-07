import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { TelegrafUsersStatesService } from './telegraf.users-states.service';
import { BOT_STATES } from './telegraf.constants';
import { BotStateMachine } from './telegraf.state-machine';

const configMock = () => ({
  userStateManager: {
    gcTimer: 10,
    fmsInactiveTime: 10,
  },
});

describe('TelegrafUsersStatesService', () => {
  let service: TelegrafUsersStatesService;

  jest.useFakeTimers();
  jest.spyOn(global, 'setInterval');
  jest.spyOn(global, 'clearInterval');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configMock],
        }),
      ],
      providers: [TelegrafUsersStatesService],
    }).compile();

    service = module.get<TelegrafUsersStatesService>(
      TelegrafUsersStatesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('Should set interval', () => {
      const {
        userStateManager: { gcTimer },
      } = configMock();
      service.onModuleInit();
      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenLastCalledWith(
        expect.any(Function),
        gcTimer,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('Should remove interval', () => {
      service.onModuleDestroy();
      expect(clearInterval).toHaveBeenCalledTimes(1);
    });
  });

  describe('add', () => {
    it('Should add user instance of BotStateMachine', () => {
      service.add(1);
      expect(service['_fsms'].has(1)).toBeTruthy();
      expect(service['_fsms'].get(1) instanceof BotStateMachine).toBeTruthy();
    });
  });

  describe('gc', () => {
    it('Should remove all expired users', () => {
      const fsmsMock = new Map();
      service['_fsms'] = fsmsMock;

      fsmsMock.set(1, {
        updatedAt: Date.now() - service['FMS_INACTIVE_TIME'] * 2,
      });

      fsmsMock.set(2, {
        updatedAt: Date.now() - service['FMS_INACTIVE_TIME'] * 2,
      });

      fsmsMock.set(3, {
        updatedAt: Date.now() + service['FMS_INACTIVE_TIME'] * 2,
      });

      service['gc']();

      expect(fsmsMock.has(1)).toBeFalsy();
      expect(fsmsMock.has(2)).toBeFalsy();
      expect(fsmsMock.has(3)).toBeTruthy();
    });
  });

  describe('goto', () => {
    it('Should return false if user state was not found', () => {
      expect(service.goto(1, BOT_STATES.ADD_WATERMARK)).toBeFalsy();
    });

    it('Should return true if it transisted to the state', () => {
      const fsmsMock = new Map();
      service['_fsms'] = fsmsMock;

      fsmsMock.set(1, { goto: () => null });

      expect(service.goto(1, BOT_STATES.ADD_WATERMARK)).toBeTruthy();
    });

    it('Should return false if fms.goto rise an error', () => {
      const fsmsMock = new Map();
      service['_fsms'] = fsmsMock;

      fsmsMock.set(1, {
        goto: () => {
          throw new Error();
        },
      });

      expect(service.goto(1, BOT_STATES.ADD_WATERMARK)).toBeFalsy();
    });
  });
});
