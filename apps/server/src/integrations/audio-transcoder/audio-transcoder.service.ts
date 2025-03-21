import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

@Injectable()
export class AudioTranscoderService {
  private readonly logger = new Logger(AudioTranscoderService.name);
  private readonly lambdaClient: LambdaClient;
  private readonly lambdaFunctionName: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.lambdaClient = new LambdaClient({
      region: this.configService.get<string>('AWS_LAMBDA_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_LAMBDA_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_LAMBDA_SECRET_ACCESS_KEY',
        ),
      },
    });
    this.lambdaFunctionName = this.configService.get<string>(
      'MUSIC_PREVIEW_TRANSCODER_NAME',
    );
  }

  async convertAudio(
    inputKey: string,
    outputKey: string,
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      if (!this.lambdaFunctionName) {
        this.logger.warn(
          'MUSIC_PREVIEW_TRANSCODER_NAME not configured, skipping transcoding',
        );
        return { success: false, error: 'Transcoder service not configured' };
      }
      const payload = {
        input_key: inputKey,
        output_key: outputKey,
        sample_rate: '44100',
        bit_rate: '128k',
        channels: '2',
      };
      const command = new InvokeCommand({
        FunctionName: this.lambdaFunctionName,
        Payload: JSON.stringify(payload),
        InvocationType: 'RequestResponse',
      });
      const { Payload, StatusCode } = await this.lambdaClient.send(command);
      if (StatusCode !== 200 || !Payload) {
        this.logger.error(`Audio conversion failed with status: ${StatusCode}`);
        return {
          success: false,
          error: 'Lambda invocation failed',
        };
      }

      const responseText = new TextDecoder().decode(Payload);
      const responseData = JSON.parse(JSON.parse(responseText).body);

      if (!responseData.success) {
        this.logger.error(
          'Audio conversion failed: Lambda returned error',
          responseData.message,
        );
        return {
          success: false,
          error: responseData.message || 'Unknown error',
        };
      }

      this.logger.log(`Audio conversion success: ${inputKey} -> ${outputKey}`);
      return {
        success: true,
        output: outputKey,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Audio conversion failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }

      this.logger.error('Audio conversion failed with unknown error');
      throw new Error('Unknown error during audio conversion');
    }
  }
}
