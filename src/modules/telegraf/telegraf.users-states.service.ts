import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { BotStateMachine } from './telegraf.state-machine';
import { BOT_STATES, SYS_MESSAGES } from './telegraf.constants';
import { BotStates, SelectedOptions } from './telegraf.types';

@Injectable()
export class TelegrafUsersStatesService
  implements OnModuleInit, OnModuleDestroy
{
  static GC_TIMER = 1000 * 60; // 1 min

  static FMS_INACTIVE_TIME = 1000 * 60; // 10 min

  private readonly logger = new Logger(TelegrafUsersStatesService.name);

  private _fsms = new Map<number, BotStateMachine>();

  private _intervalId: number;

  constructor() {}

  onModuleInit(): void {
    setInterval(this.gc.bind(this), TelegrafUsersStatesService.GC_TIMER);
  }

  onModuleDestroy(): void {
    clearInterval(this._intervalId);
  }

  private gc(): void {
    const now = Date.now();
    for (const [id, fms] of this._fsms) {
      if (now - fms.updatedAt >= TelegrafUsersStatesService.GC_TIMER) {
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
