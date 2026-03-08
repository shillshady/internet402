# Internet402 — Solana Technical Implementation

> The Solana-native implementation of HTTP 402 payment protocol for AI agents.

---

## Overview

Coinbase built [x402](https://github.com/coinbase/x402) for EVM chains.
Nobody built it for Solana.

Internet402 is that implementation.

A lightweight, open-source protocol that lets any API or service gate access
behind on-chain Solana payments — and lets AI agents pay automatically,
without human intervention.

---

## How The Protocol Works

### Step 1 — Agent Requests a Resource

```
GET https://api.someservice.com/data
```

### Step 2 — Server Returns 402

```
HTTP/1.1 402 Payment Required

Headers:
  X-Payment-Required: true
  X-Payment-Address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
  X-Payment-Amount: 1000000
  X-Payment-Token: SOL
  X-Payment-Memo: req_a1b2c3d4
  X-Payment-Network: solana-mainnet
  X-Payment-Expires: 1772994000
```

### Step 3 — Agent Pays On-Chain

Agent reads the payment headers, submits a Solana transaction:
- Recipient: `X-Payment-Address`
- Amount: `X-Payment-Amount` (in lamports or token units)
- Token: SOL or SPL token mint
- Memo: `X-Payment-Memo` (ties payment to this specific request)

### Step 4 — Agent Retries With Proof

```
GET https://api.someservice.com/data
X-Payment-Tx: 5KtPn1LGuxhFKJNQ7dkHBFPa7sGjMHXcRPrWFMr8tKrN...
```

### Step 5 — Server Verifies and Grants Access

Server calls Solana RPC, verifies:
- Correct recipient address
- Correct amount
- Correct token
- Memo matches request ID
- Transaction is recent (within expiry window)
- Transaction not already used (replay protection)

```
HTTP/1.1 200 OK
{ "data": "..." }
```

---

## Core Components

### 1. Server Middleware SDK

Drop-in middleware for any Node.js API.

```js
import { internet402 } from '@internet402/middleware'

app.use('/api/premium', internet402({
  address: 'YOUR_SOLANA_WALLET',
  amount: 0.001,          // SOL
  token: 'SOL',           // or SPL mint address
  network: 'mainnet',
}))

app.get('/api/premium/data', (req, res) => {
  res.json({ secret: 'paid content' })
})
```

That's it. Any endpoint wrapped with `internet402()` now requires payment.

**Supports:**
- Express, Fastify, Hono, raw Node.js
- SOL payments
- Any SPL token (including $INT402)
- Custom pricing per endpoint
- Per-request or subscription-style access

---

### 2. Agent Client Library

Works with Solana Agent Kit and any Solana wallet.

```js
import { Agent402Client } from '@internet402/client'

const client = new Agent402Client({
  wallet: agentKeypair,
  rpc: 'https://mainnet.helius-rpc.com/?api-key=...',
})

// Automatically handles 402 responses
const data = await client.fetch('https://api.someservice.com/data')
// → detects 402 → pays → retries → returns data
```

The agent never needs to know a payment was involved. It just works.

---

### 3. Payment Verifier (On-Chain)

Solana RPC verification flow:

```
1. Get transaction by signature
2. Check transaction is confirmed (not just processed)
3. Verify recipient matches X-Payment-Address
4. Verify amount matches X-Payment-Amount
5. Verify token matches X-Payment-Token
6. Verify memo matches X-Payment-Memo
7. Verify blockTime is within expiry window
8. Check signature against used-tx store (replay protection)
9. Mark signature as used
10. Grant access
```

Replay protection via in-memory + optional Redis store.
Transactions expire after the window set in `X-Payment-Expires`.

---

### 4. Solana Program (Optional V2)

On-chain program for advanced use cases:

```
PDA: PaymentEscrow {
  service_address: Pubkey,
  request_id: String,
  amount: u64,
  token: Pubkey,
  paid_at: i64,
  claimed: bool,
}
```

**Unlocks:**
- Trustless escrow (pay first, verify later, no server trust needed)
- Subscriptions (pay once, access for X days)
- Revenue sharing (split fees between protocol and service)
- On-chain access NFTs (SoulBound tokens proving paid access)

---

## $INT402 Token Integration

Services can choose to accept:
- **SOL** (universal, no friction)
- **$INT402** (protocol token, discounted access)

When a service accepts $INT402:
- Lower fees than SOL payments
- Drives token demand with every API call
- Creates real utility tied to usage

```js
internet402({
  address: 'YOUR_WALLET',
  pricing: [
    { token: 'SOL',     amount: 0.001 },
    { token: INT402_MINT, amount: 100 },  // cheaper in $INT402
  ]
})
```

---

## Integration With Solana Agent Kit

Solana Agent Kit already handles:
- Token transfers
- Transaction signing
- Wallet management

Internet402 adds:
- HTTP 402 interception
- Automatic payment on 402 response
- Retry logic with proof headers

```js
import { SolanaAgentKit } from 'solana-agent-kit'
import { withInternet402 } from '@internet402/agent-kit-plugin'

const agent = withInternet402(new SolanaAgentKit(privateKey, rpc))

// Agent now automatically handles any 402-gated API
const result = await agent.fetch('https://api.example.com/premium-data')
```

---

## What Gets Built (Priority Order)

| # | Component | Description | Effort |
|---|---|---|---|
| 1 | Middleware SDK | Server-side 402 gating | Low |
| 2 | Client Library | Agent-side auto-payment | Low |
| 3 | Payment Verifier | RPC verification logic | Low |
| 4 | Agent Kit Plugin | Solana Agent Kit integration | Medium |
| 5 | Dashboard | Service provider analytics | Medium |
| 6 | On-chain Program | Escrow + subscriptions | High |

---

## Why This Wins

**vs. API keys:** No management, no rotation, no auth servers. Pay and go.

**vs. Subscriptions:** Pay per use. Agents don't overbuy. Services get paid exactly for usage.

**vs. EVM x402:** Solana is faster, cheaper, and where agent dev is actually happening right now.

**vs. Nothing:** Right now agents can't pay for anything automatically. This is the primitive that makes agent economies possible.

---

## The Moat

Once services integrate the middleware, they won't remove it.
Once agents use the client, every new service they hit uses Internet402.

Network effects. Both sides of the market.

---

## Open Source Strategy

1. Core protocol → fully open source (MIT)
2. Middleware + client → open source
3. $INT402 token → fee capture for the ecosystem
4. Hosted verification service → optional paid tier for services that don't want to run their own RPC

---

*Built on Solana. Powered by $INT402. The payment layer the internet always needed.*
