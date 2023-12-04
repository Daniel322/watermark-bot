import { BOT_STATES } from './telegraf.constants';
import { BotStateMachine } from './telegraf.state-machine';

describe('BotStateMachine', () => {
  const fsm = new BotStateMachine(BOT_STATES.ADD_BG_PIC);

  describe('goto', () => {
    it('Should throw an error on try to transist to the wrong state', () => {
      const randomWrongState = BotStateMachine.transitions.find(
        (item) => item.from !== fsm.state,
      );
      expect(() => fsm.goto(randomWrongState.to)).toThrow();
    });

    it('Should not throw an error on transist to the right state', () => {
      const randomWrongState = BotStateMachine.transitions.find(
        (item) => item.from === fsm.state,
      );
      expect(() => fsm.goto(randomWrongState.to)).not.toThrow();
    });

    it('Should update updatedAt on successfull transist to given state', () => {
      fsm.updatedAt = 0;

      const randomWrongState = BotStateMachine.transitions.find(
        (item) => item.from === fsm.state,
      );

      fsm.goto(randomWrongState.to);

      expect(fsm.updatedAt).not.toBe(0);
    });
  });

  describe('update', () => {
    it('Should update passed fields', () => {
      const data = {
        file: Buffer.alloc(10).fill('A'),
        text: 'test',
      };

      fsm['_data'] = { ...data };

      fsm.update({ text: 'foo' });

      expect(fsm.data.file).toBe(data.file);
      expect(fsm.data.text).not.toBe(data.text);
    });

    it('Should update updatedAt on update fields', () => {
      fsm.updatedAt = 0;

      fsm.update({ text: 'test' });

      expect(fsm.updatedAt).not.toBe(0);
    });
  });
});
