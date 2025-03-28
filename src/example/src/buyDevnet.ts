import { createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import PumpSwapSDK from "pump-swap-core-v1";

const buy = async () => {

    const payer = Keypair.fromSecretKey(bs58.decode(""))

    const connection = new Connection(clusterApiUrl("devnet"))
    const pSwap = new PumpSwapSDK("devnet", "confirmed")

    const base_mint = new PublicKey("5aR3mYrooha2HmeKyX2t9EEhV3VbnuSX2MFdsRGMajzs")
    const pool = new PublicKey("Frno4J9Yqdf8uwQKziNyybSQz4bD73mTsmiHQWxhJwGM")

    const base_amt = new BN(0.0001 * LAMPORTS_PER_SOL)
    const quote_amt = new BN(100356)

    const user_base_token_account = getAssociatedTokenAddressSync(base_mint, payer.publicKey)
    const user_quote_token_account = getAssociatedTokenAddressSync(NATIVE_MINT, payer.publicKey)

    const buyTx = new Transaction()
        .add(
            createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, user_base_token_account, payer.publicKey, base_mint),
            createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, user_quote_token_account, payer.publicKey, NATIVE_MINT),
            SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: user_quote_token_account,
                lamports: Number(quote_amt),
            }),
            createSyncNativeInstruction(user_quote_token_account)
        );
        
    buyTx.add(
        await pSwap.getBuyInstruction(base_amt, quote_amt, {
            pool,
            baseMint: base_mint,
            quoteMint: NATIVE_MINT,
            baseTokenProgram: TOKEN_PROGRAM_ID,
            quoteTokenProgram: TOKEN_PROGRAM_ID,
            user: payer.publicKey
        })
    )

    buyTx.feePayer = payer.publicKey
    buyTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    console.log(await connection.simulateTransaction(buyTx))

    const createSig = await sendAndConfirmTransaction(connection, buyTx, [payer]);
    console.log("Create BondingCurve Sig : ", createSig);
}

buy()
