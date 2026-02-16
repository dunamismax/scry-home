import { sql } from "~/services/db.server";

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
}

export async function listProjectsByUser(userId: string): Promise<ProjectRecord[]> {
  return sql<ProjectRecord[]>`
    select
      id::text,
      name,
      description,
      user_id as "userId",
      created_at::text as "createdAt"
    from project
    where user_id = ${userId}
    order by created_at desc
    limit 25
  `;
}

export async function createProject(input: {
  userId: string;
  name: string;
  description?: string | null;
}): Promise<ProjectRecord> {
  const [row] = await sql<ProjectRecord[]>`
    insert into project (name, description, user_id)
    values (${input.name}, ${input.description ?? null}, ${input.userId})
    returning
      id::text,
      name,
      description,
      user_id as "userId",
      created_at::text as "createdAt"
  `;

  if (!row) {
    throw new Error("Project creation failed");
  }

  return row;
}
