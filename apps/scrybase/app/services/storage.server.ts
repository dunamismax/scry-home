import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "~/services/env.server";

const s3 = new S3Client({
  region: env.MINIO_REGION,
  endpoint: env.MINIO_ENDPOINT,
  forcePathStyle: env.MINIO_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
});

let bucketReady: Promise<void> | null = null;

export async function ensureStorageBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        await s3.send(
          new HeadBucketCommand({
            Bucket: env.MINIO_BUCKET,
          }),
        );
      } catch (error) {
        const shouldCreate =
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          ["NotFound", "NoSuchBucket", "Forbidden", "Unknown"].includes(String(error.name));

        if (!shouldCreate) {
          throw error;
        }

        await s3.send(
          new CreateBucketCommand({
            Bucket: env.MINIO_BUCKET,
          }),
        );
      }
    })();
  }

  await bucketReady;
}

export async function uploadDocumentObject(input: {
  userId: string;
  projectId: string;
  file: File;
}): Promise<{ objectKey: string; sizeBytes: number; mimeType: string }> {
  await ensureStorageBucket();

  const extension = input.file.name.includes(".")
    ? (input.file.name.split(".").pop()?.toLowerCase() ?? "bin")
    : "bin";

  const objectKey = `${input.userId}/${input.projectId}/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: objectKey,
      Body: bytes,
      ContentType: input.file.type || "application/octet-stream",
    }),
  );

  return {
    objectKey,
    sizeBytes: bytes.byteLength,
    mimeType: input.file.type || "application/octet-stream",
  };
}
