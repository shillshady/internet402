<p align="center">
  <img src="logo.png" width="120" />
</p>

<h1 align="center">INTERNET402</h1>

<p align="center">
  <strong>The Solana-native HTTP 402 payment protocol for AI agents.</strong>
</p>

<p align="center">
  <a href="https://internet402.vercel.app">Website</a> · <a href="https://x.com/internet402">Twitter</a> · <a href="#quickstart">Quickstart</a> · <a href="#packages">Packages</a>
</p>

---

HTTP 402 — "Payment Required" — has existed in the internet's source code since 1991. It was always meant to be used. It never was.

**Internet402 is the missing layer.** A lightweight, open-source protocol that lets any API gate access behind on-chain Solana payments — and lets AI agents pay automatically, without human intervention.

```
AGENT REQUESTS A SERVICE
        ↓
SERVER RETURNS 402 + PAYMENT HEADERS
        ↓
AGENT PAYS ON-CHAIN (SOL OR SPL)
        ↓
AGENT RETRIES WITH TX PROOF
        ↓
ACCESS GRANTED. INSTANTLY.
```

No API keys. No subscriptions. No middlemen.

---

## Quickstart

### Gate an API endpoint (server-side)

```bash
npm install @internet402/middleware @solana/web3.js
```

```typescript
import express from 'express';
import { expressInternet402 } from '@internet402/middleware/express';

const app = express();

// Any endpoint wrapped with internet402 now requires payment
app.use('/api/premium', expressInternet402({
  address: 'YOUR_SOLANA_WALLET',
  amount: 1_000_000,   // lamports (0.001 SOL)
  token: 'SOL',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
}));

app.get('/api/premium/data', (req, res) => {
  res.json({ secret: 'paid content' });
});

app.listen(3000);
```

That's it. Any request without a valid payment proof gets a `402 Payment Required` with the payment details in headers.

### Auto-pay from an agent (client-side)

```bash
npm install @internet402/client @solana/web3.js
```

```typescript
import { Keypair } from '@solana/web3.js';
import { Agent402Client } from '@internet402/client';

const client = new Agent402Client({
  keypair: Keypair.fromSecretKey(/* ... */),
  rpcUrl: 'https://api.mainnet-beta.solana.com',
});

// Automatically handles 402 → pay → retry → return data
const response = await client.fetch('https://api.example.com/premium/data');
const data = await response.json();
```

The agent never needs to know a payment was involved. It just works.

---

## How the Protocol Works

### 1. Agent requests a resource

```
GET https://api.service.com/data
```

### 2. Server returns 402 with payment headers

```
HTTP/1.1 402 Payment Required

X-Payment-Required: true
X-Payment-Address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
X-Payment-Amount: 1000000
X-Payment-Token: SOL
X-Payment-Memo: req_a1b2c3d4
X-Payment-Network: solana-mainnet
X-Payment-Expires: 1772994000
```

### 3. Agent pays on-chain

Sends a Solana transaction with:
- **Transfer** to `X-Payment-Address` for `X-Payment-Amount`
- **Memo** matching `X-Payment-Memo` (ties payment to request)

### 4. Agent retries with proof

```
GET https://api.service.com/data
X-Payment-Tx: 5KtPn1LGuxhFKJNQ7dkHBFPa7sGjMHXcRPrWFMr8tKrN...
```

### 5. Server verifies and grants access

Verification checks:
- Correct recipient, amount, and token
- Memo matches the request ID
- Transaction confirmed on-chain
- Within expiry window
- Not a replay (signature never reused)

```
HTTP/1.1 200 OK
{ "data": "..." }
```

---

## Packages

| Package | Description |
|---|---|
| [`@internet402/types`](./packages/types) | Shared protocol types, constants, and header utilities |
| [`@internet402/verifier`](./packages/verifier) | Solana transaction verification — SOL + SPL, memo matching, replay protection |
| [`@internet402/middleware`](./packages/middleware) | Server-side 402 gating — Express and Hono adapters |
| [`@internet402/client`](./packages/client) | Agent-side auto-payment client — detect 402 → pay → retry |
| [`@internet402/agent-kit-plugin`](./packages/agent-kit-plugin) | Solana Agent Kit integration wrapper |

### Dependency graph

```
@internet402/types          ← shared constants & interfaces
       ↑
@internet402/verifier       ← tx verification logic
       ↑
@internet402/middleware      ← server-side (Express/Hono)

@internet402/types
       ↑
@internet402/client          ← agent-side auto-payment
       ↑
@internet402/agent-kit-plugin ← Solana Agent Kit wrapper
```

---

## Multi-token Pricing

Services can accept SOL, $INT402, or any SPL token — with per-token pricing:

```typescript
expressInternet402({
  address: 'YOUR_WALLET',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  pricing: [
    { token: 'SOL', amount: 1_000_000 },         // 0.001 SOL
    { token: 'INT402_MINT_ADDRESS', amount: 100 }, // cheaper in $INT402
  ],
});
```

---

## Solana Agent Kit Integration

```typescript
import { withInternet402 } from '@internet402/agent-kit-plugin';
import { SolanaAgentKit } from 'solana-agent-kit';

const agent = withInternet402(new SolanaAgentKit(privateKey, rpcUrl));

// Agent now auto-handles any 402-gated API
const result = await agent.fetch('https://api.example.com/premium-data');
```

---

## Replay Protection

Every payment is verified against a replay store to prevent transaction reuse. The default in-memory store works for single-instance servers. For multi-instance deployments, implement the `ReplayStore` interface with Redis or any backing store:

```typescript
import type { ReplayStore } from '@internet402/verifier';

class RedisReplayStore implements ReplayStore {
  async has(signature: string): Promise<boolean> { /* ... */ }
  async add(signature: string, expiresAt: number): Promise<void> { /* ... */ }
}

expressInternet402({
  address: 'YOUR_WALLET',
  rpcUrl: '...',
  amount: 1_000_000,
  replayStore: new RedisReplayStore(),
});
```

---

## Development

```bash
# Install dependencies
npm install

# Build all packages (in correct dependency order)
npm run build

# Build a specific package
npm run build -w packages/types
```

---

## Why Internet402?

**vs. API keys** — No management, no rotation, no auth servers. Pay and go.

**vs. Subscriptions** — Pay per use. Agents don't overbuy. Services get paid exactly for usage.

**vs. EVM (x402)** — Solana is faster, cheaper, and where agent development is happening.

**vs. Nothing** — Right now agents can't pay for anything automatically. This is the primitive that makes agent economies possible.

---

## $INT402 Token

| Parameter | Value |
|---|---|
| Chain | Solana |
| Total Supply | 1,000,000,000 |
| Liquidity | 80% |
| Team | 10% |
| Ecosystem | 10% |
| Tax | 0% |

---

## Links

- **Website:** [internet402.vercel.app](https://internet402.vercel.app)
- **Twitter:** [@internet402](https://x.com/internet402)

---

## License

MIT

---

*HTTP 402: Payment Required — the status code that was always meant to be used. Now it is.*
