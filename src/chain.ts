import {createPublicClient, defineChain, http} from "viem";

export const chain = defineChain({
  id: Number(process.env.CHAIN_ID ?? 4663),
  name: "Robinhood Chain",
  nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
  rpcUrls: {
    default: {http: [process.env.RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com"]},
  },
});

export const client = createPublicClient({chain, transport: http()});

export interface FundConfig {
  slug: string;
  vault: `0x${string}`;
  governor: `0x${string}`;
  name: string;
}

/**
 * Vaults come from an env string rather than a config file so a redeploy is not
 * needed to add a fund. Format: slug:vault:governor:name, comma separated.
 */
export function parseVaults(raw = process.env.VAULTS ?? ""): FundConfig[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [slug, vault, governor, ...rest] = entry.split(":");
      if (!slug || !vault || !governor) {
        throw new Error(`VAULTS entry is malformed: ${entry}`);
      }
      return {
        slug,
        vault: vault as `0x${string}`,
        governor: governor as `0x${string}`,
        name: rest.join(":") || slug,
      };
    });
}

export const DEPLOY_BLOCK = BigInt(process.env.DEPLOY_BLOCK ?? "0");
export const LOG_CHUNK = BigInt(process.env.LOG_CHUNK ?? "2000");
export const POLL_MS = Number(process.env.POLL_MS ?? 12_000);
export const REGISTRY = (process.env.REGISTRY_ADDRESS ?? "") as `0x${string}`;

export const vaultAbi = [
  {type: "function", name: "asset", inputs: [], outputs: [{type: "address"}], stateMutability: "view"},
  {type: "function", name: "totalAssets", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {type: "function", name: "float", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {type: "function", name: "deployedAssets", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {type: "function", name: "totalSupply", inputs: [], outputs: [{type: "uint256"}], stateMutability: "view"},
  {
    type: "function",
    name: "convertToAssets",
    inputs: [{name: "shares", type: "uint256"}],
    outputs: [{type: "uint256"}],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      {name: "sender", type: "address", indexed: true},
      {name: "owner", type: "address", indexed: true},
      {name: "assets", type: "uint256", indexed: false},
      {name: "shares", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "Withdraw",
    inputs: [
      {name: "sender", type: "address", indexed: true},
      {name: "receiver", type: "address", indexed: true},
      {name: "owner", type: "address", indexed: true},
      {name: "assets", type: "uint256", indexed: false},
      {name: "shares", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "WithdrawalQueued",
    inputs: [
      {name: "owner", type: "address", indexed: true},
      {name: "requestId", type: "uint256", indexed: true},
      {name: "shares", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "WithdrawalClaimed",
    inputs: [
      {name: "owner", type: "address", indexed: true},
      {name: "requestId", type: "uint256", indexed: true},
      {name: "assets", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "StrategySettled",
    inputs: [
      {name: "assetsReturned", type: "uint256", indexed: false},
      {name: "pnl", type: "int256", indexed: false},
    ],
  },
] as const;

export const governorAbi = [
  {
    type: "function",
    name: "proposals",
    inputs: [{type: "bytes32"}],
    outputs: [
      {name: "target", type: "address"},
      {name: "assets", type: "uint256"},
      {name: "callData", type: "bytes"},
      {name: "postedAt", type: "uint256"},
      {name: "snapshot", type: "uint256"},
      {name: "vetoWeight", type: "uint256"},
      {name: "state", type: "uint8"},
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ProposalPosted",
    inputs: [
      {name: "proposalId", type: "bytes32", indexed: true},
      {name: "target", type: "address", indexed: true},
      {name: "assets", type: "uint256", indexed: false},
      {name: "executableAt", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "ProposalVetoed",
    inputs: [
      {name: "proposalId", type: "bytes32", indexed: true},
      {name: "vetoWeight", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "ProposalBlocked",
    inputs: [
      {name: "proposalId", type: "bytes32", indexed: true},
      {name: "blocks_", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [
      {name: "proposalId", type: "bytes32", indexed: true},
      {name: "target", type: "address", indexed: true},
      {name: "assets", type: "uint256", indexed: false},
    ],
  },
  {
    type: "event",
    name: "ProposalSettled",
    inputs: [
      {name: "proposalId", type: "bytes32", indexed: true},
      {name: "returned", type: "uint256", indexed: false},
      {name: "fee", type: "uint256", indexed: false},
    ],
  },
] as const;

export const erc20Abi = [
  {type: "function", name: "symbol", inputs: [], outputs: [{type: "string"}], stateMutability: "view"},
  {type: "function", name: "decimals", inputs: [], outputs: [{type: "uint8"}], stateMutability: "view"},
] as const;
