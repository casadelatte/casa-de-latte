import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import pg from "pg";
import { loadEnvLocal, getDatabaseUrl, projectRoot } from "./load-env.mjs";

loadEnvLocal();

const connectionString = getDatabaseUrl();
if (!connectionString) {
  console.error("Missing DATABASE_URL or SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const migrationsDir = resolve(projectRoot, "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  console.log("Connected to Postgres. Running migrations...\n");

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`→ ${file}`);
    try {
      await client.query(sql);
      console.log("  ✓ OK\n");
    } catch (err) {
      const msg = err?.message || String(err);
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate key") ||
        msg.includes("is already member of publication")
      ) {
        console.log(`  ⚠ Skipped (already applied): ${msg.split("\n")[0]}\n`);
      } else {
        console.error(`  ✗ Failed: ${msg}`);
        await client.end();
        process.exit(1);
      }
    }
  }

  await client.end();
  console.log("All migrations finished.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
