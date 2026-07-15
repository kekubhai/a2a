import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { assert } from 'chai';

const VERIFICATION_ORACLE_PROGRAM_ID = new PublicKey('A2AVer1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp4');

function findVerificationPda(
  taskId: PublicKey,
  verifier: PublicKey,
  programId: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('verification'), taskId.toBuffer(), verifier.toBuffer()],
    programId,
  );
}

describe('verification_oracle', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(
    require('../target/idl/verification_oracle.json'),
    provider,
  );

  const verifier = Keypair.generate();
  const authority = Keypair.generate();

  before(async () => {
    const sig = await provider.connection.requestAirdrop(
      verifier.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig);

    const authSig = await provider.connection.requestAirdrop(
      authority.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(authSig);
  });

  describe('submit_verification', () => {
    it('should submit a verification attestation', async () => {
      const taskId = Keypair.generate().publicKey;
      const [verificationPda] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      await program.methods
        .submitVerification(
          taskId,
          { approved: {} },
          new anchor.BN(9500),
          'QmAttestationHash',
          '0xabcdef1234567890',
          'secp256k1',
        )
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([verifier])
        .rpc();

      const verification = await program.account.verification.fetch(verificationPda);
      assert.equal(verification.taskId.toBase58(), taskId.toBase58());
      assert.equal(verification.verifierAgent.toBase58(), verifier.publicKey.toBase58());
      assert.deepEqual(verification.result, { approved: {} });
      assert.equal(verification.confidence.toNumber(), 9500);
      assert.equal(verification.attestationHash, 'QmAttestationHash');
      assert.equal(verification.signature, '0xabcdef1234567890');
      assert.equal(verification.signatureAlgorithm, 'secp256k1');
      assert.ok(verification.verifiedAt.toNumber() > 0);
    });

    it('should reject confidence > 10000', async () => {
      const taskId = Keypair.generate().publicKey;
      const [verificationPda] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      try {
        await program.methods
          .submitVerification(
            taskId,
            { approved: {} },
            new anchor.BN(10001),
            'QmHash',
            '0xsig',
            'ed25519',
          )
          .accounts({
            verification: verificationPda,
            verifier: verifier.publicKey,
            systemProgram: PublicKey.default,
          })
          .signers([verifier])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('InvalidConfidence'));
      }
    });

    it('should reject attestation hash > 128 chars', async () => {
      const taskId = Keypair.generate().publicKey;
      const [verificationPda] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      const longHash = 'A'.repeat(129);

      try {
        await program.methods
          .submitVerification(
            taskId,
            { approved: {} },
            new anchor.BN(5000),
            longHash,
            '0xsig',
            'ed25519',
          )
          .accounts({
            verification: verificationPda,
            verifier: verifier.publicKey,
            systemProgram: PublicKey.default,
          })
          .signers([verifier])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('HashTooLong'));
      }
    });

    it('should allow multiple verifiers for the same task', async () => {
      const taskId = Keypair.generate().publicKey;
      const secondVerifier = Keypair.generate();

      const sig = await provider.connection.requestAirdrop(
        secondVerifier.publicKey,
        1 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig);

      const [verificationPda1] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );
      const [verificationPda2] = findVerificationPda(
        taskId,
        secondVerifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      await program.methods
        .submitVerification(
          taskId,
          { approved: {} },
          new anchor.BN(8000),
          'QmHash1',
          '0xsig1',
          'secp256k1',
        )
        .accounts({
          verification: verificationPda1,
          verifier: verifier.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([verifier])
        .rpc();

      await program.methods
        .submitVerification(
          taskId,
          { rejected: {} },
          new anchor.BN(6000),
          'QmHash2',
          '0xsig2',
          'ed25519',
        )
        .accounts({
          verification: verificationPda2,
          verifier: secondVerifier.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([secondVerifier])
        .rpc();

      const v1 = await program.account.verification.fetch(verificationPda1);
      const v2 = await program.account.verification.fetch(verificationPda2);
      assert.deepEqual(v1.result, { approved: {} });
      assert.deepEqual(v2.result, { rejected: {} });
    });
  });

  describe('raise_dispute', () => {
    it('should raise a dispute on a verification', async () => {
      const taskId = Keypair.generate().publicKey;
      const [verificationPda] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      await program.methods
        .submitVerification(
          taskId,
          { approved: {} },
          new anchor.BN(9000),
          'QmDisputeHash',
          '0xsig',
          'secp256k1',
        )
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([verifier])
        .rpc();

      await program.methods
        .raiseDispute('Verifier misbehavior detected')
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
        })
        .signers([verifier])
        .rpc();

      const verification = await program.account.verification.fetch(verificationPda);
      assert.deepEqual(verification.result, { disputed: {} });
      assert.equal(verification.disputeReason, 'Verifier misbehavior detected');
    });

    it('should reject dispute reason > 512 chars', async () => {
      const taskId = Keypair.generate().publicKey;
      const [verificationPda] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      await program.methods
        .submitVerification(
          taskId,
          { approved: {} },
          new anchor.BN(9000),
          'QmLongReasonHash',
          '0xsig',
          'secp256k1',
        )
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([verifier])
        .rpc();

      const longReason = 'A'.repeat(513);

      try {
        await program.methods
          .raiseDispute(longReason)
          .accounts({
            verification: verificationPda,
            verifier: verifier.publicKey,
          })
          .signers([verifier])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('ReasonTooLong'));
      }
    });
  });

  describe('resolve_dispute', () => {
    it('should resolve a dispute with new result', async () => {
      const taskId = Keypair.generate().publicKey;
      const [verificationPda] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      await program.methods
        .submitVerification(
          taskId,
          { approved: {} },
          new anchor.BN(9000),
          'QmResolveHash',
          '0xsig',
          'secp256k1',
        )
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([verifier])
        .rpc();

      await program.methods
        .raiseDispute('Needs review')
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
        })
        .signers([verifier])
        .rpc();

      await program.methods
        .resolveDispute({ approved: {} }, 'Dispute resolved in favor of verifier')
        .accounts({
          verification: verificationPda,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const verification = await program.account.verification.fetch(verificationPda);
      assert.deepEqual(verification.result, { approved: {} });
      assert.equal(verification.disputeResolution, 'Dispute resolved in favor of verifier');
    });

    it('should reject resolution > 512 chars', async () => {
      const taskId = Keypair.generate().publicKey;
      const [verificationPda] = findVerificationPda(
        taskId,
        verifier.publicKey,
        VERIFICATION_ORACLE_PROGRAM_ID,
      );

      await program.methods
        .submitVerification(
          taskId,
          { approved: {} },
          new anchor.BN(9000),
          'QmLongResHash',
          '0xsig',
          'secp256k1',
        )
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
          systemProgram: PublicKey.default,
        })
        .signers([verifier])
        .rpc();

      await program.methods
        .raiseDispute('Review needed')
        .accounts({
          verification: verificationPda,
          verifier: verifier.publicKey,
        })
        .signers([verifier])
        .rpc();

      const longResolution = 'B'.repeat(513);

      try {
        await program.methods
          .resolveDispute({ rejected: {} }, longResolution)
          .accounts({
            verification: verificationPda,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(err.toString().includes('ResolutionTooLong'));
      }
    });
  });
});
