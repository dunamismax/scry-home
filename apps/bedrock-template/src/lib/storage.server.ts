import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { db } from "~/lib/db.server";
import { env } from "~/lib/env.server";

const s3 = new S3Client({
  endpoint: env.MINIO_ENDPOINT,
  region: env.MINIO_REGION,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export type StoredAsset = {
  id: string;
  ownerUserId: string;
  objectKey: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

function safeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function uploadAsset(params: {
  ownerUserId: string;
  file: File;
}): Promise<StoredAsset> {
  const { ownerUserId, file } = params;
  const extSafeName = safeFileName(file.name || "upload.bin");
  const key = `${ownerUserId}/${randomUUID()}-${extSafeName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key,
      Body: file,
      ContentType: file.type || "application/octet-stream",
      ContentLength: file.size,
    }),
  );

  const [asset] = await db<StoredAsset[]>`
    insert into "asset" (
      "ownerUserId",
      "bucket",
      "objectKey",
      "originalFileName",
      "contentType",
      "sizeBytes"
    )
    values (
      ${ownerUserId},
      ${env.MINIO_BUCKET},
      ${key},
      ${file.name || "upload.bin"},
      ${file.type || "application/octet-stream"},
      ${file.size}
    )
    returning
      id,
      "ownerUserId",
      "objectKey",
      "originalFileName",
      "contentType",
      "sizeBytes",
      "createdAt"
  `;

  return asset;
}

export async function listAssetsByUser(userId: string, limit = 20) {
  return db<StoredAsset[]>`
    select
      id,
      "ownerUserId",
      "objectKey",
      "originalFileName",
      "contentType",
      "sizeBytes",
      "createdAt"
    from "asset"
    where "ownerUserId" = ${userId}
    order by "createdAt" desc
    limit ${limit}
  `;
}

export async function countAssetsByUser(userId: string): Promise<number> {
  const [row] = await db<{ count: string }[]>`
    select count(*)::text as count
    from "asset"
    where "ownerUserId" = ${userId}
  `;
  return Number(row?.count ?? 0);
}
