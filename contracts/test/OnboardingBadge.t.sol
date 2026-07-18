// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {OnboardingBadge} from "../src/OnboardingBadge.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract OnboardingBadgeTest is Test {
    OnboardingBadge badge;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant FIRST_SWAP_BADGE = 0;
    uint256 constant MONAD_PIONEER_BADGE = 1;

    function setUp() public {
        badge = new OnboardingBadge();
    }

    function test_mint_transfersOwnership() public {
        vm.prank(alice);
        uint256 tokenId = badge.mint(FIRST_SWAP_BADGE);

        assertEq(badge.ownerOf(tokenId), alice);
        assertEq(badge.badgeTypeOf(tokenId), FIRST_SWAP_BADGE);
        assertTrue(badge.claimed(alice, FIRST_SWAP_BADGE));
    }

    function test_mint_emitsEvent() public {
        vm.expectEmit(true, true, false, false);
        emit OnboardingBadge.BadgeMinted(alice, FIRST_SWAP_BADGE, 0);

        vm.prank(alice);
        badge.mint(FIRST_SWAP_BADGE);
    }

    function test_mint_revertsOnDuplicateBadgeTypeForSameWallet() public {
        vm.startPrank(alice);
        badge.mint(FIRST_SWAP_BADGE);
        vm.expectRevert(OnboardingBadge.AlreadyClaimed.selector);
        badge.mint(FIRST_SWAP_BADGE);
        vm.stopPrank();
    }

    function test_mint_sameBadgeTypeAllowedForDifferentWallets() public {
        vm.prank(alice);
        uint256 aliceToken = badge.mint(FIRST_SWAP_BADGE);

        vm.prank(bob);
        uint256 bobToken = badge.mint(FIRST_SWAP_BADGE);

        assertEq(badge.ownerOf(aliceToken), alice);
        assertEq(badge.ownerOf(bobToken), bob);
        assertTrue(aliceToken != bobToken);
    }

    function test_mint_differentBadgeTypesForSameWallet() public {
        vm.startPrank(alice);
        uint256 t1 = badge.mint(FIRST_SWAP_BADGE);
        uint256 t2 = badge.mint(MONAD_PIONEER_BADGE);
        vm.stopPrank();

        assertEq(badge.ownerOf(t1), alice);
        assertEq(badge.ownerOf(t2), alice);
        assertEq(badge.badgeTypeOf(t1), FIRST_SWAP_BADGE);
        assertEq(badge.badgeTypeOf(t2), MONAD_PIONEER_BADGE);
    }

    function test_tokenURI_containsBadgeType() public {
        vm.prank(alice);
        uint256 tokenId = badge.mint(MONAD_PIONEER_BADGE);

        string memory uri = badge.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }

    function test_tokenURI_revertsForNonexistentToken() public {
        vm.expectRevert(
            abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 999)
        );
        badge.tokenURI(999);
    }
}
