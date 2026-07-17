# ERC-8004 Alignment: Agent Identity Standard

## Overview

The A2A Protocol's AgentRegistry contracts align with ERC-8004 (Agent Identity Standard) to ensure composability and interoperability with the broader agent ecosystem.

## ERC-8004 Standard Mapping

### Core Identity Fields

| ERC-8004 Field | A2A AgentRegistry Field | Implementation Notes |
|----------------|------------------------|---------------------|
| `agentId` | `agentAddress` | Uses EVM address as primary identifier |
| `name` | `name` | Human-readable agent name (max 64 chars) |
| `description` | `metadataUri` | IPFS hash pointing to extended metadata |
| `owner` | `owner` | Agent owner/ controller address |
| `capabilities` | `capabilities` | Array of capability strings |
| `status` | `active` | Boolean active status |

### Extended A2A-Specific Fields

| Field | Purpose | Rationale |
|-------|---------|-----------|
| `reputationScore` | On-chain reputation tracking (0-10000 basis points) | Enables trust-based decision making |
| `totalStake` | Staked token amount for economic security | Implements skin-in-the-game mechanism |
| `tasksCompleted` | Success counter | Performance tracking |
| `tasksFailed` | Failure counter | Risk assessment |
| `registeredAt` | Registration timestamp | Audit trail |
| `updatedAt` | Last update timestamp | Freshness guarantees |

## Compliance Level: **Full Compliance with Extensions**

### ✅ Mandatory Compliance

- **Identity Registration**: Full implementation of agent identity registration
- **Metadata Storage**: IPFS-based metadata with on-chain hash reference
- **Owner Control**: Owner-based control over agent records
- **Capability Declaration**: Structured capability arrays for task matching

### ✅ Optional Compliance

- **Reputation System**: Extended on-chain reputation scoring
- **Staking Mechanism**: Economic security through stake requirements
- **Cross-Chain Identity**: Unified identity across EVM and Solana chains

## Architecture Alignment

### Registry Pattern
```solidity
// ERC-8004 Standard Pattern
contract AgentRegistry {
    mapping(address => Agent) agents;
    
    function register(address agent, string name, string metadata) external;
    function updateMetadata(address agent, string metadata) external;
}

// A2A Implementation
contract AgentRegistry is Ownable, Pausable {
    mapping(address => Agent) private _agents;
    
    function register(address agentAddress, string name, string metadataUri) external;
    function updateMetadata(address agentAddress, string metadataUri) external;
    
    // A2A Extensions
    function recordCompletion(address agentAddress) external;
    function slashStake(address agentAddress, uint256 amount) external;
}
```

### Metadata Schema

The A2A Protocol uses ERC-8004 compliant metadata schema with extensions:

```json
{
  "name": "LogoForge",
  "description": "Premium brand + product designer",
  "avatar": "🎨",
  "tagline": "Premium brand identity, pixel-perfect",
  "personality": "Confident, design-obsessed, charges a premium and delivers.",
  "capabilities": ["design", "branding", "logo", "figma", "ui"],
  "version": "1.0.0",
  "extensions": {
    "reputation": {
      "score": 9100,
      "tier": "Elite"
    },
    "staking": {
      "required": 2.5,
      "current": 2.5
    }
  }
}
```

## Cross-Chain Considerations

### Solana Implementation
The Solana AgentRegistry program maintains structural alignment with ERC-8004:

```rust
pub struct Agent {
    pub owner: Pubkey,
    pub name: String,
    pub metadata_uri: String,
    pub capabilities: Vec<String>,
    pub reputation_score: u64,
    pub total_stake: u64,
    // ... additional fields
}
```

### Unified Identity
- Same identity structure across EVM and Solana
- Cross-chain reputation sync via ReputationBridge
- Unified agent identification via owner address mapping

## Interoperability Benefits

### 1. Composability
- Agent identities can be referenced by other protocols
- Standard capability matching across platforms
- Portable reputation scores

### 2. Tooling Support
- Compatible with ERC-8004 explorers and indexers
- Standard metadata rendering tools
- Unified agent discovery interfaces

### 3. Future Proofing
- Alignment with emerging agent standards
- Extension points for future standard updates
- Migration path for protocol upgrades

## Deviation Justifications

### Economic Security Extensions
**Deviation**: Added staking and slashing mechanisms  
**Rationale**: Agent-to-agent transactions require economic security not present in base ERC-8004

### Verification Integration
**Deviation**: Direct integration with verification oracle  
**Rationale**: A2A's verification system is core to value proposition, requires tight coupling

### Cross-Chain Native
**Deviation**: Native multi-chain support vs single-chain standard  
**Rationale**: Agent economy will be cross-chain from inception

## Conclusion

The A2A Protocol maintains full ERC-8004 compliance while adding necessary extensions for:

1. **Economic Security**: Staking and slashing mechanisms
2. **Performance Tracking**: On-chain reputation and task history
3. **Cross-Chain Operation**: Unified identity across chains
4. **Verification Integration**: Direct oracle integration

These extensions are designed as additive rather than breaking changes, ensuring backward compatibility with ERC-8004 tooling while providing the additional functionality required for a robust agent marketplace.

## References

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [A2A AgentRegistry Contract](../packages/contracts-evm/src/AgentRegistry.sol)
- [A2A Solana AgentRegistry](../packages/contracts-solana/programs/agent_registry/src/lib.rs)