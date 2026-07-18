// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {AchievementRegistry} from "../src/AchievementRegistry.sol";

contract AchievementRegistryTest is Test {
    AchievementRegistry registry;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    bytes32 constant WALLET_APPRENTICE = "wallet-apprentice";
    bytes32 constant FIRST_SWAP = "first-swap";

    function setUp() public {
        registry = new AchievementRegistry();
    }

    function test_unlock_recordsAchievement() public {
        vm.prank(alice);
        registry.unlock(WALLET_APPRENTICE);

        assertTrue(registry.hasUnlocked(alice, WALLET_APPRENTICE));
        assertEq(registry.achievementCount(alice), 1);

        bytes32[] memory achievements = registry.achievementsOf(alice);
        assertEq(achievements.length, 1);
        assertEq(achievements[0], WALLET_APPRENTICE);
    }

    function test_unlock_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit AchievementRegistry.AchievementUnlocked(alice, WALLET_APPRENTICE, block.timestamp);

        vm.prank(alice);
        registry.unlock(WALLET_APPRENTICE);
    }

    function test_unlock_revertsOnDuplicate() public {
        vm.prank(alice);
        registry.unlock(WALLET_APPRENTICE);

        vm.prank(alice);
        vm.expectRevert(AchievementRegistry.AlreadyUnlocked.selector);
        registry.unlock(WALLET_APPRENTICE);
    }

    function test_unlock_isPerWallet() public {
        vm.prank(alice);
        registry.unlock(WALLET_APPRENTICE);

        assertFalse(registry.hasUnlocked(bob, WALLET_APPRENTICE));
        assertEq(registry.achievementCount(bob), 0);
    }

    function test_unlock_multipleAchievementsAccumulate() public {
        vm.startPrank(alice);
        registry.unlock(WALLET_APPRENTICE);
        registry.unlock(FIRST_SWAP);
        vm.stopPrank();

        assertEq(registry.achievementCount(alice), 2);
        bytes32[] memory achievements = registry.achievementsOf(alice);
        assertEq(achievements[0], WALLET_APPRENTICE);
        assertEq(achievements[1], FIRST_SWAP);
    }
}
