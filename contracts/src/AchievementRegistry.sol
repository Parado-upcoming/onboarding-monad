// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title AchievementRegistry
/// @notice Records which wallets have unlocked which achievements in The Onboarding.
/// @dev Eligibility (did this wallet actually complete the quest/debate/challenge?) is
///      enforced off-chain by the app before it ever prompts a wallet to sign this
///      transaction. This contract's job is only to give that unlock a public, permanent,
///      wallet-signed record -- the "proof of learning" the wallet can point to.
contract AchievementRegistry {
    mapping(address => mapping(bytes32 => bool)) public unlocked;
    mapping(address => bytes32[]) private _walletAchievements;

    event AchievementUnlocked(address indexed wallet, bytes32 indexed achievementId, uint256 timestamp);

    error AlreadyUnlocked();

    function unlock(bytes32 achievementId) external {
        if (unlocked[msg.sender][achievementId]) revert AlreadyUnlocked();
        unlocked[msg.sender][achievementId] = true;
        _walletAchievements[msg.sender].push(achievementId);
        emit AchievementUnlocked(msg.sender, achievementId, block.timestamp);
    }

    function achievementsOf(address wallet) external view returns (bytes32[] memory) {
        return _walletAchievements[wallet];
    }

    function achievementCount(address wallet) external view returns (uint256) {
        return _walletAchievements[wallet].length;
    }

    function hasUnlocked(address wallet, bytes32 achievementId) external view returns (bool) {
        return unlocked[wallet][achievementId];
    }
}
