// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title OnboardingBadge
/// @notice Flagship achievement NFTs for The Onboarding -- one badge per (wallet, badge type).
/// @dev Kept deliberately small: no admin, no royalties, no external metadata host. Badge type
///      is an app-defined small integer (see lib/chain/badges.ts in the web app) rather than a
///      separate on-chain registry, since the set of flagship badges is fixed at launch.
contract OnboardingBadge is ERC721 {
    using Strings for uint256;

    uint256 private _nextTokenId;

    mapping(address => mapping(uint256 => bool)) public claimed;
    mapping(uint256 => uint256) public badgeTypeOf;

    event BadgeMinted(address indexed wallet, uint256 indexed badgeType, uint256 indexed tokenId);

    error AlreadyClaimed();

    constructor() ERC721("The Onboarding Badge", "ONBOARD") {}

    function mint(uint256 badgeType) external returns (uint256 tokenId) {
        if (claimed[msg.sender][badgeType]) revert AlreadyClaimed();
        claimed[msg.sender][badgeType] = true;

        tokenId = _nextTokenId++;
        badgeTypeOf[tokenId] = badgeType;
        _safeMint(msg.sender, tokenId);

        emit BadgeMinted(msg.sender, badgeType, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 badgeType = badgeTypeOf[tokenId];
        return string.concat(
            "data:application/json;utf8,",
            '{"name":"The Onboarding Badge #',
            badgeType.toString(),
            '","description":"A flagship achievement earned in The Onboarding on Monad."}'
        );
    }
}
