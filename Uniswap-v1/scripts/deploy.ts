import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Factory = await ethers.getContractFactory("Factory");
  const contract = await Factory.deploy();

  const OkpyoToken = await ethers.getContractFactory("Token");
  const okpyoTokenContract = await OkpyoToken.deploy(
    "OkpyoToken",
    "OKPYO",
    1000
  );

  console.log("Contract deployed at:", contract.address);
  console.log("Contract2 deployed at:", okpyoTokenContract.address);
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchangeContract = await Exchange.deploy(okpyoTokenContract.address);
  
  console.log(exchangeContract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
