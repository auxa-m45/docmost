import { Module } from '@nestjs/common';
import { AttachmentService } from './services/attachment.service';
import { AttachmentController } from './attachment.controller';
import { StorageModule } from '../../integrations/storage/storage.module';
import { UserModule } from '../user/user.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AttachmentProcessor } from './processors/attachment.processor';
import { AudioTranscoderModule } from '../../integrations/audio-transcoder/audio-transcoder.module';

@Module({
  imports: [
    StorageModule, 
    UserModule, 
    WorkspaceModule,
    AudioTranscoderModule
  ],
  controllers: [AttachmentController],
  providers: [AttachmentService, AttachmentProcessor],
})
export class AttachmentModule {}
