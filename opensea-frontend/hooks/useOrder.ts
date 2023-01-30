import { BN } from "bn.js";
import { useCallback, useContext } from "react";
import { erc20Abi, erc721Abi, exchangeAbi, proxyRegistryAbi } from "../abi";
import {
  acceptOffer,
  generateBuyOrder,
  generateOfferOrder,
  generateSellOrder,
  getProxyAddress,
  verifyBuyOrder,
  verifyOfferOrder,
  verifySellOrder,
} from "../api";
import { WalletContext } from "../contexts";

const PROXY_REGISTRY_CONTRACT_ADDRESS =
  "0xf88185e468CfbC312DFA35E430aE7a3F1249103A";

const EXCHANGE_ADDRESS = "0x47fBca5f5Db4dd924E04630A98a348C256d0E421";

const WETH_CONTRACT_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

const CHAIN_ID = 5;

export interface SolidityOrder {
  exchange: string;
  maker: string;
  taker: string;
  saleSide: number;
  saleKind: number;
  target: string;
  paymentToken: string;
  calldata_: string;
  replacementPattern: string;
  staticTarget: string;
  staticExtra: string;
  basePrice: string;
  endPrice: string;
  listingTime: number;
  expirationTime: number;
  salt: string;
}

const signOrder = async (web3: any, account: string, order: SolidityOrder) => {
  const orderType = [
    { name: "exchange", type: "address" },
    { name: "maker", type: "address" },
    { name: "taker", type: "address" },
    { name: "saleSide", type: "uint8" },
    { name: "saleKind", type: "uint8" },
    { name: "target", type: "address" },
    { name: "paymentToken", type: "address" },
    { name: "calldata_", type: "bytes" },
    { name: "replacementPattern", type: "bytes" },
    { name: "staticTarget", type: "address" },
    { name: "staticExtra", type: "bytes" },
    { name: "basePrice", type: "uint256" },
    { name: "endPrice", type: "uint256" },
    { name: "listingTime", type: "uint256" },
    { name: "expirationTime", type: "uint256" },
    { name: "salt", type: "uint256" },
  ];

  const result = await web3.givenProvider.request({
    method: "eth_signTypedData_v4",
    params: [
      account,
      JSON.stringify({
        domain: {
          chainId: CHAIN_ID,
          name: "Wyvern Clone Coding Exchange",
          verifyingContract: EXCHANGE_ADDRESS,
          version: "1",
        },
        message: order,
        primaryType: "Order",
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          Order: orderType,
        },
      }),
    ],
  });

  return result;
};

