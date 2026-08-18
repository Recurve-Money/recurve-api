# recurve-api

Indexer and read API for Recurve. Watches vault and governor events, writes
snapshots, and serves the history the dApp cannot get from chain reads alone.

## Why this exists

Everything the frontend shows live comes straight off chain. Everything with a
time axis cannot: there is no way to ask a node what a vault's TVL was last
Tuesday. Equity curves, 24h returns, drawdown, and a depositor's cost basis all
need something recording state as it happens.

## Stack

Node 20, TypeScript strict, Express, Postgres, viem. One process runs both the
API and the indexer.

## Endpoints

| Route | Returns |
|---|---|
| `GET /health` | Liveness plus a database ping |
| `GET /funds` | Every fund with its latest snapshot and 24h return |
| `GET /funds/:slug` | One fund |
| `GET /funds/:slug/history?range=24h\|7d\|30d\|all` | Bucketed equity curve |
| `GET /funds/:slug/proposals` | Proposal history for a fund |
| `GET /funds/:slug/flows` | Recent deposits, withdrawals, queue events |
| `GET /proposals` | Proposals across all funds |
| `GET /portfolio/:address` | Per-fund deposited, withdrawn, and net |

Amounts are strings holding full uint256 values. Do not parse them into JS
numbers; a token balance overflows a double well before it overflows the column.

## Configuration

```
DATABASE_URL       injected by Railway's Postgres plugin
RPC_URL            Robinhood Chain endpoint
CHAIN_ID           4663
REGISTRY_ADDRESS   watcher registry
DEPLOY_BLOCK       block the contracts went up
VAULTS             slug:vault:governor:name, comma separated
POLL_MS            block poll interval, default 12000
LOG_CHUNK          blocks per getLogs call, default 2000
```

Vaults come from an env string rather than a config file, so adding a fund is a
variable change instead of a redeploy.

## Deploying to Railway

1. New project, deploy from this repo
2. Add the Postgres plugin. `DATABASE_URL` is injected automatically
3. Set the variables above
4. Push. Railway rebuilds on every push to main

```powershell
cd "D:\1проекты\recurve-api"; git add -A; git commit -m "update"; git push
```

The schema is created on boot, so there is no migration step.

## How the indexer behaves

**Idempotent.** Flows are keyed on transaction hash and log index. A restart
that replays a chunk writes nothing new instead of doubling every deposit.

**Cursor after write.** The cursor advances only once a chunk is fully
persisted, so a crash mid-chunk replays rather than skips.

**Trails the head by two blocks.** A shallow reorg would otherwise get indexed
and then cursored past, leaving orphaned rows nothing will correct.

**Snapshots on a timer and after settlements.** The timer alone misses the jump
a settlement causes; settlements alone leave a flat line between them.

## Local development

```bash
npm install
cp .env.example .env    # point DATABASE_URL at a local postgres
npm run dev
```

With `VAULTS` empty the indexer idles and the API still serves, which is the
right state before anything is deployed.
