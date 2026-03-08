import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { MEMO_PROGRAM_ID } from '@internet402/types';

export async function paySpl(
  connection: Connection,
  payer: Keypair,
  recipient: string,
  amount: number,
  mintAddress: string,
  memo: string,
): Promise<string> {
  const mint = new PublicKey(mintAddress);
  const recipientPubkey = new PublicKey(recipient);

  const senderAta = getAssociatedTokenAddressSync(mint, payer.publicKey);
  const recipientAta = getAssociatedTokenAddressSync(mint, recipientPubkey);

  const tx = new Transaction();

  try {
    await getAccount(connection, recipientAta);
  } catch {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        recipientAta,
        recipientPubkey,
        mint,
      ),
    );
  }

  tx.add(
    createTransferInstruction(senderAta, recipientAta, payer.publicKey, amount),
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
