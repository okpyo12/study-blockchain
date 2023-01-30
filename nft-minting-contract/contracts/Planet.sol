// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Planet is ERC721, Ownable {
  using Strings for uint256;

  uint256 numOfMetadata;
  uint256 public totalSupply;
  mapping (uint256 => uint256) tokenMetadataId;

  constructor(uint256 numOfMetadata_) ERC721("CryptoSpace", "PLANET") {
    numOfMetadata = numOfMetadata_;
  }

  function mintPlanet() external payable {
    require(msg.value >= 0.01 ether);
    uint256 tokenId = totalSupply++;

    uint256 metadataId = uint256(blockhash(block.number - 1)) % numOfMetadata;

    tokenMetadataId[tokenId] = metadataId;
    _safeMint(_msgSender(), tokenId);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    _requireMinted(tokenId);

    string memory baseURI = _baseURI();
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenMetadataId[tokenId].toString())) : "";
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return "https://space.coinyou.io/metadata/";
  }

  function withdraw() external onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }
}