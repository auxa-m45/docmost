import { Logger, OnModuleDestroy } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AttachmentService } from '../services/attachment.service';
import { QueueJob, QueueName } from 'src/integrations/queue/constants';
import { Space } from '@docmost/db/types/entity.types';

@Processor(QueueName.ATTACHMENT_QUEUE)
export class AttachmentProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(AttachmentProcessor.name);
  constructor(private readonly attachmentService: AttachmentService) {
    super();
  }

  async process(job: Job<any, void>): Promise<void> {
    try {
      if (job.name === QueueJob.DELETE_SPACE_ATTACHMENTS) {
        await this.attachmentService.handleDeleteSpaceAttachments(job.data.id);
      } else if (job.name === QueueJob.PROCESS_AUDIO_FILE) {
        await this.attachmentService.processAudioFile(job.data.attachmentId);
      }
    } catch (err ) {
      if (err instanceof Error) {
        this.logger.error(`Error processing job ${job.name}: ${err.message}`, err.stack);
      }
      throw err;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Processing ${job.name} job`);
  }

  @OnWorkerEvent('failed')
  onError(job: Job) {
    this.logger.error(
      `Error processing ${job.name} job. Reason: ${job.failedReason}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Completed ${job.name} job`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
