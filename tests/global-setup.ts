/**
 * Starts a throwaway PostgreSQL (embedded-postgres) and applies the real Prisma
 * migrations, so tests exercise the same schema, constraints and indexes as production.
 */
import { execSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const PORT = 54330;
const URL = `postgresql://postgres:postgres@localhost:${PORT}/careerprep_test`;

export default async function setup() {
  const root = path.join(process.cwd(), ".test-db");
  // Best-effort cleanup of earlier runs; a unique dir per run avoids clashes with leftovers.
  try {
    for (const d of readdirSync(root)) rmSync(path.join(root, d), { recursive: true, force: true });
  } catch {
    // nothing to clean
  }
  const dir = path.join(root, `run-${Date.now()}`);
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: "postgres",
    password: "postgres",
    port: PORT,
    persistent: false,
    // Synchronous I/O: no separate io_worker processes that can outlive the server on Windows.
    postgresFlags: ["-c", "io_method=sync", "-c", "fsync=off"],
    onLog: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("careerprep_test");
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: URL, DIRECT_URL: URL },
  });
  return async () => {
    await pg.stop();
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows may hold file locks briefly; cleaned up on the next run.
    }
  };
}
