// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LNFT is ERC721, Ownable {
  using Strings for uint256;

  uint256 MAX_SUPPLY = 100;
  bool isSaleActive;
  uint256 totalSupply;
  mapping (uint256 => uint256) tokenMetadataNo;

  constructor() ERC721("LNFT", "LN") {}

  function _baseURI() internal view override returns (string memory) {
    return "ipfs://QmfA7poczzdtoXrE1UjTDPJog1hMoFbrtWeKtRHHw2eMWo";
  }

  function setSale(bool active) external onlyOwner {
    isSaleActive = active;
  }


  function mintPlanet(uint256 count) external payable {
    require(isSaleActive, "not on sale");
    require(msg.value >= 1000000000000000 * count);
    require(count <= 10, "mint maximum 10 nfts at once");

    for (uint i = 0; i < count; i++) {
      require(totalSupply < MAX_SUPPLY, "max supply exceeded");
      tokenMetadataNo[totalSupply] = 1 + (uint256(blockhash(block.number)) % 8);
      _safeMint(msg.sender, totalSupply++);
    }
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, tokenMetadataNo[tokenId].toString()));
  }

  function withdraw() external onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }

  
}