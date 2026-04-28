import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { R2StoragePort, TOKENS } from "../../application/ports/ports";
import { ERROR_MESSAGES } from "../../../common/constants/error-messages.constants";

@Injectable()
export class R2StorageService implements R2StoragePort {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly signedTtl: number;
  private readonly accountId: string;

  constructor(private readonly config: ConfigService) {
    const r2 = this.config.get<{
      accountId: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
      publicBaseUrl: string;
      signedTtl: number;
    }>("r2");
    this.accountId = r2?.accountId ?? "";
    this.bucket = r2?.bucket ?? "";
    const key = r2?.accessKeyId ?? "";
    const secret = r2?.secretAccessKey ?? "";
    this.publicBaseUrl = (r2?.publicBaseUrl ?? "").replace(/\/$/, "");
    this.signedTtl = r2?.signedTtl ?? 3600;

    if (this.accountId && key && secret && this.bucket) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: key, secretAccessKey: secret },
      });
    } else {
      this.client = null;
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  buildKey(ticketId: string, fileName: string) {
    const safe = (fileName || "file").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 200);
    return `tickets/${ticketId}/${randomUUID()}-${safe}`;
  }

  async putObject(key: string, body: Buffer, contentType: string) {
    if (!this.client) {
      throw new Error(ERROR_MESSAGES.STORAGE.R2_NOT_CONFIGURED);
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  getPublicObjectUrlIfConfigured(key: string): string | null {
    if (!this.publicBaseUrl) return null;
    return `${this.publicBaseUrl}/${key.replace(/^\//, "")}`;
  }

  async getPresignedGetUrl(key: string, expiresSeconds: number) {
    if (!this.client) {
      throw new Error(ERROR_MESSAGES.STORAGE.R2_NOT_CONFIGURED);
    }
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresSeconds || this.signedTtl });
  }
}

export const R2_STORAGE_PROVIDER = { provide: TOKENS.R2_STORAGE, useExisting: R2StorageService };
