// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./TokenIdentifiers.sol";
import "hardhat/console.sol";

contract AssetShared is ERC721 {
    using TokenIdentifiers for uint256;
    mapping(uint256 => string) _tokenURI;

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {
        console.log("msg.sender : ", msg.sender);
    }

    function _requireMintable(address minter, uint256 tokenId) internal pure {
        require(
            tokenId.tokenCreator() == minter,
            "Only creator can mint token"
        );
    }

    function _mint(address to, uint256 tokenId) internal override {
        _requireMintable(msg.sender, tokenId);
        super._mint(to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override {
        bool exists = _exists(tokenId);

        if (exists) {
            super.safeTransferFrom(from, to, tokenId, data);
        } else {
            _mint(to, tokenId);
            _setTokenURI(tokenId, string(data));
        }
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURI[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireMinted(tokenId);
        return _tokenURI[tokenId];
    }
}
