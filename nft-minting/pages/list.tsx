import styled from "@emotion/styled";
import { Button } from "@mui/material";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { MenuView, Metadata, Title } from "../components";
import { SpaceContext, Web3Context } from "../contexts";
import { usePlanetContract } from "../hooks";

const List: NextPage = () => {
  const { web3 } = useContext(Web3Context);
  const { totalSupply, tokenURI, ownerOf } = usePlanetContract(web3);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [numOfTokens, setNumOfTokens] = useState(-1);
  const [owner, setOwner] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [metadata, setMetadata] = useState<any>();

  const { showPlanet, clearPlanet } = useContext(SpaceContext);

  const router = useRouter();

  useEffect(() => {
    web3?.eth.net.getId().then((v) => console.log(v));

    if (web3) {
      (async () => {
        const total = await totalSupply();
        setNumOfTokens(+total);

        if (currentIndex < numOfTokens) {
          const tokenId = web3.utils.numberToHex(currentIndex);
          const uri = await tokenURI(tokenId);
          const owner = await ownerOf(tokenId);

          setOwner(owner);
          setMetadataURI(uri);
        }
      })();
    }
  }, [web3, currentIndex, numOfTokens, ownerOf, tokenURI, totalSupply]);

  useEffect(() => {
    if (metadataURI) {
      (async () => {
        const metadataQuery = await fetch(metadataURI);
        const metadata = await metadataQuery.json();

        setMetadata(metadata);
      })();
    }
  }, [metadataURI]);

  useEffect(() => {
    if (metadata && metadata.planetType) {
      showPlanet(metadata.planetType);
    }

    return () => clearPlanet();
  }, [metadata, showPlanet, clearPlanet]);

  const onNext = () => {
    if (currentIndex < numOfTokens - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const onPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <ListView>
      <DownMenuView>
        <Title>Planet #{currentIndex}</Title>
        {metadata && (
          <Metadata owner={owner} properties={metadata.attributes} />
        )}

        <SwitchView>
          <Button
            variant="contained"
            size="large"
            onClick={onPrev}
            disabled={currentIndex === 0}
          >
            Prev
          </Button>
          {numOfTokens > 0 && (
            <Counter>
              {currentIndex + 1} / {numOfTokens}
            </Counter>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={onNext}
            disabled={currentIndex === numOfTokens - 1}
          >
            Next
          </Button>
        </SwitchView>
        <GoBackButton onClick={() => router.back()}>Go Previous</GoBackButton>
      </DownMenuView>
    </ListView>
  );
};

const ListView = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const DownMenuView = styled(MenuView)`
  margin-top: 320px;
`;

const SwitchView = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Counter = styled.div`
  flex: 1;
  text-align: center;
  color: #fff;
  font-size: 20px;
`;

const GoBackButton = styled(Button)`
  margin-top: 8px;
`;

export default List;
