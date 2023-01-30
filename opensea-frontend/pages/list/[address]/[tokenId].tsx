import styled from "@emotion/styled";
import { Button, Grid } from "@mui/material";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import Web3 from "web3";
import {
  NftHistoryTable,
  NftOfferTable,
  NftTokenInfoBox,
  TopHeader,
} from "../../../components";
import {
  OfferAcceptModal,
  OfferModal,
  SellModal,
} from "../../../components/Modal";
import { WalletContext } from "../../../contexts";
import {
  useNftOffers,
  useNftSellOrders,
  useNftTransferHistory,
  useOneNft,
} from "../../../hooks";
import { useOrder } from "../../../hooks/useOrder";

const TokenDetailPage: NextPage = () => {
  const router = useRouter();
  const { address, tokenId } = router.query;
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAcceptModalOpen, setOfferAcceptModalOpen] = useState(false);
  const { buyOrder } = useOrder();

  const { account } = useContext(WalletContext);

  const { data: nft, refetch: refetchNft } = useOneNft(address, tokenId);
  const { data: history } = useNftTransferHistory(address, tokenId);

  const { data: sellOrders, refetch: refetchSellOrder } = useNftSellOrders(
    address,
    tokenId
  );

  const { data: offers, refetch: refetchOffers } = useNftOffers(
    address,
    tokenId
  );

  const [offer, setOffer] = useState(null);

  const contractName = nft?.contractMetadata.name?.replace(/([A-Z])/g, " $1");

  const isOwner =
    !!account && nft?.owners[0]?.toLowerCase() === account?.toLowerCase();
  const hasSellOrders = (sellOrders ?? []).length > 0;
  const lowestPriceOrder = hasSellOrders ? sellOrders[0] : null;

  useEffect(() => {
    if (!sellModalOpen) {
      refetchSellOrder();
    }
  }, [sellModalOpen, refetchSellOrder]);

  useEffect(() => {
    if (!offerModalOpen) {
      refetchOffers();
    }
  }, [offerModalOpen, refetchOffers]);

  return (
    <div>
      <TopHeader />

      {nft && (
        <Container>
          <MainContainer>
            <Grid container spacing={3}>
              <Grid item xs={5}>
                {nft.media && <TokenImage src={nft.media[0].gateway} />}
                {nft && (
                  <NftTokenInfoBox nft={nft} contractName={contractName} />
                )}
              </Grid>
              <Grid item xs={7}>
                <Link href={`/list/${address}`}>
                  <ContractName>{contractName}</ContractName>
                </Link>

                <TokenId>#{nft.id.tokenId}</TokenId>

                <Owner>
                  Owned by{" "}
                  <a
                    href={`https://etherscan.io/address/${nft.owners[0]}`}
                    target="blank"
                  >
                    <OwnerAddress>{nft.owners[0]}</OwnerAddress>
                  </a>
                </Owner>

                <Section>
                  <SectionTitle>Current Price</SectionTitle>
                  <Price>
                    {hasSellOrders
                      ? `${Web3.utils.fromWei(lowestPriceOrder?.price)} ETH`
                      : "Not on Sale"}
                  </Price>

                  <OrderButtonView>
                    <Grid container spacing={1}>
                      {isOwner && (
                        <Grid item xs={6}>
                          <OrderButton
                            variant="contained"
                            onClick={() => setSellModalOpen(true)}
                          >
                            Sell
                          </OrderButton>
                        </Grid>
                      )}
                      {!isOwner && hasSellOrders && (
                        <Grid item xs={6}>
                          <OrderButton
                            variant="contained"
                            onClick={() =>
                              buyOrder(lowestPriceOrder).then(() => {
                                refetchSellOrder();
                                refetchNft();
                              })
                            }
                          >
                            Buy Now
                          </OrderButton>
                        </Grid>
                      )}
                      {!isOwner && (
                        <Grid item xs={6}>
                          <OrderButton
                            variant="outlined"
                            onClick={() => setOfferModalOpen(true)}
                          >
                            Make Offer
                          </OrderButton>
                        </Grid>
                      )}
                    </Grid>
                  </OrderButtonView>
                </Section>

                <Section>
                  <SectionTitle>Offers</SectionTitle>
                  <NftOfferTable
                    history={offers}
                    isOwner={isOwner}
                    onClick={(offer) => {
                      setOffer(offer);
                      setOfferAcceptModalOpen(true);
                    }}
                  />
                </Section>

                <Section>
                  <SectionTitle>Recent Item Activities</SectionTitle>
                  <NftHistoryTable history={history} />
                </Section>
              </Grid>
            </Grid>
          </MainContainer>
          <SellModal
            open={sellModalOpen}
            setOpen={setSellModalOpen}
            contract={address}
            tokenId={tokenId}
          />
          <OfferModal
            open={offerModalOpen}
            setOpen={setOfferModalOpen}
            contract={address}
            tokenId={tokenId}
          />
          <OfferAcceptModal
            open={offerAcceptModalOpen}
            setOpen={setOfferAcceptModalOpen}
            contract={address}
            tokenId={tokenId}
            offer={offer}
          />
        </Container>
      )}
    </div>
  );
};

const Container = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: center;
`;

const MainContainer = styled.div`
  width: 100%;
  max-width: 1280px;
`;

const TokenImage = styled.img`
  width: 100%;
`;

const ContractName = styled.div`
  color: #0070f3;
  font-size: 18px;
  cursor: pointer;
`;

const TokenId = styled.div`
  margin-top: 16px;
  font-size: 28px;
  font-weight: 700;
`;

const Owner = styled.div`
  margin-top: 12px;
  font-size: 20px;
  font-weight: 600;
`;

const OwnerAddress = styled.span`
  font-size: 0.88em;
  font-weight: 500;
  color: #0070f3;
`;

const Section = styled.div`
  margin-top: 24px;
  border: 1px solid #f0f0f0;
  padding: 24px;
  border-radius: 8px;
`;

const SectionTitle = styled.div`
  font-size: 18px;
  color: #606060;
`;

const Price = styled.div`
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
`;

const OrderButtonView = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-top: 12px;
`;

const OrderButton = styled(Button)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
`;

export default TokenDetailPage;
