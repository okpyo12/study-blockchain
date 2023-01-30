import { ethers, BigNumber } from "ethers";
import { FACTORY_ADDRESSES } from "../constants/addresses";

import {
  Exchange__factory,
  Factory__factory,
  Token__factory,
} from "../constants/typechain-types";

export function getProvider() {
  return new ethers.providers.Web3Provider(window.ethereum);
}

export function getSigner() {
  return getProvider().getSigner();
}

export function getFactoryContract(networkId: number) {
  return Factory__factory.connect(FACTORY_ADDRESSES[networkId], getSigner());
}

export function getExchangeContract(exchangeAddress: string) {
  return Exchange__factory.connect(exchangeAddress, getSigner());
}

export async function getTokenExchangeAddressFromFactory(
  tokenAddress: string,
  networkId: number
) {
  console.log("token: " + tokenAddress);
  return getFactoryContract(networkId).getExchange(tokenAddress);
}

export async function getTokenBalanceAndSymbol(
  accountAddress: string,
  tokenAddress: string
) {
  const token = Token__factory.connect(tokenAddress, getSigner());
  const symbol = await token.symbol();
  const balance = await token.balanceOf(accountAddress);
  return {
    symbol: symbol,
    balance: ethers.utils.formatEther(balance),
  };
}

export async function getAccountBalance(accountAddress: string) {
  const balance = await getProvider().getBalance(accountAddress);
  return {
    balance: ethers.utils.formatEther(balance),
    symbol: "ETH",
  };
}

export function fromWei(to: BigNumber) {
  return ethers.utils.formatEther(to.toString());
}

export function toWei(to: string) {
  return ethers.utils.parseEther(to);
}

export async function onEthToTokenSwap(
  inputAmount: BigNumber,
  outputAmount: BigNumber,
  tokenAddress: string,
  networkId: number
) {
  const exchangeAddress = await getFactoryContract(networkId).getExchange(
    tokenAddress
  );
  await getExchangeContract(exchangeAddress).ethToTokenSwap(outputAmount, {
    value: inputAmount,
  });
}
