import { Keypair } from '@solana/web3.js';
import { Agent402Client } from '@internet402/client';

const keypair = Keypair.fromSecretKey(/* your secret key bytes */);

const client = new Agent402Client({
  keypair,
  rpcUrl: 'https://api.mainnet-beta.solana.com',
});

// This automatically handles 402 responses:
// 1. Makes initial request
// 2. Detects 402 + payment headers
// 3. Sends SOL/SPL payment on-chain
// 4. Retries with X-Payment-Tx proof header
// 5. Returns the final response
const response = await client.fetch('http://localhost:3000/api/premium/data');
const data = await response.json();
console.log(data);
