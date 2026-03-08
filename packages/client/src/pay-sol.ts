import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { MEMO_PROGRAM_ID } from '@internet402/types';

export async function paySol(
  connection: Connection,
  payer: Keypair,
  recipient: string,
  lamports: number,
  memo: string,
): Promise<string> {
  const tx = new Transaction();

  tx.add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: new PublicKey(recipient),
      lamports,
    }),
  );

  tx.add(
    new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
      programId: new PublicKey(MEMO_PROGRAM_ID),
      data: Buffer.from(memo, 'utf-8'),
    }),
  );

  const signature = await connection.sendTransaction(tx, [payer], {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}
