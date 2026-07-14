// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAgentRegistry} from "./interfaces/IAgentRegistry.sol";

/// @title TaskRegistry
/// @notice Creates tasks with escrowed bounty, assigns agents, manages lifecycle
contract TaskRegistry is Ownable, ReentrancyGuard, Pausable {
    // -------------------------------------------------------------------
    //  Errors
    // -------------------------------------------------------------------
    error TaskNotFound(uint256 taskId);
    error InvalidBounty();
    error TaskNotOpen(uint256 taskId);
    error TaskNotAssigned(uint256 taskId);
    error NotTaskBuyer(uint256 taskId);
    error NotAssignedAgent(uint256 taskId);
    error DeadlinePassed(uint256 taskId);
    error DeadlineNotPassed(uint256 taskId);
    error AlreadySubmitted(uint256 taskId);
    error InvalidStatusTransition();
    error Unauthorized();
    error InvalidAddress();
    error EscrowTransferFailed();
    error InsufficientBalance();

    // -------------------------------------------------------------------
    //  Events
    // -------------------------------------------------------------------
    event TaskCreated(
        uint256 indexed taskId,
        address indexed buyerAgent,
        uint256 bounty,
        string acceptanceCriteriaHash
    );
    event TaskAssigned(uint256 indexed taskId, address indexed workerAgent);
    event TaskSubmitted(uint256 indexed taskId, string submissionHash);
    event TaskCompleted(uint256 indexed taskId);
    event TaskFailed(uint256 indexed taskId);
    event TaskCancelled(uint256 indexed taskId);
    event EscrowReleased(uint256 indexed taskId, address indexed to, uint256 amount);
    event EscrowRefunded(uint256 indexed taskId, address indexed to, uint256 amount);

    // -------------------------------------------------------------------
    //  Enums & Structs
    // -------------------------------------------------------------------
    enum Status {
        Open,
        Bidding,
        Assigned,
        InProgress,
        Submitted,
        Verifying,
        Completed,
        Failed,
        Cancelled
    }

    struct Task {
        address buyerAgent;
        address workerAgent;
        uint256 bounty;
        string acceptanceCriteriaHash;
        string submissionHash;
        Status status;
        uint256 deadline;
        uint256 createdAt;
        uint256 submittedAt;
        uint256 completedAt;
    }

    // -------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------
    IAgentRegistry public agentRegistry;
    uint256 public nextTaskId;
    mapping(uint256 => Task) private _tasks;

    // -------------------------------------------------------------------
    //  Modifiers
    // -------------------------------------------------------------------
    modifier onlyBuyer(uint256 taskId) {
        if (_tasks[taskId].buyerAgent != msg.sender) revert NotTaskBuyer(taskId);
        _;
    }

    modifier onlyWorker(uint256 taskId) {
        if (_tasks[taskId].workerAgent != msg.sender) revert NotAssignedAgent(taskId);
        _;
    }

    modifier taskExists(uint256 taskId) {
        if (_tasks[taskId].buyerAgent == address(0)) revert TaskNotFound(taskId);
        _;
    }

    // -------------------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------------------
    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = IAgentRegistry(_agentRegistry);
    }

    // -------------------------------------------------------------------
    //  Receive native tokens for escrow
    // -------------------------------------------------------------------
    receive() external payable {}

    // -------------------------------------------------------------------
    //  External — Task Lifecycle
    // -------------------------------------------------------------------

    /// @notice Create a new task with escrowed bounty
    /// @param acceptanceCriteriaHash IPFS hash of acceptance criteria
    /// @param deadline Unix timestamp deadline (0 = no deadline)
    /// @return taskId The new task ID
    function createTask(
        address buyerAgent,
        string calldata acceptanceCriteriaHash,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused returns (uint256 taskId) {
        if (buyerAgent == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidBounty();
        if (!agentRegistry.isActive(buyerAgent)) revert Unauthorized();

        taskId = nextTaskId++;
        _tasks[taskId] = Task({
            buyerAgent: buyerAgent,
            workerAgent: address(0),
            bounty: msg.value,
            acceptanceCriteriaHash: acceptanceCriteriaHash,
            submissionHash: "",
            status: Status.Open,
            deadline: deadline,
            createdAt: block.timestamp,
            submittedAt: 0,
            completedAt: 0
        });

        emit TaskCreated(taskId, buyerAgent, msg.value, acceptanceCriteriaHash);
    }

    /// @notice Assign a worker agent to an open task
    function assignTask(
        uint256 taskId,
        address workerAgent
    ) external onlyBuyer(taskId) taskExists(taskId) whenNotPaused {
        Task storage t = _tasks[taskId];
        if (t.status != Status.Open) revert TaskNotOpen(taskId);
        if (workerAgent == address(0)) revert InvalidAddress();
        if (!agentRegistry.isActive(workerAgent)) revert Unauthorized();

        t.workerAgent = workerAgent;
        t.status = Status.Assigned;

        emit TaskAssigned(taskId, workerAgent);
    }

    /// @notice Worker submits completion proof
    function submitTask(
        uint256 taskId,
        string calldata submissionHash
    ) external onlyWorker(taskId) taskExists(taskId) whenNotPaused {
        Task storage t = _tasks[taskId];
        if (t.status != Status.Assigned && t.status != Status.InProgress)
            revert InvalidStatusTransition();
        if (t.deadline > 0 && block.timestamp > t.deadline) revert DeadlinePassed(taskId);
        if (bytes(t.submissionHash).length > 0) revert AlreadySubmitted(taskId);

        t.submissionHash = submissionHash;
        t.submittedAt = block.timestamp;
        t.status = Status.Submitted;

        emit TaskSubmitted(taskId, submissionHash);
    }

    /// @notice Approve task completion and release escrow to worker
    function completeTask(uint256 taskId)
        external
        nonReentrant
        onlyBuyer(taskId)
        taskExists(taskId)
    {
        Task storage t = _tasks[taskId];
        if (t.status != Status.Submitted) revert InvalidStatusTransition();

        t.status = Status.Completed;
        t.completedAt = block.timestamp;

        uint256 bounty = t.bounty;
        t.bounty = 0;

        agentRegistry.recordCompletion(t.workerAgent);

        (bool sent, ) = payable(t.workerAgent).call{value: bounty}("");
        if (!sent) revert EscrowTransferFailed();

        emit TaskCompleted(taskId);
        emit EscrowReleased(taskId, t.workerAgent, bounty);
    }

    /// @notice Fail a task and refund escrow to buyer
    function failTask(uint256 taskId)
        external
        nonReentrant
        onlyBuyer(taskId)
        taskExists(taskId)
    {
        Task storage t = _tasks[taskId];
        if (
            t.status != Status.Submitted &&
            t.status != Status.Assigned &&
            t.status != Status.InProgress
        ) revert InvalidStatusTransition();

        t.status = Status.Failed;

        uint256 bounty = t.bounty;
        t.bounty = 0;

        agentRegistry.recordFailure(t.workerAgent);

        (bool sent, ) = payable(t.buyerAgent).call{value: bounty}("");
        if (!sent) revert EscrowTransferFailed();

        emit TaskFailed(taskId);
        emit EscrowRefunded(taskId, t.buyerAgent, bounty);
    }

    /// @notice Cancel an open task and refund escrow to buyer
    function cancelTask(uint256 taskId)
        external
        nonReentrant
        onlyBuyer(taskId)
        taskExists(taskId)
    {
        Task storage t = _tasks[taskId];
        if (t.status != Status.Open) revert InvalidStatusTransition();

        t.status = Status.Cancelled;

        uint256 bounty = t.bounty;
        t.bounty = 0;

        (bool sent, ) = payable(t.buyerAgent).call{value: bounty}("");
        if (!sent) revert EscrowTransferFailed();

        emit TaskCancelled(taskId);
        emit EscrowRefunded(taskId, t.buyerAgent, bounty);
    }

    /// @notice Request refund if deadline has passed (buyer only)
    function refundAfterDeadline(uint256 taskId)
        external
        nonReentrant
        onlyBuyer(taskId)
        taskExists(taskId)
    {
        Task storage t = _tasks[taskId];
        if (t.deadline == 0) revert DeadlineNotPassed(taskId);
        if (block.timestamp <= t.deadline) revert DeadlineNotPassed(taskId);
        if (t.status != Status.Assigned && t.status != Status.InProgress)
            revert InvalidStatusTransition();

        t.status = Status.Failed;

        uint256 bounty = t.bounty;
        t.bounty = 0;

        (bool sent, ) = payable(t.buyerAgent).call{value: bounty}("");
        if (!sent) revert EscrowTransferFailed();

        emit TaskFailed(taskId);
        emit EscrowRefunded(taskId, t.buyerAgent, bounty);
    }

    // -------------------------------------------------------------------
    //  View
    // -------------------------------------------------------------------

    function getTask(uint256 taskId) external view taskExists(taskId) returns (Task memory) {
        return _tasks[taskId];
    }

    function getTaskStatus(uint256 taskId) external view taskExists(taskId) returns (Status) {
        return _tasks[taskId].status;
    }

    function getTaskEscrow(uint256 taskId) external view taskExists(taskId) returns (uint256) {
        return _tasks[taskId].bounty;
    }

    // -------------------------------------------------------------------
    //  Admin
    // -------------------------------------------------------------------
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
