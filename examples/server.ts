import express from 'express';
import { expressInternet402 } from '@internet402/middleware/express';

const app = express();

app.use(
  '/api/premium',
  expressInternet402({
    address: 'YOUR_SOLANA_WALLET_ADDRESS',
    amount: 1_000_000, // 0.001 SOL in lamports
    token: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    expirySeconds: 300,
  }),
);

app.get('/api/premium/data', (_req, res) => {
  res.json({ secret: 'This is paid content', timestamp: Date.now() });
});

app.get('/api/public', (_req, res) => {
  res.json({ message: 'This is free' });
});

app.listen(3000, () => console.log('Server running on :3000'));
