import { ethers } from "hardhat";
import { Signer } from "ethers";
import { expect } from "chai";

describe("LNFT", function () {
  let owner: Signer;

  before(async () => {
    [owner] = await ethers.getSigners();
  });

  it("should have 10 nfts", async () => {
    const LNFT = await ethers.getContractFactory("LNFT");
    const contract = await LNFT.deploy();

    await contract.deployed();

    expect(await contract.balanceOf(await owner.getAddress())).to.be.equal(10);
  });
});
