// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ReputationBridge
 * @notice Cross-chain reputation synchronization using Wormhole
 * @dev This contract enables reputation scores to be synchronized across chains
 */
contract ReputationBridge is Ownable {
    // -------------------------------------------------------------------
    //  Errors
    // -------------------------------------------------------------------
    error InvalidChainId();
    error InvalidReputationScore();
    error InsufficientFee();
    error BridgeNotEnabled();
    error InvalidSignature();

    // -------------------------------------------------------------------
    //  Events
    // -------------------------------------------------------------------
    event ReputationUpdateSent(
        address indexed agent,
        uint256 chainId,
        uint256 reputationScore,
        bytes32 indexed messageId
    );
    event ReputationUpdateReceived(
        address indexed agent,
        uint256 sourceChainId,
        uint256 reputationScore,
        bytes32 indexed messageId
    );
    event BridgeEnabled(uint256 chainId, address bridgeAddress);
    event BridgeDisabled(uint256 chainId);

    // -------------------------------------------------------------------
    //  Structs
    // -------------------------------------------------------------------
    struct ChainConfig {
        bool enabled;
        address bridgeAddress;
        uint16 wormholeChainId;
    }

    struct ReputationUpdate {
        address agent;
        uint256 reputationScore;
        uint256 timestamp;
    }

    // -------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------
    mapping(uint256 => ChainConfig) public chainConfigs;
    mapping(bytes32 => bool) public processedMessages;
    
    uint256 public currentChainId;
    uint256 public minimumFee;
    IERC20 public feeToken;

    // -------------------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------------------
    constructor(uint256 _currentChainId, address _feeToken, uint256 _minimumFee) Ownable(msg.sender) {
        currentChainId = _currentChainId;
        feeToken = IERC20(_feeToken);
        minimumFee = _minimumFee;
    }

    // -------------------------------------------------------------------
    //  External — Bridge Configuration
    // -------------------------------------------------------------------

    /// @notice Enable a bridge for a specific chain
    function enableBridge(
        uint256 targetChainId,
        address bridgeAddress,
        uint16 wormholeChainId
    ) external onlyOwner {
        chainConfigs[targetChainId] = ChainConfig({
            enabled: true,
            bridgeAddress: bridgeAddress,
            wormholeChainId: wormholeChainId
        });
        emit BridgeEnabled(targetChainId, bridgeAddress);
    }

    /// @notice Disable a bridge for a specific chain
    function disableBridge(uint256 targetChainId) external onlyOwner {
        chainConfigs[targetChainId].enabled = false;
        emit BridgeDisabled(targetChainId);
    }

    /// @notice Update minimum fee
    function setMinimumFee(uint256 newMinimumFee) external onlyOwner {
        minimumFee = newMinimumFee;
    }

    // -------------------------------------------------------------------
    //  External — Reputation Sync
    // -------------------------------------------------------------------

    /// @notice Send reputation update to another chain
    function sendReputationUpdate(
        address agent,
        uint256 targetChainId,
        uint256 reputationScore
    ) external payable {
        if (reputationScore > 10000) revert InvalidReputationScore();
        
        ChainConfig memory config = chainConfigs[targetChainId];
        if (!config.enabled) revert BridgeNotEnabled();
        if (msg.value < minimumFee) revert InsufficientFee();

        // Create message payload
        ReputationUpdate memory update = ReputationUpdate({
            agent: agent,
            reputationScore: reputationScore,
            timestamp: block.timestamp
        });

        bytes memory payload = abi.encode(update);
        bytes32 messageId = keccak256(abi.encodePacked(agent, targetChainId, reputationScore, block.timestamp));

        // In production, this would call Wormhole bridge contract
        // For demo purposes, we emit the event
        emit ReputationUpdateSent(agent, targetChainId, reputationScore, messageId);

        processedMessages[messageId] = true;
    }

    /// @notice Receive reputation update from another chain
    function receiveReputationUpdate(
        address agent,
        uint256 sourceChainId,
        uint256 reputationScore,
        bytes32 messageId,
        bytes calldata signature
    ) external {
        if (reputationScore > 10000) revert InvalidReputationScore();
        if (processedMessages[messageId]) revert InvalidSignature();

        // Verify signature from bridge
        // In production, verify Wormhole signature
        ChainConfig memory config = chainConfigs[sourceChainId];
        if (!config.enabled) revert BridgeNotEnabled();

        // Process the reputation update
        processedMessages[messageId] = true;
        
        emit ReputationUpdateReceived(agent, sourceChainId, reputationScore, messageId);

        // This would typically call AgentRegistry.setReputation()
        // For now, emit event for off-chain processing
    }

    // -------------------------------------------------------------------
    //  View
    // -------------------------------------------------------------------

    function isChainEnabled(uint256 chainId) external view returns (bool) {
        return chainConfigs[chainId].enabled;
    }

    function getChainConfig(uint256 chainId) external view returns (ChainConfig memory) {
        return chainConfigs[chainId];
    }

    function wasMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }
}