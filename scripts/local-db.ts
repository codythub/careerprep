/**
 * Local PostgreSQL for development without Docker or a Postgres install.
 * Uses the `embedded-postgres` package (downloads official binaries).
 *
 *   npm run db:local     # keep running in its own terminal
 *
 * Connection string: postgresql://postgres:postgres@localhost:54329/careerprep
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".local-db", "data");
const port = Number(process.env.LOCAL_DB_PORT ?? 54329);

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: true,
    onLog: () => {},
  });
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase("careerprep");
  } catch {
    // already exists
  }
  console.log(`Postgres ready: postgresql://postgres:postgres@localhost:${port}/careerprep  (Ctrl+C to stop)`);
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
