import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { TelegrafLogOptions } from './telegraf-logs.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegrafLogsService {
  private readonly defaultFileName: string;
  private readonly nodeEnv: string;
  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.get('env.type');
    this.defaultFileName = 'log.txt';
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
      }: ${username}, ${first_name} ${last_name}, ${id} with action: ${action}, on date: ${new Date().toISOString()}`;

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
      const stream = createWriteStream(fileName, { flags: 'a' });

      stream.write(`${text}\n`);

      stream.end();
    } catch (error) {
      throw new Error(error);
    }
  }
}
