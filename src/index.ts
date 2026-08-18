import {createApi} from "./api.js";
import {migrate, pool} from "./db.js";
import {run} from "./indexer.js";

const PORT = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Attach a Postgres plugin on Railway.");
  }

  await migrate();
  console.log("[boot] schema ready");

  const app = createApi();
  const server = app.listen(PORT, () => console.log(`[boot] api on :${PORT}`));

  // The indexer runs in the same process. One service is cheaper on Railway and
  // the loop is IO bound, so it does not starve the API. Split them if the log
  // scan ever gets heavy enough to add latency to requests.
  run().catch((e) => console.error("[indexer] fatal", e));

  const shutdown = async (signal: string) => {
    console.log(`[shutdown] ${signal}`);
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((e) => {
  console.error("[boot] failed:", e);
  process.exit(1);
});
