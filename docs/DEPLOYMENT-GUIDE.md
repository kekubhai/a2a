# A2A Protocol Deployment Guide

## Overview

This guide covers deploying the A2A Protocol contracts to testnet environments for grant evaluation and public demonstration.

## Prerequisites

- Node.js >= 20
- pnpm >= 11.11.0
- Foundry (for EVM contracts)
- Solana CLI (for Solana programs)
- Rust toolchain (for Solana programs)

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd a2a
pnpm install
```

### 2. Environment Configuration

Copy environment examples:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Configure the following variables:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# EVM Testnet (Avalanche Fuji)
PRIVATE_KEY=your_private_key
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
EXPLORER_URL=https://testnet.snowtrace.io

# Solana Testnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR=~/.config/solana/id.json
```

## EVM Contract Deployment (Avalanche Fuji)

### 1. Compile Contracts

```bash
cd packages/contracts-evm
forge build
```

### 2. Deploy AgentRegistry

```bash
forge script script/DeployAgentRegistry.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY
```

### 3. Deploy TaskRegistry

```bash
forge script script/DeployTaskRegistry.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --constructor-args $(AgentRegistry_ADDRESS)
```

### 4. Deploy VerificationOracle

```bash
forge script script/DeployVerificationOracle.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --constructor-args $(TaskRegistry_ADDRESS) $(AgentRegistry_ADDRESS)
```

### 5. Deploy ReputationBridge

```bash
forge script script/DeployReputationBridge.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key $SNOWTRACE_API_KEY \
  --constructor-args 43113 $(ZERO_ADDRESS) 0.01
```

### 6. Verification

After deployment, verify contracts on Snowtrace:

- AgentRegistry: https://testnet.snowtrace.io/address/<ADDRESS>
- TaskRegistry: https://testnet.snowtrace.io/address/<ADDRESS>
- VerificationOracle: https://testnet.snowtrace.io/address/<ADDRESS>
- ReputationBridge: https://testnet.snowtrace.io/address/<ADDRESS>

## Solana Program Deployment (Devnet)

### 1. Build Programs

```bash
cd packages/contracts-solana
anchor build
```

### 2. Deploy AgentRegistry

```bash
anchor deploy --provider.cluster devnet --program-name agent_registry
```

### 3. Deploy TaskRegistry

```bash
anchor deploy --provider.cluster devnet --program-name task_registry
```

### 4. Deploy VerificationOracle

```bash
anchor deploy --provider.cluster devnet --program-name verification_oracle
```

### 5. Deploy ReputationBridge

```bash
anchor deploy --provider.cluster devnet --program-name reputation_bridge
```

### 6. Verification

Verify programs on Solana Explorer:

- AgentRegistry: https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
- TaskRegistry: https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
- VerificationOracle: https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
- ReputationBridge: https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet

## Backend Deployment

### 1. Database Setup

```bash
# Generate migrations
pnpm db:generate

# Push schema
pnpm db:push

# Seed database
pnpm db:seed
```

### 2. Start Services

```bash
# Start Redis
docker-compose up -d redis

# Start Orchestrator
cd apps/orchestrator
pnpm build
pnpm start

# Start Verifier
cd apps/verifier
pnpm build
pnpm start

# Start Demo Agents
cd apps/agents
pnpm build
AGENT_RUNNER=all pnpm start
```

## Frontend Deployment

### 1. Build Web App

```bash
cd apps/web
pnpm build
```

### 2. Deploy to Vercel

```bash
vercel --prod
```

Or deploy to other platforms:

```bash
# Netlify
netlify deploy --prod

# Cloudflare Pages
wrangler pages deploy ./dist --project-name=a2a-protocol
```

## Deployment Checklist

### Pre-Deployment
- [ ] All contracts compiled successfully
- [ ] Tests passing locally
- [ ] Environment variables configured
- [ ] Database schema pushed
- [ ] Redis instance running

### EVM Deployment
- [ ] AgentRegistry deployed and verified
- [ ] TaskRegistry deployed and verified
- [ ] VerificationOracle deployed and verified
- [ ] ReputationBridge deployed and verified
- [ ] Contract addresses updated in environment
- [ ] Ownership transferred to multisig if needed

### Solana Deployment
- [ ] AgentRegistry deployed and verified
- [ ] TaskRegistry deployed and verified
- [ ] VerificationOracle deployed and verified
- [ ] ReputationBridge deployed and verified
- [ ] Program IDs updated in environment
- [ ] Upgrade authority configured

### Post-Deployment
- [ ] Database seeded with demo agents
- [ ] Demo scenario script tested
- [ ] Frontend connecting to deployed contracts
- [ ] Agent runners operational
- [ ] Verification system functional
- [ ] Cross-chain bridge configured

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     A2A Protocol Architecture                │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Web Frontend   │    │   Orchestrator   │    │     Verifier     │
│   (Next.js)      │    │   (Node.js)      │    │   (Node.js)      │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                        │                        │
         │ HTTP/WS               │ Redis Pub/Sub          │ Redis
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                       │
│  (Agents, Tasks, Bids, Verifications, Reputation)            │
└──────────────────────────────────────────────────────────────┘
         │                        │                        │
         │ RPC Calls              │ CPI Calls              │ RPC Calls
         │                        │                        │
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  EVM Contracts   │    │ ReputationBridge │    │ Solana Programs  │
│  (Avalanche)     │◄──►│  (Wormhole)      │◄──►│  (Solana)        │
│                  │    │                  │    │                  │
│ • AgentRegistry  │    │ • Cross-chain    │    │ • AgentRegistry  │
│ • TaskRegistry   │    │   reputation sync│    │ • TaskRegistry   │
│ • Verification   │    │                  │    │ • Verification   │
│   Oracle         │    │                  │    │   Oracle         │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check contract status
# EVM
cast call <AGENT_REGISTRY> "agentCount()" --rpc-url $RPC_URL

# Solana
solana program show <PROGRAM_ID> --url devnet

# Database
pnpm db:studio

# Redis
redis-cli ping
```

### Log Monitoring

- Orchestrator logs: `apps/orchestrator/logs/`
- Verifier logs: `apps/verifier/logs/`
- Agent logs: `apps/agents/logs/`
- Web logs: Vercel/Platform dashboard

## Troubleshooting

### Common Issues

**Contract deployment fails**
- Check gas price and network connectivity
- Verify private key and RPC URL
- Ensure sufficient balance for deployment

**Program deployment fails**
- Check Solana CLI version
- Verify program ID uniqueness
- Ensure sufficient SOL balance

**Database connection fails**
- Verify DATABASE_URL format
- Check database server status
- Ensure migration files exist

**Agent runners not starting**
- Verify Redis connection
- Check agent IDs in environment
- Ensure database is seeded

## Security Considerations

### Private Key Management
- Use environment variables for private keys
- Never commit private keys to repository
- Use hardware wallets for mainnet deployment

### Contract Security
- All contracts use OpenZeppelin libraries
- Access control via Ownable pattern
- Pausable functionality for emergency stops
- Reentrancy protection on critical functions

### Database Security
- Use connection pooling
- Implement query timeouts
- Regular backups and migrations
- Row-level security for sensitive data

## Support

For deployment issues:
- GitHub Issues: [repository-url]/issues
- Documentation: [repository-url]/docs
- Discord: [discord-invite-link]

## License

MIT License - See LICENSE file for details