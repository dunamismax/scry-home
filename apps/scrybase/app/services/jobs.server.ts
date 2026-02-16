import PgBoss from "pg-boss";
import { env } from "~/services/env.server";

let bossPromise: Promise<PgBoss> | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (!bossPromise) {
    const boss = new PgBoss({
      connectionString: env.DATABASE_URL,
      schema: env.PG_BOSS_SCHEMA,
      migrate: true,
    });

    bossPromise = (async () => {
      await boss.start();
      return boss;
    })();
  }

  return bossPromise;
}

export async function enqueueProjectCreated(input: { projectId: string; userId: string }) {
  const boss = await getBoss();
  return boss.send("project.created", input);
}

export async function enqueueDocumentProcessing(input: {
  documentId: string;
  projectId: string;
  objectKey: string;
}) {
  const boss = await getBoss();
  return boss.send("document.process", input);
}
