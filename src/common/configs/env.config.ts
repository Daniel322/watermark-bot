import * as Joi from '@hapi/joi';
import { registerAs } from '@nestjs/config';

const env = registerAs('env', () => ({
  type: process.env.NODE_ENV,
}));

const telegramApi = registerAs('telegram', () => ({
  token: process.env.TELEGRAM_BOT_TOKEN,
}));

const userStateManager = registerAs('userStateManager', () => ({
  gcTimer: Number(process.env.USER_STATE_MANAGER_GC_TIMER ?? 1000 * 60),
  fmsInactiveTime: Number(
    process.env.USER_STATE_MANAGER_FMS_INACTIVE_TIME ?? 1000 * 60 * 10,
  ),
}));

export const EnvConfig = {
  envFilePath: `.env.${process.env.NODE_ENV}`,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .required(),
    TELEGRAM_BOT_TOKEN: Joi.string().optional(),
    USER_STATE_MANAGER_GC_TIMER: Joi.number().optional(),
    USER_STATE_MANAGER_FMS_INACTIVE_TIME: Joi.number().optional(),
  }),
  load: [env, telegramApi, userStateManager],
  isGlobal: true,
};
