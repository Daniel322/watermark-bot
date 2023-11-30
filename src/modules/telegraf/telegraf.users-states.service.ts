import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BotStateMachine } from './telegraf.state-machine';
import { BOT_STATES, SYS_MESSAGES } from './telegraf.constants';
import { BotStates, SelectedOptions } from './telegraf.types';

@Injectable()
export class TelegrafUsersStatesService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly GC_TIMER: number;

  private readonly FMS_INACTIVE_TIME: number;

  private readonly logger = new Logger(TelegrafUsersStatesService.name);

  private _fsms = new Map<number, BotStateMachine>();

  private _intervalId: number;

  constructor(private readonly configService: ConfigService) {
    const { gcTimer, fmsInactiveTime } =
      this.configService.get('userStateManager');
    this.GC_TIMER = gcTimer;
    this.FMS_INACTIVE_TIME = fmsInactiveTime;
  }

  onModuleInit(): void {
    setInterval(this.gc.bind(this), this.GC_TIMER);
  }

  onModuleDestroy(): void {
    clearInterval(this._intervalId);
  }

  private gc(): void {
    const now = Date.now();
    for (const [id, fms] of this._fsms) {
      if (now - fms.updatedAt >= this.FMS_INACTIVE_TIME) {
        this.remove(id);
      }
    }
  }

  add(id: number): void {
    const fsm = new BotStateMachine(BOT_STATES.ADD_BG_PIC);
    this._fsms.set(id, fsm);
  }

  remove(id: number): void {
    this._fsms.delete(id);
  }

  goto(id: number, to: BotStates): boolean {
    try {
      const fsm = this._fsms.get(id);
      if (fsm == null) throw new Error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
      fsm.goto(to);
      return true;
    } catch (error) {
      this.logger.error(error.message);
      return false;
    }
  }

  hasState(id: number): boolean {
    return this._fsms.has(id);
  }

  update(
    id: number,
    data: Partial<SelectedOptions>,
  ): ReturnType<BotStateMachine['update']> {
    const fsm = this._fsms.get(id);
    if (fsm == null) throw new Error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
    return fsm.update(data);
  }

  getStateData(id: number): BotStateMachine['data'] {
    const fsm = this._fsms.get(id);
    if (fsm == null) throw new Error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
    return fsm.data;
  }

  getState(id: number): BotStateMachine['state'] {
    const fsm = this._fsms.get(id);
    if (fsm == null) throw new Error(SYS_MESSAGES.USER_STATE_NOT_FOUND);
    return fsm.state;
  }
}
