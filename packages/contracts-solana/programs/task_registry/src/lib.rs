use anchor_lang::{prelude::*, solana_program::system_instruction};

declare_id!("A2ATsk1rGe11DKjNnEZBpGKvVXTbFBqVbJbVJnVaMp3");

#[program]
pub mod task_registry {
    use super::*;

    /// Create a new task with escrowed bounty
    pub fn create_task(
        ctx: Context<CreateTask>,
        buyer_agent: Pubkey,
        acceptance_criteria_hash: String,
        bounty_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        require!(acceptance_criteria_hash.len() <= 128, TaskError::HashTooLong);
        require!(bounty_amount > 0, TaskError::ZeroBounty);

        let task = &mut ctx.accounts.task;
        task.buyer_agent = buyer_agent;
        task.worker_agent = Pubkey::default();
        task.bounty_amount = bounty_amount;
        task.acceptance_criteria_hash = acceptance_criteria_hash;
        task.status = TaskStatus::Open;
        task.deadline = deadline;
        task.bump = ctx.bumps.task;
        task.created_at = Clock::get()?.unix_timestamp;

        // Transfer bounty from buyer to escrow PDA
        let ix = system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.escrow.key(),
            bounty_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    /// Assign a worker to an open task
    pub fn assign_task(
        ctx: Context<AssignTask>,
        worker_agent: Pubkey,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(task.status == TaskStatus::Open, TaskError::NotOpen);

        task.worker_agent = worker_agent;
        task.status = TaskStatus::Assigned;

        Ok(())
    }

    /// Worker submits completion proof
    pub fn submit_task(
        ctx: Context<SubmitTask>,
        submission_hash: String,
    ) -> Result<()> {
        require!(submission_hash.len() <= 128, TaskError::HashTooLong);

        let task = &mut ctx.accounts.task;
        require!(
            task.status == TaskStatus::Assigned || task.status == TaskStatus::InProgress,
            TaskError::InvalidStatus
        );

        // Check deadline
        if task.deadline > 0 {
            let now = Clock::get()?.unix_timestamp;
            require!(now <= task.deadline, TaskError::DeadlinePassed);
        }

        task.submission_hash = submission_hash;
        task.submitted_at = Clock::get()?.unix_timestamp;
        task.status = TaskStatus::Submitted;

        Ok(())
    }

    /// Approve task and release escrow to worker
    pub fn complete_task(ctx: Context<CompleteTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(task.status == TaskStatus::Submitted, TaskError::InvalidStatus);

        let bounty = task.bounty_amount;
        task.status = TaskStatus::Completed;
        task.completed_at = Clock::get()?.unix_timestamp;
        task.bounty_amount = 0;

        // Transfer escrow to worker
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= bounty;
        **ctx.accounts.worker.to_account_info().try_borrow_mut_lamports()? += bounty;

        Ok(())
    }

    /// Fail task and refund escrow to buyer
    pub fn fail_task(ctx: Context<FailTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(
            task.status == TaskStatus::Submitted
                || task.status == TaskStatus::Assigned
                || task.status == TaskStatus::InProgress,
            TaskError::InvalidStatus
        );

        let bounty = task.bounty_amount;
        task.status = TaskStatus::Failed;
        task.bounty_amount = 0;

        // Refund escrow to buyer
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= bounty;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += bounty;

        Ok(())
    }

    /// Cancel an open task and refund escrow
    pub fn cancel_task(ctx: Context<CancelTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(task.status == TaskStatus::Open, TaskError::NotOpen);

        let bounty = task.bounty_amount;
        task.status = TaskStatus::Cancelled;
        task.bounty_amount = 0;

        // Refund escrow to buyer
        **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= bounty;
        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? += bounty;

        Ok(())
    }
}

// -------------------------------------------------------------------
//  Accounts
// -------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(acceptance_criteria_hash: String)]
pub struct CreateTask<'info> {
    #[account(
        init,
        seeds = [b"task", buyer.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump,
        payer = buyer,
        space = 8 + Task::INIT_SPACE,
    )]
    pub task: Account<'info, Task>,

    /// CHECK: Escrow PDA for storing bounty
    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump,
    )]
    pub escrow: SystemAccount<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssignTask<'info> {
    #[account(mut)]
    pub task: Account<'info, Task>,

    pub buyer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitTask<'info> {
    #[account(mut)]
    pub task: Account<'info, Task>,

    pub worker: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(mut)]
    pub task: Account<'info, Task>,

    /// CHECK: Escrow PDA
    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump,
    )]
    pub escrow: SystemAccount<'info>,

    /// CHECK: Worker receiving payment
    #[account(mut)]
    pub worker: UncheckedAccount<'info>,

    pub buyer: Signer<'info>,
}

#[derive(Accounts)]
pub struct FailTask<'info> {
    #[account(mut)]
    pub task: Account<'info, Task>,

    /// CHECK: Escrow PDA
    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump,
    )]
    pub escrow: SystemAccount<'info>,

    /// CHECK: Buyer receiving refund
    #[account(mut)]
    pub buyer: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CancelTask<'info> {
    #[account(mut)]
    pub task: Account<'info, Task>,

    /// CHECK: Escrow PDA
    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump,
    )]
    pub escrow: SystemAccount<'info>,

    /// CHECK: Buyer receiving refund
    #[account(mut)]
    pub buyer: UncheckedAccount<'info>,
}

// -------------------------------------------------------------------
//  State
// -------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct Task {
    pub buyer_agent: Pubkey,
    pub worker_agent: Pubkey,
    pub bounty_amount: u64,
    #[max_len(128)]
    pub acceptance_criteria_hash: String,
    #[max_len(128)]
    pub submission_hash: String,
    pub status: TaskStatus,
    pub deadline: i64,
    pub bump: u8,
    pub created_at: i64,
    pub submitted_at: i64,
    pub completed_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum TaskStatus {
    Open,
    Bidding,
    Assigned,
    InProgress,
    Submitted,
    Verifying,
    Completed,
    Failed,
    Cancelled,
}

// -------------------------------------------------------------------
//  Errors
// -------------------------------------------------------------------

#[error_code]
pub enum TaskError {
    #[msg("Hash must be 128 characters or less")]
    HashTooLong,
    #[msg("Bounty must be greater than zero")]
    ZeroBounty,
    #[msg("Task is not open")]
    NotOpen,
    #[msg("Invalid status transition")]
    InvalidStatus,
    #[msg("Deadline has passed")]
    DeadlinePassed,
}
