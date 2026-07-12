// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {TaskRegistry} from "../src/TaskRegistry.sol";
import {VerificationOracle} from "../src/VerificationOracle.sol";

/// @notice Deployment script for A2A EVM contracts
/// @dev Usage:
///   forge script script/Deploy.s.sol --rpc-url <rpc> --broadcast --verify
contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy AgentRegistry
        AgentRegistry agentRegistry = new AgentRegistry();
        console2.log("AgentRegistry deployed at:", address(agentRegistry));

        // 2. Deploy TaskRegistry (linked to AgentRegistry)
        TaskRegistry taskRegistry = new TaskRegistry(address(agentRegistry));
        console2.log("TaskRegistry deployed at:", address(taskRegistry));

        // 3. Deploy VerificationOracle
        VerificationOracle verificationOracle = new VerificationOracle();
        console2.log("VerificationOracle deployed at:", address(verificationOracle));

        vm.stopBroadcast();

        // Output addresses for SDK config
        console2.log("\n--- Deployed Addresses ---");
        console2.log("AGENT_REGISTRY=", address(agentRegistry));
        console2.log("TASK_REGISTRY=", address(taskRegistry));
        console2.log("VERIFICATION_ORACLE=", address(verificationOracle));
    }
}
