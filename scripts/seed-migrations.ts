/**
 * One-time script: seeds the Drizzle migration tracking table for DBs that were
 * bootstrapped via `db:push` (no migration history tracked).
 *
 * Run: npx tsx scripts/seed-migrations.ts
 * Requires DATABASE_URL in env.
 */
import "dotenv/config";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function hashMigration(tag: string): Promise<string> {
  const content = readFileSync(`./drizzle/${tag}.sql`).toString();
  return createHash("sha256").update(content).digest("hex");
}

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;

  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const rows = await sql`SELECT id FROM drizzle.__drizzle_migrations`;
  if (rows.length > 0) {
    console.log("Migration tracking table already has entries, skipping seed.");
    return;
  }

  // Mark both migrations as applied (the DB was bootstrapped via db:push).
  // folderMillis values come from drizzle/meta/_journal.json "when" fields.
  const migrations = [
    { tag: "0000_sad_yellow_claw", when: 1772640180011 },
    { tag: "0001_shocking_princess_powerful", when: 1778089507812 },
  ];

  for (const m of migrations) {
    const hash = await hashMigration(m.tag);
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${m.when})
    `;
    console.log(`Marked ${m.tag} as applied (created_at=${m.when})`);
  }

  console.log("\nDone. pnpm db:migrate will now only apply future migrations.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