export const useOrder = () => {
  const { web3, login, account } = useContext(WalletContext);

  const proxyRegistryContract = web3
    ? new web3.eth.Contract(
        proxyRegistryAbi as any,
        PROXY_REGISTRY_CONTRACT_ADDRESS
      )
    : null;

  const exchangeContract = web3
    ? new web3.eth.Contract(exchangeAbi as any, EXCHANGE_ADDRESS)
    : null;

  const checkLogin = useCallback(async () => {
    if (!web3) {
      login();
      return false;
    }

    return true;
  }, [login, web3]);

  const hasProxy = useCallback(async () => {
    if (!web3) {
      login();
      return;
    }

    const result = await getProxyAddress(account);

    return result.data.proxy !== "0x0000000000000000000000000000000000000000";
  }, [web3, login, account]);

  const registerProxy = () => {
    if (!web3) {
      login();
      return;
    }

    return proxyRegistryContract?.methods
      .registerProxy()
      .send({ from: account });
  };

  const isApprovedForAll = async (contract: string) => {
    if (!web3) {
      return login();
    }

    const tokenContract = new web3.eth.Contract(erc721Abi as any, contract);

    const proxyAddress = await proxyRegistryContract?.methods
      .proxies(account)
      .call();

    return await tokenContract.methods
      .isApprovedForAll(account, proxyAddress)
      .call();
  };

  const setApprovalForAll = (contract: string) => {
    if (!web3) {
      return login();
    }

    const tokenContract = new web3.eth.Contract(erc721Abi as any, contract);

    return proxyRegistryContract?.methods
      .proxies(account)
      .call()
      .then((proxyAddress: string) => {
        return tokenContract.methods
          .setApprovalForAll(proxyAddress, true)
          .send({ from: account });
      });
  };

  const sellOrder = async (
    contract: string,
    tokenId: string,
    price: string,
    expirationTime: number
  ) => {
    if (!web3) {
      return login();
    }

    const order = await generateSellOrder({
      maker: account,
      contract,
      tokenId,
      price,
      expirationTime,
    });

    const sig = await signOrder(web3, account, JSON.parse(order.data.raw));
    const sigResult = await verifySellOrder(order.data.id, sig);
  };

  const buyOrder = async (sellOrder: any) => {
    if (!web3) {
      return login();
    }

    const buyOrderResult = await generateBuyOrder({
      orderId: sellOrder.id,
      maker: account,
    });

    const sig = await signOrder(web3, account, buyOrderResult.data);
    const sigResult = await verifyBuyOrder(buyOrderResult.data, sig);

    const price = new BN(buyOrderResult.data.basePrice.replace(/0x0+/, ""), 16);
    const fee = price.divn(40);

    return await exchangeContract?.methods
      .atomicMatch(
        toSolidityOrder(buyOrderResult.data),
        toSoliditySig(sig),
        toSolidityOrder(JSON.parse(sellOrder.raw)),
        toSoliditySig(sellOrder.signature)
      )
      .send({
        from: account,
        value: price.add(fee),
      });
  };

  const hasWETHAllowance = async () => {
    if (!web3) {
      return login();
    }

    const erc20Contract = new web3.eth.Contract(
      erc20Abi as any,
      WETH_CONTRACT_ADDRESS
    );

    const allowance = await erc20Contract.methods
      .allowance(account, EXCHANGE_ADDRESS)
      .call();

    if (allowance === "0") {
      return false;
    }

    return true;
  };

  const approveAllWETH = async () => {
    if (!web3) {
      return login();
    }

    const erc20Contract = new web3.eth.Contract(
      erc20Abi as any,
      WETH_CONTRACT_ADDRESS
    );

    return await erc20Contract.methods
      .approve(
        EXCHANGE_ADDRESS,
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
      .send({ from: account });
  };

  const generateOffer = async (
    contract: string,
    tokenId: string,
    price: string,
    expirationTime: number
  ) => {
    if (!web3) {
      return login();
    }

    const order = await generateOfferOrder({
      maker: account,
      contract,
      tokenId,
      price,
      expirationTime,
    });

    const sig = await signOrder(web3, account, JSON.parse(order.data.raw));
    const sigResult = await verifyOfferOrder(order.data.id, sig);
  };

  const acceptOfferOrder = async (order: any) => {
    if (!web3) {
      return login();
    }

    const offerAcceptResult = await acceptOffer({
      orderId: order.id,
      maker: account,
    });

    const sig = await signOrder(web3, account, offerAcceptResult.data);
    const sigResult = await verifyBuyOrder(offerAcceptResult.data, sig);

    return await exchangeContract?.methods
      .atomicMatch(
        toSolidityOrder(JSON.parse(order.raw)),
        toSoliditySig(order.signature),
        toSolidityOrder(offerAcceptResult.data),
        toSoliditySig(sig)
      )
      .send({ from: account });
  };

  return {
    checkLogin,
    hasProxy,
    registerProxy,
    isApprovedForAll,
    setApprovalForAll,
    sellOrder,
    buyOrder,
    hasWETHAllowance,
    approveAllWETH,
    generateOffer,
    acceptOfferOrder,
  };
};

function toSolidityOrder(order: any) {
  return [
    order.exchange,
    order.maker,
    order.taker,
    order.saleSide,
    order.saleKind,
    order.target,
    order.paymentToken,
    order.calldata_,
    order.replacementPattern,
    order.staticTarget,
    order.staticExtra,
    order.basePrice,
    order.endPrice,
    order.listingTime,
    order.expirationTime,
    order.salt,
  ];
}

function toSoliditySig(sig: string) {
  const sigWithoutPrefix = sig.replaceAll("0x", "");

  return [
    `0x${sigWithoutPrefix.slice(0, 64)}`,
    `0x${sigWithoutPrefix.slice(64, 128)}`,
    `0x${sigWithoutPrefix.slice(128, 130)}`,
  ];
}
