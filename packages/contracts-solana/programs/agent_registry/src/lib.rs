use anchor_lang::prelude::*;

declare_id!("A2AAgt1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp2");

#[program]
pub mod agent_registry {
    use super::*;

    /// Register a new agent on-chain
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        metadata_uri: String,
        capabilities: Vec<String>,
    ) -> Result<()> {
        require!(name.len() <= 64, AgentError::NameTooLong);
        require!(metadata_uri.len() <= 256, AgentError::MetadataUriTooLong);

        let agent = &mut ctx.accounts.agent;
        agent.owner = ctx.accounts.owner.key();
        agent.name = name;
        agent.metadata_uri = metadata_uri;
        agent.capabilities = capabilities;
        agent.reputation_score = 0;
        agent.total_stake = 0;
        agent.tasks_completed = 0;
        agent.tasks_failed = 0;
        agent.active = true;
        agent.bump = ctx.bumps.agent;
        agent.registered_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Update agent metadata
    pub fn update_metadata(
        ctx: Context<UpdateAgent>,
        metadata_uri: String,
    ) -> Result<()> {
        require!(metadata_uri.len() <= 256, AgentError::MetadataUriTooLong);

        let agent = &mut ctx.accounts.agent;
        agent.metadata_uri = metadata_uri;

        Ok(())
    }

    /// Suspend an agent (authority only)
    pub fn suspend_agent(ctx: Context<SuspendAgent>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.active = false;
        Ok(())
    }

    /// Reactivate an agent (authority only)
    pub fn reactivate_agent(ctx: Context<ReactivateAgent>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.active = true;
        Ok(())
    }

    /// Record task completion (called by TaskRegistry via CPI)
    pub fn record_completion(ctx: Context<RecordStats>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.tasks_completed += 1;
        Ok(())
    }

    /// Record task failure (called by TaskRegistry via CPI)
    pub fn record_failure(ctx: Context<RecordStats>) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.tasks_failed += 1;
        Ok(())
    }

    /// Update reputation score
    pub fn set_reputation(
        ctx: Context<RecordStats>,
        score: u64,
    ) -> Result<()> {
        require!(score <= 10000, AgentError::InvalidReputation);
        let agent = &mut ctx.accounts.agent;
        agent.reputation_score = score;
        Ok(())
    }

    /// Add stake to agent
    pub fn add_stake(
        ctx: Context<StakeOperations>,
        amount: u64,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.total_stake += amount;
        Ok(())
    }

    /// Remove stake from agent
    pub fn remove_stake(
        ctx: Context<StakeOperations>,
        amount: u64,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require!(agent.total_stake >= amount, AgentError::InsufficientStake);
        agent.total_stake -= amount;
        Ok(())
    }

    /// Slash stake on verification failure
    pub fn slash_stake(
        ctx: Context<StakeOperations>,
        amount: u64,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require!(agent.total_stake >= amount, AgentError::InsufficientStake);
        agent.total_stake -= amount;
        agent.tasks_failed += 1;
        Ok(())
    }
}

// -------------------------------------------------------------------
//  Accounts
// -------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(name: String, metadata_uri: String)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        seeds = [b"agent", owner.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + Agent::INIT_SPACE,
    )]
    pub agent: Account<'info, Agent>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", owner.key().as_ref()],
        bump = agent.bump,
        has_one = owner,
    )]
    pub agent: Account<'info, Agent>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SuspendAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
    )]
    pub agent: Account<'info, Agent>,

    /// CHECK: Authority (protocol admin)
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReactivateAgent<'info> {
    #[account(
        mut,
        seeds = [b"agent", authority.key().as_ref()],
        bump = agent.bump,
    )]
    pub agent: Account<'info, Agent>,

    /// CHECK: Authority (protocol admin)
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordStats<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
}

#[derive(Accounts)]
pub struct StakeOperations<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
}

// -------------------------------------------------------------------
//  State
// -------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct Agent {
    pub owner: Pubkey,
    #[max_len(64)]
    pub name: String,
    #[max_len(256)]
    pub metadata_uri: String,
    #[max_len(5, 32)]
    pub capabilities: Vec<String>,
    pub reputation_score: u64,
    pub total_stake: u64,
    pub tasks_completed: u64,
    pub tasks_failed: u64,
    pub active: bool,
    pub bump: u8,
    pub registered_at: i64,
}

// -------------------------------------------------------------------
//  Errors
// -------------------------------------------------------------------

#[error_code]
pub enum AgentError {
    #[msg("Name must be 64 characters or less")]
    NameTooLong,
    #[msg("Metadata URI must be 256 characters or less")]
    MetadataUriTooLong,
    #[msg("Invalid reputation score (max 10000)")]
    InvalidReputation,
    #[msg("Insufficient stake balance")]
    InsufficientStake,
}
