import { BOT_STATES } from './telegraf.constants';
import { BotStates, SelectedOptions } from './telegraf.types';

export class BotStateMachine {
  static transitions = [
    { from: BOT_STATES.ADD_BG_PIC, to: BOT_STATES.ADD_TEXT },
    { from: BOT_STATES.ADD_BG_PIC, to: BOT_STATES.ADD_PIC },
    { from: BOT_STATES.ADD_TEXT, to: BOT_STATES.CHOOSE_WM_TYPE },
    { from: BOT_STATES.ADD_PIC, to: BOT_STATES.CHOOSE_WM_TYPE },
    { from: BOT_STATES.CHOOSE_WM_TYPE, to: BOT_STATES.CHOOSE_POSITION },
    { from: BOT_STATES.CHOOSE_POSITION, to: BOT_STATES.CHOOSE_ROTATION },
    { from: BOT_STATES.CHOOSE_ROTATION, to: BOT_STATES.CHOOSE_SIZE },
    { from: BOT_STATES.CHOOSE_SIZE, to: BOT_STATES.CHOOSE_OPACITY },
    { from: BOT_STATES.CHOOSE_OPACITY, to: BOT_STATES.CHOOSE_COLOR },
  ];

  private _state: BotStates;

  private _data: SelectedOptions;

  createdAt: number;
  updatedAt: number;

  constructor(init: BotStates) {
    this._state = init;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this._data = {
      file: null,
      text: '',
    };
  }

  get state(): BotStates {
    return this._state;
  }

  get data(): SelectedOptions {
    return this._data;
  }

  goto(to: BotStates) {
    const transition = BotStateMachine.transitions.filter(
      (item) => item.to === to,
    );
    const isAvailable = transition.some((item) => item.from === this.state);
    if (!isAvailable) {
      throw new Error(`Cannot transist to ${to} from ${this.state}`);
    }

    this._state = to;
    this.updatedAt = Date.now();
  }

  update(data: Partial<SelectedOptions>): void {
    for (const key in data) {
      this._data[key] = data[key];
    }

    this.updatedAt = Date.now();
  }
}
