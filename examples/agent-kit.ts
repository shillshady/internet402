import { Keypair, Connection } from '@solana/web3.js';
import { withInternet402 } from '@internet402/agent-kit-plugin';

// Works with any object that exposes wallet + connection
const agent = withInternet402({
  wallet: Keypair.generate(),
  connection: new Connection('https://api.mainnet-beta.solana.com'),
});

// Agent now auto-handles any 402-gated API
const result = await agent.fetch('https://api.example.com/premium-data');
console.log(await result.json());
