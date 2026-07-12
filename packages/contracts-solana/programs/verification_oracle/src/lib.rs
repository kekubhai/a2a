use anchor_lang::prelude::*;

declare_id!("A2AVer1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp4");

#[program]
pub mod verification_oracle {
    use super::*;

    /// Submit a verification attestation for a task
    pub fn submit_verification(
        ctx: Context<SubmitVerification>,
        task_id: Pubkey,
        result: VerificationResult,
        confidence: u64,
        attestation_hash: String,
        signature: String,
        signature_algorithm: String,
    ) -> Result<()> {
        require!(confidence <= 10000, VerificationError::InvalidConfidence);
        require!(attestation_hash.len() <= 128, VerificationError::HashTooLong);
        require!(signature.len() <= 256, VerificationError::SignatureTooLong);

        let verification = &mut ctx.accounts.verification;
        verification.task_id = task_id;
        verification.verifier_agent = ctx.accounts.verifier.key();
        verification.result = result;
        verification.confidence = confidence;
        verification.attestation_hash = attestation_hash;
        verification.signature = signature;
        verification.signature_algorithm = signature_algorithm;
        verification.bump = ctx.bumps.verification;
        verification.verified_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Raise a dispute on a verification
    pub fn raise_dispute(
        ctx: Context<UpdateVerification>,
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= 512, VerificationError::ReasonTooLong);

        let verification = &mut ctx.accounts.verification;
        verification.result = VerificationResult::Disputed;
        verification.dispute_reason = reason;

        Ok(())
    }

    /// Resolve a dispute (authority only)
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        new_result: VerificationResult,
        resolution: String,
    ) -> Result<()> {
        require!(resolution.len() <= 512, VerificationError::ResolutionTooLong);

        let verification = &mut ctx.accounts.verification;
        verification.result = new_result;
        verification.dispute_resolution = resolution;

        Ok(())
    }
}

// -------------------------------------------------------------------
//  Accounts
// -------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(task_id: Pubkey)]
pub struct SubmitVerification<'info> {
    #[account(
        init,
        seeds = [b"verification", task_id.as_ref(), verifier.key().as_ref()],
        bump,
        payer = verifier,
        space = 8 + Verification::INIT_SPACE,
    )]
    pub verification: Account<'info, Verification>,

    #[account(mut)]
    pub verifier: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateVerification<'info> {
    #[account(mut)]
    pub verification: Account<'info, Verification>,

    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub verification: Account<'info, Verification>,

    /// CHECK: Authority (protocol admin / DAO)
    pub authority: Signer<'info>,
}

// -------------------------------------------------------------------
//  State
// -------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct Verification {
    pub task_id: Pubkey,
    pub verifier_agent: Pubkey,
    pub result: VerificationResult,
    pub confidence: u64,
    #[max_len(128)]
    pub attestation_hash: String,
    #[max_len(256)]
    pub signature: String,
    #[max_len(32)]
    pub signature_algorithm: String,
    #[max_len(512)]
    pub dispute_reason: String,
    #[max_len(512)]
    pub dispute_resolution: String,
    pub bump: u8,
    pub verified_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VerificationResult {
    Pending,
    Approved,
    Rejected,
    Partial,
    Disputed,
}

// -------------------------------------------------------------------
//  Errors
// -------------------------------------------------------------------

#[error_code]
pub enum VerificationError {
    #[msg("Confidence must be 0-10000 (basis points)")]
    InvalidConfidence,
    #[msg("Attestation hash must be 128 characters or less")]
    HashTooLong,
    #[msg("Signature must be 256 characters or less")]
    SignatureTooLong,
    #[msg("Dispute reason must be 512 characters or less")]
    ReasonTooLong,
    #[msg("Dispute resolution must be 512 characters or less")]
    ResolutionTooLong,
}
