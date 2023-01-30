import { ethers } from "hardhat";
import { expect } from "chai";

import { Exchange } from "../typechain-types/contracts/Exchange";
import { Token } from "../typechain-types/contracts/Token";
import { BigNumber } from "ethers";

const toWei = (value: number) => ethers.utils.parseEther(value.toString());
const toEther = (value: BigNumber) => ethers.utils.formatEther(value);
const getBalance = ethers.provider.getBalance;

describe.skip("Exchange", () => {
  let owner: any;
  let user: any;
  let exchange: Exchange;
  let token: Token;

  beforeEach(async () => {
    //기본적으로 10,000개의 Ether를 가지고 있음.
    [owner, user] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("Token");
    token = await TokenFactory.deploy("OkpyoToken", "OKPYO", toWei(50));
    await token.deployed();

    const ExchangeFactory = await ethers.getContractFactory("Exchange");
    exchange = await ExchangeFactory.deploy(token.address);
    await exchange.deployed();
  });

  describe.skip("addLiquidity", async () => {
    it("add liquidity", async () => {
      await token.approve(exchange.address, toWei(1000));
      await exchange.addLiquidity(toWei(1000), { value: toWei(1000) });
      expect(await getBalance(exchange.address)).to.equal(toWei(1000));
      expect(await token.balanceOf(exchange.address)).to.equal(toWei(1000));
      expect(await exchange.balanceOf(owner.address)).to.equal(toWei(1000));

      await token.transfer(user.address, toWei(2000));
      //나의 토큰을 Exchange Contract가 가져 갈 수 있도록 approve.
      await token.connect(user).approve(exchange.address, toWei(1000));
      await exchange
        .connect(user)
        .addLiquidity(toWei(500), { value: toWei(500) });
      expect(await exchange.balanceOf(user.address)).to.equal(toWei(500));
    });
  });

  describe.skip("removeLiquidity", async () => {
    it("correct remove liquidity", async () => {
      await token.approve(exchange.address, toWei(500));
      await exchange.addLiquidity(toWei(500), { value: toWei(1000) });
      expect(await getBalance(exchange.address)).to.equal(toWei(1000));
      expect(await token.balanceOf(exchange.address)).to.equal(toWei(500));
      expect(await exchange.balanceOf(owner.address)).to.equal(toWei(1000));

      await token.transfer(user.address, toWei(2000));
      //나의 토큰을 Exchange Contract가 가져 갈 수 있도록 approve.
      await token.connect(user).approve(exchange.address, toWei(100));
      await exchange
        .connect(user)
        .addLiquidity(toWei(100), { value: toWei(200) });
      expect(await token.balanceOf(exchange.address)).to.equal(toWei(600));

      await exchange.removeLiquidity(toWei(600));
      expect(await token.balanceOf(exchange.address)).to.equal(toWei(300));
    });
  });

  describe("addLiquidity", async () => {
    it("add liquidity", async () => {
      await token.approve(exchange.address, toWei(50));

      // 유동성 공급 ETH 50,  50
      await exchange.addLiquidity(toWei(50), { value: toWei(50) });

      // 유저 ETH 30,  18.6323713927227 스왑
      await exchange
        .connect(user)
        .ethToTokenSwap(toWei(18), { value: toWei(30) });

      // 스왑 후 유저의  잔액: 18.6323713927227
      expect(toEther(await token.balanceOf(user.address)).toString()).to.equal(
        "18.632371392722710163"
      );

      // owner의 유동성 제거
      await exchange.removeLiquidity(toWei(50));

      // onwer의 잔고는 50 - 18.632371392722710163인 31.367628607277289837 이다.
      expect(toEther(await token.balanceOf(owner.address)).toString()).to.equal(
        "31.367628607277289837"
      );
    });
  });

  describe("tokenToTokenSwap", async () => {
    it("correct tokenToTokenSwap", async () => {
      // 기본 10,000개 Ether 가지고 있음
      [owner, user] = await ethers.getSigners();

      const FactoryFactory = await ethers.getContractFactory("Factory");
      const factory = await FactoryFactory.deploy();
      await factory.deployed();

      // create OKPYO Token
      const TokenFactory = await ethers.getContractFactory("Token");
      const token = await TokenFactory.deploy(
        "OkpyoToken",
        "OKPYO",
        toWei(1010)
      );
      await token.deployed();

      // create FAST Token
      const TokenFactory2 = await ethers.getContractFactory("Token");
      const token2 = await TokenFactory2.deploy(
        "FastToken",
        "FAST",
        toWei(1000)
      );
      await token2.deployed();

      // create okpyo/eth pair exchange contract
      const exchangeAddress = await factory.callStatic.createExchange(
        token.address
      );
      await factory.createExchange(token.address);

      // create fast/eth pair exchange contract
      const exchange2Address = await factory.callStatic.createExchange(
        token2.address
      );
      await factory.createExchange(token2.address);

      // add liquidity 1000/1000
      await token.approve(exchangeAddress, toWei(1000));
      await token.approve(exchange2Address, toWei(1000));

      const ExchangeFactory = await ethers.getContractFactory("Exchange");
      await ExchangeFactory.attach(exchangeAddress).addLiquidity(toWei(1000), {
        value: toWei(1000),
      });

      await ExchangeFactory.attach(exchange2Address).addLiquidity(toWei(1000), {
        value: toWei(1000),
      });

      // 유동성 공급을 위해 approve한 1000개 다 사용해서 approve 10개
      await token.approve(exchangeAddress, toWei(10));
      await ExchangeFactory.attach(exchangeAddress).tokenToTokenSwap(
        toWei(10),
        toWei(9),
        toWei(9),
        token2.address
      );

      console.log(toEther(await token2.balanceOf(owner.address)));
    });
  });
});
