import { ethers } from "hardhat";

async function main() {
  const LNFT = await ethers.getContractFactory("LNFT");
  const contract = await LNFT.deploy();

  await contract.deployed();

  console.log(`NFT Contract ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
