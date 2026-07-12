// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentRegistry {
    function isActive(address agentAddress) external view returns (bool);
    function isRegistered(address agentAddress) external view returns (bool);
    function recordCompletion(address agentAddress) external;
    function recordFailure(address agentAddress) external;
    function setReputation(address agentAddress, uint256 score) external;
    function addStake(address agentAddress, uint256 amount) external;
}
