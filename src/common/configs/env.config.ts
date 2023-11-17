import * as Joi from '@hapi/joi';
import { registerAs } from '@nestjs/config';

const env = registerAs('env', () => ({
  type: process.env.NODE_ENV,
}));

const telegramApi = registerAs('telegram', () => ({
  token: process.env.TELEGRAM_BOT_TOKEN,
}));

const cacheManager = registerAs('cache', () => ({
  fileBufTtl: Number(process.env.FILE_BUF_TTL ?? 500),
}));

export const EnvConfig = {
  envFilePath: `.env.${process.env.NODE_ENV}`,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .required(),
    TELEGRAM_BOT_TOKEN: Joi.string().optional(),
    FILE_BUF_TTL: Joi.number().optional(),
  }),
  load: [env, telegramApi, cacheManager],
  isGlobal: true,
};
