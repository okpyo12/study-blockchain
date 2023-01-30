import { ethers } from "hardhat";

async function main() {
  const TokenIdentifiers = await ethers.getContractFactory("TokenIdentifiers");
  const tokenIdentifiers = await TokenIdentifiers.deploy();

  await tokenIdentifiers.deployed();

  const AssetShared = await ethers.getContractFactory("AssetShared", {
    libraries: {
      TokenIdentifiers: tokenIdentifiers.address,
    },
  });

  const contract = await AssetShared.deploy("Lazy Minting Contract", "LAZY");
  await contract.deployed();

  console.log("AssetShared : ", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
