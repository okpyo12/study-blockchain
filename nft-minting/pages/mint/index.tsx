import styled from "@emotion/styled";
import { Button } from "@mui/material";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { MenuView, Title } from "../../components";
import { PlanetList } from "../../components/Planet";
import { Web3Context } from "../../contexts";
import { SpaceContext } from "../../contexts/useSpace";
import { usePlanetContract } from "../../hooks";
import BN from "bn.js";

const Mint: NextPage = () => {
  const router = useRouter();
  const { showPlanet, clearPlanet } = useContext(SpaceContext);
  const [planetIndex, setPlanetIndex] = useState(-1);
  const { web3 } = useContext(Web3Context);
  const { mintPlanet } = usePlanetContract(web3);

  const showRandomPlanet = () => {
    setPlanetIndex(Math.floor(Math.random() * PlanetList.length));
  };

  const mint = async () => {
    if (!web3) {
      return;
    }

    const accounts = await web3.eth.requestAccounts();
    const currentAccount = accounts[0];

    mintPlanet({
      from: currentAccount,
      value: web3.utils.toWei(new BN(10), "milliether"),
    }).on("transactionHash", (txHash: string) => {
      router.push(`/mint/${txHash}`);
    });
  };

  useEffect(() => {
    if (planetIndex >= 0) {
      showPlanet(PlanetList[planetIndex]);
    }

    return () => clearPlanet();
  }, [planetIndex, showPlanet, clearPlanet]);

  useEffect(() => {
    const interval = setInterval(() => showRandomPlanet(), 1000);

    showRandomPlanet();

    return () => clearInterval(interval);
  }, []);

  return (
    <MainView>
      <MenuView>
        <Title>Mint your own PLANET!</Title>

        <Description>
          You can mint a planet NFT by paying <b>0.01ETH</b>.
          <br />
          You will get a random planet.
          <br />
          Please press below button to mint!
        </Description>

        <ButtonView>
          <MenuButton variant="contained" size="large" onClick={() => mint()}>
            Mint Planet
          </MenuButton>

          <MenuButton
            variant="outlined"
            size="large"
            onClick={() => router.back()}
          >
            Go Previous
          </MenuButton>
        </ButtonView>
      </MenuView>
    </MainView>
  );
};

const MainView = styled.div`
  margin-top: 100px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Description = styled.div`
  font-size: 16px;
  line-height: 24px;
  font-weight: 100;
  color: #ffffff;
  text-align: center;
`;

const ButtonView = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 24px;
`;

const MenuButton = styled(Button)`
  margin: 4px 0;
`;

export default Mint;
