// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public owner;
    address public agent;
    address public otherAgent;

    function setUp() public {
        owner = address(this);
        agent = makeAddr("agent");
        otherAgent = makeAddr("otherAgent");
        registry = new AgentRegistry();
    }

    // -------------------------------------------------------------------
    //  Registration
    // -------------------------------------------------------------------

    function test_register_success() public {
        vm.prank(agent);
        registry.register(agent, "TestAgent", "QmHash123");

        assertTrue(registry.isRegistered(agent));
        assertTrue(registry.isActive(agent));

        AgentRegistry.Agent memory a = registry.getAgent(agent);
        assertEq(a.owner, agent);
        assertEq(a.name, "TestAgent");
        assertEq(a.metadataUri, "QmHash123");
        assertEq(a.reputationScore, 0);
        assertEq(a.totalStake, 0);
    }

    function test_register_revertsOnZeroAddress() public {
        vm.expectRevert(AgentRegistry.InvalidAddress.selector);
        registry.register(address(0), "Test", "QmHash");
    }

    function test_register_revertsOnEmptyName() public {
        vm.expectRevert(AgentRegistry.EmptyName.selector);
        registry.register(agent, "", "QmHash");
    }

    function test_register_revertsOnDuplicate() public {
        vm.prank(agent);
        registry.register(agent, "Agent1", "QmHash1");

        vm.expectRevert(AgentRegistry.AgentAlreadyRegistered.selector);
        vm.prank(agent);
        registry.register(agent, "Agent2", "QmHash2");
    }

    // -------------------------------------------------------------------
    //  Update / Deregister
    // -------------------------------------------------------------------

    function test_updateMetadata_success() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmOld");

        vm.prank(agent);
        registry.updateMetadata(agent, "QmNew");

        assertEq(registry.getAgent(agent).metadataUri, "QmNew");
    }

    function test_updateMetadata_revertsNotOwner() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        vm.expectRevert(AgentRegistry.AgentNotOwner.selector);
        vm.prank(otherAgent);
        registry.updateMetadata(agent, "QmNew");
    }

    function test_deregister_success() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        vm.prank(agent);
        registry.deregister(agent);

        assertFalse(registry.isActive(agent));
    }

    // -------------------------------------------------------------------
    //  Admin
    // -------------------------------------------------------------------

    function test_suspend_reactivate() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        registry.suspend(agent);
        assertFalse(registry.isActive(agent));

        registry.reactivate(agent);
        assertTrue(registry.isActive(agent));
    }

    function test_suspend_revertsNonOwner() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        vm.expectRevert();
        vm.prank(otherAgent);
        registry.suspend(agent);
    }

    // -------------------------------------------------------------------
    //  Reputation / Stake
    // -------------------------------------------------------------------

    function test_recordCompletion() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        registry.recordCompletion(agent);
        registry.recordCompletion(agent);

        AgentRegistry.Agent memory a = registry.getAgent(agent);
        assertEq(a.tasksCompleted, 2);
        assertEq(a.tasksFailed, 0);
    }

    function test_recordFailure() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        registry.recordFailure(agent);

        assertEq(registry.getAgent(agent).tasksFailed, 1);
    }

    function test_setReputation() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        registry.setReputation(agent, 7500); // 75%
        assertEq(registry.getAgent(agent).reputationScore, 7500);
    }

    function test_addStake() public {
        vm.prank(agent);
        registry.register(agent, "Agent", "QmHash");

        registry.addStake(agent, 1 ether);
        assertEq(registry.getAgent(agent).totalStake, 1 ether);
    }

    // -------------------------------------------------------------------
    //  Agent count
    // -------------------------------------------------------------------

    function test_agentCount() public {
        assertEq(registry.agentCount(), 0);

        vm.prank(agent);
        registry.register(agent, "Agent1", "QmHash1");
        assertEq(registry.agentCount(), 1);

        vm.prank(otherAgent);
        registry.register(otherAgent, "Agent2", "QmHash2");
        assertEq(registry.agentCount(), 2);
    }
}
