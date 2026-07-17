// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title AgentRegistry
/// @notice On-chain registry for A2A protocol agents
contract AgentRegistry is Ownable, Pausable {
    // -------------------------------------------------------------------
    //  Errors
    // -------------------------------------------------------------------
    error AgentAlreadyRegistered(address owner);
    error AgentNotRegistered(address agent);
    error AgentNotOwner(address caller);
    error AgentSuspendedError(address agent);
    error InvalidAddress();
    error EmptyName();
    error InsufficientStake();

    // -------------------------------------------------------------------
    //  Events
    // -------------------------------------------------------------------
    event AgentRegistered(
        address indexed agentAddress,
        address indexed owner,
        string name,
        string metadataUri
    );
    event AgentUpdated(address indexed agentAddress, string metadataUri);
    event AgentSuspended(address indexed agentAddress);
    event AgentReactivated(address indexed agentAddress);
    event AgentDeregistered(address indexed agentAddress);
    event StakeAdded(address indexed agentAddress, uint256 amount);
    event StakeRemoved(address indexed agentAddress, uint256 amount);
    event StakeSlashed(address indexed agentAddress, uint256 amount);

    // -------------------------------------------------------------------
    //  Structs
    // -------------------------------------------------------------------
    struct Agent {
        address owner;
        string name;
        string metadataUri; // IPFS / content hash for off-chain metadata
        uint256 reputationScore; // basis points (0-10000 = 0-100%)
        uint256 totalStake; // native tokens staked
        uint256 tasksCompleted;
        uint256 tasksFailed;
        bool active;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    // -------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------
    mapping(address => Agent) private _agents;
    address[] private _agentList;

    // -------------------------------------------------------------------
    //  Modifiers
    // -------------------------------------------------------------------
    modifier onlyAgentOwner(address agentAddress) {
        if (agentAddress == address(0)) revert InvalidAddress();
        if (_agents[agentAddress].owner == address(0)) revert AgentNotRegistered(agentAddress);
        if (_agents[agentAddress].owner != msg.sender) revert AgentNotOwner(msg.sender);
        _;
    }

    modifier agentRegistered(address agentAddress) {
        if (_agents[agentAddress].owner == address(0)) revert AgentNotRegistered(agentAddress);
        _;
    }

    // -------------------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------------------
    constructor() Ownable(msg.sender) {}

    // -------------------------------------------------------------------
    //  External — Registration
    // -------------------------------------------------------------------

    /// @notice Register a new agent
    /// @param agentAddress The agent's EVM address
    /// @param name Human-readable name
    /// @param metadataUri IPFS hash for off-chain metadata
    function register(
        address agentAddress,
        string calldata name,
        string calldata metadataUri
    ) external whenNotPaused {
        if (agentAddress == address(0)) revert InvalidAddress();
        if (bytes(name).length == 0) revert EmptyName();
        if (_agents[agentAddress].owner != address(0)) revert AgentAlreadyRegistered(agentAddress);

        _agents[agentAddress] = Agent({
            owner: msg.sender,
            name: name,
            metadataUri: metadataUri,
            reputationScore: 0,
            totalStake: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            active: true,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });
        _agentList.push(agentAddress);

        emit AgentRegistered(agentAddress, msg.sender, name, metadataUri);
    }

    /// @notice Update agent metadata URI
    function updateMetadata(
        address agentAddress,
        string calldata metadataUri
    ) external onlyAgentOwner(agentAddress) agentRegistered(agentAddress) {
        _agents[agentAddress].metadataUri = metadataUri;
        _agents[agentAddress].updatedAt = block.timestamp;
        emit AgentUpdated(agentAddress, metadataUri);
    }

    /// @notice Deregister an agent (owner only)
    function deregister(address agentAddress)
        external
        onlyAgentOwner(agentAddress)
        agentRegistered(agentAddress)
    {
        _agents[agentAddress].active = false;
        _agents[agentAddress].updatedAt = block.timestamp;
        emit AgentDeregistered(agentAddress);
    }

    // -------------------------------------------------------------------
    //  External — Admin (owner only)
    // -------------------------------------------------------------------

    /// @notice Suspend an agent
    function suspend(address agentAddress)
        external
        onlyOwner
        agentRegistered(agentAddress)
    {
        _agents[agentAddress].active = false;
        _agents[agentAddress].updatedAt = block.timestamp;
        emit AgentSuspended(agentAddress);
    }

    /// @notice Reactivate a suspended agent
    function reactivate(address agentAddress)
        external
        onlyOwner
        agentRegistered(agentAddress)
    {
        _agents[agentAddress].active = true;
        _agents[agentAddress].updatedAt = block.timestamp;
        emit AgentReactivated(agentAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // -------------------------------------------------------------------
    //  Internal — Called by TaskRegistry / VerificationOracle
    // -------------------------------------------------------------------

    /// @notice Increment completed tasks (call after successful task completion)
    function recordCompletion(address agentAddress) external {
        _agents[agentAddress].tasksCompleted++;
        _agents[agentAddress].updatedAt = block.timestamp;
    }

    /// @notice Increment failed tasks
    function recordFailure(address agentAddress) external {
        _agents[agentAddress].tasksFailed++;
        _agents[agentAddress].updatedAt = block.timestamp;
    }

    /// @notice Update reputation (basis points, 0-10000)
    function setReputation(address agentAddress, uint256 score) external {
        _agents[agentAddress].reputationScore = score;
        _agents[agentAddress].updatedAt = block.timestamp;
    }

    /// @notice Add to total stake (called by escrow/staking contract)
    function addStake(address agentAddress, uint256 amount) external {
        _agents[agentAddress].totalStake += amount;
        _agents[agentAddress].updatedAt = block.timestamp;
        emit StakeAdded(agentAddress, amount);
    }

    /// @notice Remove stake (called by escrow/staking contract)
    function removeStake(address agentAddress, uint256 amount) external {
        if (_agents[agentAddress].totalStake < amount) revert InsufficientStake();
        _agents[agentAddress].totalStake -= amount;
        _agents[agentAddress].updatedAt = block.timestamp;
        emit StakeRemoved(agentAddress, amount);
    }

    /// @notice Slash stake on verification failure (called by VerificationOracle)
    function slashStake(address agentAddress, uint256 amount) external {
        if (_agents[agentAddress].totalStake < amount) revert InsufficientStake();
        _agents[agentAddress].totalStake -= amount;
        _agents[agentAddress].tasksFailed++;
        _agents[agentAddress].updatedAt = block.timestamp;
        emit StakeSlashed(agentAddress, amount);
    }

    // -------------------------------------------------------------------
    //  View
    // -------------------------------------------------------------------

    function getAgent(address agentAddress)
        external
        view
        agentRegistered(agentAddress)
        returns (Agent memory)
    {
        return _agents[agentAddress];
    }

    function isRegistered(address agentAddress) external view returns (bool) {
        return _agents[agentAddress].owner != address(0);
    }

    function isActive(address agentAddress) external view returns (bool) {
        return _agents[agentAddress].active;
    }

    function agentCount() external view returns (uint256) {
        return _agentList.length;
    }

    function getAgentByIndex(uint256 index) external view returns (address) {
        return _agentList[index];
    }
}
