import { Injectable, Logger } from '@nestjs/common';
import { appendFile } from 'fs';
import { TelegrafLogOptions } from './telegraf-logs.types';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'fs/promises';

@Injectable()
export class TelegrafLogsService {
  private logger = new Logger(TelegrafLogsService.name);
  private readonly defaultFileName: string;
  private readonly nodeEnv: string;
  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.get('env.type');
    this.defaultFileName = 'logs/log.csv';
  }

  async writeTelegrafLog({
    id,
    is_bot,
    first_name = '',
    last_name = '',
    username = '',
    action,
  }: TelegrafLogOptions): Promise<void> {
    try {
      const text = `${
        is_bot ? 'bot' : 'user'
      },${username}, ${first_name}, ${last_name}, ${id}, ${action}, ${new Date().toISOString()}`;

      if (this.nodeEnv === 'production') {
        await this.writeLog(text);
      }

      return;
    } catch (error) {
      throw new Error(error);
    }
  }

  private async writeLog(
    text: string,
    fileName: string = this.defaultFileName,
  ): Promise<void> {
    try {
      await mkdir('logs', { recursive: true });
      appendFile(fileName, `${text}\n`, 'utf-8', (err) => {
        if (err) throw err;
        this.logger.log('log was written success');
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}
