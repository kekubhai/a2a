// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {VerificationOracle} from "../src/VerificationOracle.sol";

contract VerificationOracleTest is Test {
    VerificationOracle public oracle;
    address public owner;
    address public verifier;
    address public otherVerifier;

    function setUp() public {
        owner = address(this);
        verifier = makeAddr("verifier");
        otherVerifier = makeAddr("otherVerifier");
        oracle = new VerificationOracle();
    }

    // -------------------------------------------------------------------
    //  Submit Verification
    // -------------------------------------------------------------------

    function test_submitVerification_success() public {
        vm.prank(verifier);
        uint256 vid = oracle.submitVerification(
            1, // taskId
            verifier,
            uint8(VerificationOracle.Result.Approved),
            9500, // 95% confidence
            "QmAttestation",
            "0xsig",
            "secp256k1"
        );

        VerificationOracle.Verification memory v = oracle.getVerification(vid);
        assertEq(v.taskId, 1);
        assertEq(v.verifierAgent, verifier);
        assertEq(uint8(v.result), uint8(VerificationOracle.Result.Approved));
        assertEq(v.confidence, 9500);
        assertEq(v.attestationHash, "QmAttestation");
        assertEq(v.signature, "0xsig");
    }

    function test_submitVerification_revertsDuplicate() public {
        vm.prank(verifier);
        oracle.submitVerification(1, verifier, 1, 9000, "QmHash1", "", "");

        vm.expectRevert();
        vm.prank(verifier);
        oracle.submitVerification(1, verifier, 1, 9000, "QmHash2", "", "");
    }

    function test_submitVerification_revertsInvalidConfidence() public {
        vm.prank(verifier);
        vm.expectRevert(VerificationOracle.InvalidConfidence.selector);
        oracle.submitVerification(1, verifier, 1, 10001, "QmHash", "", "");
    }

    // -------------------------------------------------------------------
    //  Disputes
    // -------------------------------------------------------------------

    function test_raiseDispute_success() public {
        vm.prank(verifier);
        uint256 vid = oracle.submitVerification(
            1, verifier, uint8(VerificationOracle.Result.Approved), 9500, "QmHash", "", ""
        );

        oracle.raiseDispute(vid, "Incorrect verification");

        VerificationOracle.Verification memory v = oracle.getVerification(vid);
        assertEq(uint8(v.result), uint8(VerificationOracle.Result.Disputed));
        assertEq(v.disputeReason, "Incorrect verification");
    }

    function test_resolveDispute_success() public {
        vm.prank(verifier);
        uint256 vid = oracle.submitVerification(
            1, verifier, uint8(VerificationOracle.Result.Approved), 9500, "QmHash", "", ""
        );

        oracle.raiseDispute(vid, "Wrong");
        oracle.resolveDispute(vid, uint8(VerificationOracle.Result.Rejected), "Resolved");

        VerificationOracle.Verification memory v = oracle.getVerification(vid);
        assertEq(uint8(v.result), uint8(VerificationOracle.Result.Rejected));
        assertEq(v.disputeResolution, "Resolved");
    }

    function test_resolveDispute_revertsNonOwner() public {
        vm.prank(verifier);
        uint256 vid = oracle.submitVerification(
            1, verifier, uint8(VerificationOracle.Result.Approved), 9500, "QmHash", "", ""
        );

        vm.expectRevert();
        vm.prank(verifier);
        oracle.resolveDispute(vid, 2, "Resolved");
    }

    // -------------------------------------------------------------------
    //  Multiple verifiers on same task
    // -------------------------------------------------------------------

    function test_multipleVerifiers_sameTask() public {
        vm.prank(verifier);
        uint256 vid1 = oracle.submitVerification(
            1, verifier, uint8(VerificationOracle.Result.Approved), 9500, "Qm1", "", ""
        );

        vm.prank(otherVerifier);
        uint256 vid2 = oracle.submitVerification(
            1, otherVerifier, uint8(VerificationOracle.Result.Rejected), 8000, "Qm2", "", ""
        );

        assertEq(vid1, 0);
        assertEq(vid2, 1);
        assertNotEq(vid1, vid2);

        assertEq(oracle.getTaskVerification(1, verifier), vid1);
        assertEq(oracle.getTaskVerification(1, otherVerifier), vid2);
    }
}
