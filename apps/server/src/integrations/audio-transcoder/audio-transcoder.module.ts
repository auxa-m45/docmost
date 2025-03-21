import { Module } from '@nestjs/common';
import { AudioTranscoderService } from './audio-transcoder.service';

@Module({
  providers: [AudioTranscoderService],
  exports: [AudioTranscoderService],
})
export class AudioTranscoderModule {}