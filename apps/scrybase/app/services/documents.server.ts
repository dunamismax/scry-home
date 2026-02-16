import { sql } from "~/services/db.server";

export interface DocumentRecord {
  id: string;
  projectId: string;
  filename: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  status: "pending" | "processing" | "ready" | "error";
  createdAt: string;
}

export async function createDocument(input: {
  projectId: string;
  filename: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<DocumentRecord> {
  const [row] = await sql<DocumentRecord[]>`
    insert into document (
      project_id,
      filename,
      object_key,
      mime_type,
      size_bytes,
      status
    )
    values (
      ${input.projectId}::uuid,
      ${input.filename},
      ${input.objectKey},
      ${input.mimeType},
      ${input.sizeBytes},
      'pending'
    )
    returning
      id::text,
      project_id::text as "projectId",
      filename,
      object_key as "objectKey",
      mime_type as "mimeType",
      size_bytes as "sizeBytes",
      status,
      created_at::text as "createdAt"
  `;

  if (!row) {
    throw new Error("Document creation failed");
  }

  return row;
}
