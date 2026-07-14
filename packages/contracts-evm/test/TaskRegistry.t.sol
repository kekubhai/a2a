// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {TaskRegistry} from "../src/TaskRegistry.sol";

contract TaskRegistryTest is Test {
    AgentRegistry public agentRegistry;
    TaskRegistry public taskRegistry;

    address public owner;
    address public buyer;
    address public worker;
    address public malicious;

    uint256 constant BOUNTY = 1 ether;

    function setUp() public {
        owner = address(this);
        buyer = makeAddr("buyer");
        worker = makeAddr("worker");
        malicious = makeAddr("malicious");

        agentRegistry = new AgentRegistry();
        taskRegistry = new TaskRegistry(address(agentRegistry));

        // Register agents
        vm.prank(buyer);
        agentRegistry.register(buyer, "Buyer", "QmBuyer");

        vm.prank(worker);
        agentRegistry.register(worker, "Worker", "QmWorker");
    }

    // -------------------------------------------------------------------
    //  Create Task
    // -------------------------------------------------------------------

    function test_createTask_success() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(
            buyer, "QmCriteria", block.timestamp + 7 days
        );

        TaskRegistry.Task memory t = taskRegistry.getTask(taskId);
        assertEq(t.buyerAgent, buyer);
        assertEq(t.bounty, BOUNTY);
        assertEq(uint8(t.status), uint8(TaskRegistry.Status.Open));
        assertTrue(bytes(t.acceptanceCriteriaHash).length > 0);
    }

    function test_createTask_revertsZeroBounty() public {
        vm.prank(buyer);
        vm.expectRevert(TaskRegistry.InvalidBounty.selector);
        taskRegistry.createTask{value: 0}(buyer, "QmCriteria", 0);
    }

    function test_createTask_revertsUnregisteredBuyer() public {
        vm.prank(buyer);
        vm.expectRevert();
        taskRegistry.createTask{value: BOUNTY}(malicious, "QmCriteria", 0);
    }

    // -------------------------------------------------------------------
    //  Assign Task
    // -------------------------------------------------------------------

    function test_assignTask_success() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        assertEq(uint8(taskRegistry.getTaskStatus(taskId)), uint8(TaskRegistry.Status.Assigned));
        assertEq(taskRegistry.getTask(taskId).workerAgent, worker);
    }

    function test_assignTask_revertsNotBuyer() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.expectRevert();
        vm.prank(worker);
        taskRegistry.assignTask(taskId, worker);
    }

    // -------------------------------------------------------------------
    //  Submit Task
    // -------------------------------------------------------------------

    function test_submitTask_success() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        vm.prank(worker);
        taskRegistry.submitTask(taskId, "QmSubmission");

        assertEq(uint8(taskRegistry.getTaskStatus(taskId)), uint8(TaskRegistry.Status.Submitted));
        assertEq(taskRegistry.getTask(taskId).submittedAt > 0, true);
    }

    function test_submitTask_revertsNotWorker() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        vm.expectRevert();
        vm.prank(buyer);
        taskRegistry.submitTask(taskId, "QmSubmission");
    }

    // -------------------------------------------------------------------
    //  Complete Task — Escrow Release
    // -------------------------------------------------------------------

    function test_completeTask_releasesEscrow() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        vm.prank(worker);
        taskRegistry.submitTask(taskId, "QmSubmission");

        uint256 workerBalanceBefore = worker.balance;

        vm.prank(buyer);
        taskRegistry.completeTask(taskId);

        assertEq(uint8(taskRegistry.getTaskStatus(taskId)), uint8(TaskRegistry.Status.Completed));
        assertEq(worker.balance - workerBalanceBefore, BOUNTY);
        assertEq(taskRegistry.getTaskEscrow(taskId), 0);
    }

    function test_completeTask_revertsNotSubmitted() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        vm.expectRevert();
        vm.prank(buyer);
        taskRegistry.completeTask(taskId);
    }

    // -------------------------------------------------------------------
    //  Fail Task — Escrow Refund
    // -------------------------------------------------------------------

    function test_failTask_refundsEscrow() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        taskRegistry.failTask(taskId);

        assertEq(uint8(taskRegistry.getTaskStatus(taskId)), uint8(TaskRegistry.Status.Failed));
        assertEq(buyer.balance - buyerBalanceBefore, BOUNTY);
        assertEq(taskRegistry.getTaskEscrow(taskId), 0);
    }

    // -------------------------------------------------------------------
    //  Cancel Task — Escrow Refund
    // -------------------------------------------------------------------

    function test_cancelTask_refundsEscrow() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        taskRegistry.cancelTask(taskId);

        assertEq(uint8(taskRegistry.getTaskStatus(taskId)), uint8(TaskRegistry.Status.Cancelled));
        assertEq(buyer.balance - buyerBalanceBefore, BOUNTY);
    }

    function test_cancelTask_revertsNotOpen() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        vm.expectRevert();
        vm.prank(buyer);
        taskRegistry.cancelTask(taskId);
    }

    // -------------------------------------------------------------------
    //  Deadline Refund
    // -------------------------------------------------------------------

    function test_refundAfterDeadline_success() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(
            buyer, "QmCriteria", block.timestamp + 1 days
        );

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        // Warp past deadline
        vm.warp(block.timestamp + 2 days);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        taskRegistry.refundAfterDeadline(taskId);

        assertEq(uint8(taskRegistry.getTaskStatus(taskId)), uint8(TaskRegistry.Status.Failed));
        assertEq(buyer.balance - buyerBalanceBefore, BOUNTY);
    }

    function test_refundAfterDeadline_revertsBeforeDeadline() public {
        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: BOUNTY}(
            buyer, "QmCriteria", block.timestamp + 7 days
        );

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        vm.expectRevert();
        vm.prank(buyer);
        taskRegistry.refundAfterDeadline(taskId);
    }

    // -------------------------------------------------------------------
    //  Fuzz Tests — Escrow Invariants
    // -------------------------------------------------------------------

    /// @dev Invariant: escrow is always released exactly once per task
    function testFuzz_completeTask_exactlyOnce(uint96 bounty) public {
        vm.assume(bounty > 0 && bounty < type(uint96).max);

        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: bounty}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        vm.prank(worker);
        taskRegistry.submitTask(taskId, "QmSubmission");

        uint256 workerBalanceBefore = worker.balance;

        vm.prank(buyer);
        taskRegistry.completeTask(taskId);

        // Worker received bounty exactly
        assertEq(worker.balance - workerBalanceBefore, bounty);
        // Escrow is now 0
        assertEq(taskRegistry.getTaskEscrow(taskId), 0);
        // Cannot complete again
        vm.prank(buyer);
        vm.expectRevert();
        taskRegistry.completeTask(taskId);
    }

    /// @dev Invariant: cancel always returns full escrow
    function testFuzz_cancel_refundsFullAmount(uint96 bounty) public {
        vm.assume(bounty > 0 && bounty < type(uint96).max);

        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: bounty}(buyer, "QmCriteria", 0);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        taskRegistry.cancelTask(taskId);

        assertEq(buyer.balance - buyerBalanceBefore, bounty);
        assertEq(taskRegistry.getTask(taskId).bounty, 0);
    }

    /// @dev Invariant: fail always returns full escrow
    function testFuzz_fail_refundsFullAmount(uint96 bounty) public {
        vm.assume(bounty > 0 && bounty < type(uint96).max);

        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: bounty}(buyer, "QmCriteria", 0);

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        taskRegistry.failTask(taskId);

        assertEq(buyer.balance - buyerBalanceBefore, bounty);
        assertEq(taskRegistry.getTask(taskId).bounty, 0);
    }

    /// @dev Invariant: deadline refund returns full escrow after deadline
    function testFuzz_deadline_refundsFullAmount(uint96 bounty, uint32 deadlineOffset) public {
        vm.assume(bounty > 0 && bounty < type(uint96).max);
        vm.assume(deadlineOffset > 0 && deadlineOffset < 365 days);

        vm.prank(buyer);
        uint256 taskId = taskRegistry.createTask{value: bounty}(
            buyer, "QmCriteria", block.timestamp + deadlineOffset
        );

        vm.prank(buyer);
        taskRegistry.assignTask(taskId, worker);

        // Warp past deadline
        vm.warp(block.timestamp + deadlineOffset + 1);

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(buyer);
        taskRegistry.refundAfterDeadline(taskId);

        assertEq(buyer.balance - buyerBalanceBefore, bounty);
    }

    /// @dev Invariant: sum of all released amounts across tasks equals total deposited
    function testFuzz_totalEscrowConservation(uint96 bounty1, uint96 bounty2) public {
        vm.assume(bounty1 > 0 && bounty1 < type(uint96).max / 2);
        vm.assume(bounty2 > 0 && bounty2 < type(uint96).max / 2);

        uint256 totalDeposited = uint256(bounty1) + uint256(bounty2);

        vm.prank(buyer);
        uint256 task1 = taskRegistry.createTask{value: bounty1}(buyer, "Qm1", 0);
        vm.prank(buyer);
        uint256 task2 = taskRegistry.createTask{value: bounty2}(buyer, "Qm2", 0);

        // Complete task1
        vm.prank(buyer);
        taskRegistry.assignTask(task1, worker);
        vm.prank(worker);
        taskRegistry.submitTask(task1, "QmSub1");
        vm.prank(buyer);
        taskRegistry.completeTask(task1);

        // Cancel task2
        vm.prank(buyer);
        taskRegistry.cancelTask(task2);

        // Both escrows are now 0
        assertEq(taskRegistry.getTaskEscrow(task1), 0);
        assertEq(taskRegistry.getTaskEscrow(task2), 0);
    }
}
