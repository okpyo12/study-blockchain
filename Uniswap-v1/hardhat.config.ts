import "@nomiclabs/hardhat-waffle";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      gas: 10000000,
      gasPrice: 875000000,
    },
    goerli: {
      url: "https://ethereum-goerli-rpc.allthatnode.com/ceFTHNR5to7pbE4cFOUKjYSld7U0RBmk",
      accounts: [""],
    },
  },
};

export default config;
