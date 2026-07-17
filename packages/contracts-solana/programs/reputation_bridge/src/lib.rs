use anchor_lang::prelude::*;

declare_id!("A2ARPBge11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp2");

#[program]
pub mod reputation_bridge {
    use super::*;

    /// Initialize the reputation bridge program
    pub fn initialize(
        ctx: Context<Initialize>,
        current_chain_id: u64,
        minimum_fee: u64,
    ) -> Result<()> {
        let bridge = &mut ctx.accounts.bridge;
        bridge.current_chain_id = current_chain_id;
        bridge.minimum_fee = minimum_fee;
        bridge.owner = ctx.accounts.owner.key();
        bridge.bump = ctx.bumps.bridge;
        Ok(())
    }

    /// Enable a bridge for a specific chain
    pub fn enable_bridge(
        ctx: Context<ManageBridge>,
        target_chain_id: u64,
        bridge_address: String,
        wormhole_chain_id: u16,
    ) -> Result<()> {
        let bridge = &mut ctx.accounts.bridge;
        
        // Store chain config in the first available slot
        for i in 0..bridge.chain_configs.len() {
            if bridge.chain_configs[i].chain_id == 0 {
                bridge.chain_configs[i] = ChainConfig {
                    chain_id: target_chain_id,
                    enabled: true,
                    bridge_address: bridge_address.clone(),
                    wormhole_chain_id,
                };
                return Ok(());
            }
        }
        
        Err(ReputationBridgeError::BridgeLimitReached.into())
    }

    /// Disable a bridge for a specific chain
    pub fn disable_bridge(
        ctx: Context<ManageBridge>,
        target_chain_id: u64,
    ) -> Result<()> {
        let bridge = &mut ctx.accounts.bridge;
        
        for i in 0..bridge.chain_configs.len() {
            if bridge.chain_configs[i].chain_id == target_chain_id {
                bridge.chain_configs[i].enabled = false;
                return Ok(());
            }
        }
        
        Err(ReputationBridgeError::BridgeNotEnabled.into())
    }

    /// Send reputation update to another chain
    pub fn send_reputation_update(
        ctx: Context<SendReputation>,
        agent: Pubkey,
        target_chain_id: u64,
        reputation_score: u64,
    ) -> Result<()> {
        require!(reputation_score <= 10000, ReputationBridgeError::InvalidReputationScore);
        
        let bridge = &mut ctx.accounts.bridge;
        
        let config = bridge.chain_configs.iter()
            .find(|c| c.chain_id == target_chain_id && c.enabled)
            .ok_or(ReputationBridgeError::BridgeNotEnabled)?;

        let update = ReputationUpdate {
            agent,
            reputation_score,
            timestamp: Clock::get()?.unix_timestamp,
        };

        let message_id = hash_reputation_update(&update, target_chain_id);
        
        // Mark message as processed (store in first available slot)
        for i in 0..bridge.processed_messages.len() {
            if bridge.processed_messages[i] == [0u8; 32] {
                bridge.processed_messages[i] = message_id;
                break;
            }
        }

        msg!("Reputation update sent for agent {:?} to chain {}", agent, target_chain_id);
        
        Ok(())
    }

    /// Receive reputation update from another chain
    pub fn receive_reputation_update(
        ctx: Context<ReceiveReputation>,
        agent: Pubkey,
        source_chain_id: u64,
        reputation_score: u64,
        message_id: [u8; 32],
    ) -> Result<()> {
        require!(reputation_score <= 10000, ReputationBridgeError::InvalidReputationScore);
        
        let bridge = &mut ctx.accounts.bridge;
        
        // Check if message was already processed
        if bridge.processed_messages.contains(&message_id) {
            return Err(ReputationBridgeError::InvalidSignature.into());
        }

        let config = bridge.chain_configs.iter()
            .find(|c| c.chain_id == source_chain_id && c.enabled)
            .ok_or(ReputationBridgeError::BridgeNotEnabled)?;

        // Mark message as processed
        for i in 0..bridge.processed_messages.len() {
            if bridge.processed_messages[i] == [0u8; 32] {
                bridge.processed_messages[i] = message_id;
                break;
            }
        }

        msg!("Reputation update received for agent {:?} from chain {}", agent, source_chain_id);
        
        // This would typically call AgentRegistry.set_reputation()
        // For now, emit message for off-chain processing
        
        Ok(())
    }
}

// -------------------------------------------------------------------
//  Accounts
// -------------------------------------------------------------------

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + ReputationBridge::INIT_SPACE,
        seeds = [b"reputation-bridge"],
        bump
    )]
    pub bridge: Account<'info, ReputationBridge>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageBridge<'info> {
    #[account(
        mut,
        seeds = [b"reputation-bridge"],
        bump = bridge.bump,
        has_one = owner
    )]
    pub bridge: Account<'info, ReputationBridge>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SendReputation<'info> {
    #[account(
        mut,
        seeds = [b"reputation-bridge"],
        bump = bridge.bump
    )]
    pub bridge: Account<'info, ReputationBridge>,
}

#[derive(Accounts)]
pub struct ReceiveReputation<'info> {
    #[account(
        mut,
        seeds = [b"reputation-bridge"],
        bump = bridge.bump
    )]
    pub bridge: Account<'info, ReputationBridge>,
}

// -------------------------------------------------------------------
//  State
// -------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct ReputationBridge {
    pub owner: Pubkey,
    pub current_chain_id: u64,
    pub minimum_fee: u64,
    #[max_len(10)]
    pub chain_configs: Vec<ChainConfig>,
    #[max_len(100)]
    pub processed_messages: Vec<[u8; 32]>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, Default)]
pub struct ChainConfig {
    pub chain_id: u64,
    pub enabled: bool,
    #[max_len(64)]
    pub bridge_address: String,
    pub wormhole_chain_id: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ReputationUpdate {
    pub agent: Pubkey,
    pub reputation_score: u64,
    pub timestamp: i64,
}

// -------------------------------------------------------------------
//  Helpers
// -------------------------------------------------------------------

fn hash_reputation_update(update: &ReputationUpdate, target_chain_id: u64) -> [u8; 32] {
    let mut hasher = solana_program::hash::hashv(&[
        b"reputation-update",
        update.agent.as_ref(),
        &update.reputation_score.to_le_bytes(),
        &update.timestamp.to_le_bytes(),
        &target_chain_id.to_le_bytes(),
    ]);
    hasher.to_bytes()
}

// -------------------------------------------------------------------
//  Errors
// -------------------------------------------------------------------

#[error_code]
pub enum ReputationBridgeError {
    #[msg("Invalid reputation score (max 10000)")]
    InvalidReputationScore,
    #[msg("Bridge not enabled for target chain")]
    BridgeNotEnabled,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Bridge limit reached")]
    BridgeLimitReached,
}