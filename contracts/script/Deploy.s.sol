// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {AchievementRegistry} from "../src/AchievementRegistry.sol";
import {OnboardingBadge} from "../src/OnboardingBadge.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        AchievementRegistry registry = new AchievementRegistry();
        console.log("AchievementRegistry deployed at:", address(registry));

        OnboardingBadge badge = new OnboardingBadge();
        console.log("OnboardingBadge deployed at:", address(badge));

        vm.stopBroadcast();
    }
}
