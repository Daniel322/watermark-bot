import { Module } from '@nestjs/common';

import { WatermarkService } from './watermark.service';
import { WatermarkController } from './watermark.controller';

@Module({
  imports: [],
  controllers: [WatermarkController],
  providers: [WatermarkService],
  exports: [WatermarkService],
})
export class WatermarkModule {}
