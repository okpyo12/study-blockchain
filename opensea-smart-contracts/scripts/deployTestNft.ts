import { ethers } from "hardhat";

async function main() {
  const TestNft = await ethers.getContractFactory("TestNft");
  const testNft = await TestNft.deploy();

  await testNft.deployed();

  console.log("Test NFT : ", testNft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
