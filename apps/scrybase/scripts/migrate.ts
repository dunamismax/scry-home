import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "../app/services/db.server";

const migrationsDir = resolve(fileURLToPath(new URL("../migrations", import.meta.url)));

async function main() {
  await sql`
    create table if not exists schema_migration (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  const appliedRows = await sql<{ name: string }[]>`select name from schema_migration`;
  const applied = new Set(appliedRows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const fullPath = resolve(migrationsDir, file);
    const migrationSql = await readFile(fullPath, "utf8");

    console.log(`applying: ${file}`);

    await sql.begin(async (tx) => {
      await tx.unsafe(migrationSql);
      await tx.unsafe("insert into schema_migration (name) values ($1)", [file]);
    });
  }

  console.log("migrations complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
