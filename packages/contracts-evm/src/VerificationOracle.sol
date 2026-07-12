// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title VerificationOracle
/// @notice Records on-chain verification attestations for task completion
contract VerificationOracle is Ownable, Pausable {
    // -------------------------------------------------------------------
    //  Errors
    // -------------------------------------------------------------------
    error InvalidAddress();
    error VerificationAlreadyExists(uint256 taskId, address verifier);
    error TaskNotSubmitted(uint256 taskId);
    error Unauthorized();
    error InvalidConfidence();
    error VerificationNotFound(uint256 verificationId);

    // -------------------------------------------------------------------
    //  Events
    // -------------------------------------------------------------------
    event VerificationSubmitted(
        uint256 indexed verificationId,
        uint256 indexed taskId,
        address indexed verifierAgent,
        uint8 result,
        string attestationHash
    );
    event DisputeRaised(
        uint256 indexed verificationId,
        uint256 indexed taskId,
        string reason
    );
    event DisputeResolved(
        uint256 indexed verificationId,
        uint256 indexed taskId,
        string resolution
    );

    // -------------------------------------------------------------------
    //  Enums & Structs
    // -------------------------------------------------------------------
    enum Result {
        Pending,
        Approved,
        Rejected,
        Partial,
        Disputed
    }

    struct Verification {
        uint256 taskId;
        address verifierAgent;
        Result result;
        uint256 confidence; // basis points (0-10000)
        string attestationHash; // IPFS / content hash
        string signature;
        string signatureAlgorithm;
        string disputeReason;
        string disputeResolution;
        uint256 verifiedAt;
        uint256 createdAt;
    }

    // -------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------
    uint256 public nextVerificationId;
    mapping(uint256 => Verification) private _verifications;
    // taskId => verifier => verificationId
    mapping(uint256 => mapping(address => uint256)) private _taskVerifications;

    // -------------------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------------------
    constructor() Ownable(msg.sender) {}

    // -------------------------------------------------------------------
    //  External
    // -------------------------------------------------------------------

    /// @notice Submit a verification attestation for a task
    function submitVerification(
        uint256 taskId,
        address verifierAgent,
        uint8 result,
        uint256 confidence,
        string calldata attestationHash,
        string calldata signature,
        string calldata signatureAlgorithm
    ) external whenNotPaused returns (uint256 verificationId) {
        if (verifierAgent == address(0)) revert InvalidAddress();
        if (confidence > 10000) revert InvalidConfidence();
        if (_taskVerifications[taskId][verifierAgent] != 0)
            revert VerificationAlreadyExists(taskId, verifierAgent);

        verificationId = nextVerificationId++;
        _verifications[verificationId] = Verification({
            taskId: taskId,
            verifierAgent: verifierAgent,
            result: Result(result),
            confidence: confidence,
            attestationHash: attestationHash,
            signature: signature,
            signatureAlgorithm: signatureAlgorithm,
            disputeReason: "",
            disputeResolution: "",
            verifiedAt: block.timestamp,
            createdAt: block.timestamp
        });
        _taskVerifications[taskId][verifierAgent] = verificationId;

        emit VerificationSubmitted(
            verificationId,
            taskId,
            verifierAgent,
            result,
            attestationHash
        );
    }

    /// @notice Raise a dispute on a verification
    function raiseDispute(
        uint256 verificationId,
        string calldata reason
    ) external whenNotPaused {
        Verification storage v = _verifications[verificationId];
        if (v.taskId == 0) revert VerificationNotFound(verificationId);

        v.result = Result.Disputed;
        v.disputeReason = reason;

        emit DisputeRaised(verificationId, v.taskId, reason);
    }

    /// @notice Resolve a dispute (owner only — will be DAO in production)
    function resolveDispute(
        uint256 verificationId,
        uint8 newResult,
        string calldata resolution
    ) external onlyOwner {
        Verification storage v = _verifications[verificationId];
        if (v.taskId == 0) revert VerificationNotFound(verificationId);

        v.result = Result(newResult);
        v.disputeResolution = resolution;

        emit DisputeResolved(verificationId, v.taskId, resolution);
    }

    // -------------------------------------------------------------------
    //  View
    // -------------------------------------------------------------------

    function getVerification(uint256 verificationId)
        external
        view
        returns (Verification memory)
    {
        return _verifications[verificationId];
    }

    function getTaskVerification(uint256 taskId, address verifier)
        external
        view
        returns (uint256)
    {
        return _taskVerifications[taskId][verifier];
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
