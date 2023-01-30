import styled from "@emotion/styled";
import { Box, Button, CircularProgress, Modal, TextField } from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import React, { useCallback, useEffect, useState } from "react";
import { useOrder } from "../../hooks/useOrder";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment, { Moment } from "moment";
import Web3 from "web3";
import BN from "bn.js";

interface OfferModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  contract: string;
  tokenId: string;
}

export const OfferModal = ({
  open,
  setOpen,
  contract,
  tokenId,
}: OfferModalProps) => {
  const [status, setStatus] = useState("PENDING");
  const {
    checkLogin,
    hasProxy,
    registerProxy,
    isApprovedForAll,
    setApprovalForAll,
    sellOrder,
    hasWETHAllowance,
    approveAllWETH,
    generateOffer,
  } = useOrder();

  const [price, setPrice] = useState(0);
  const [expirationTime, setExpirationTime] = useState<Moment | null>(
    moment().add(7, "days")
  );

  const updateStatus = useCallback(async () => {
    if (!open || !(await checkLogin())) {
      setStatus("PENDING");
      return;
    }

    if (!(await hasWETHAllowance())) {
      setStatus("APPROVE_WETH");
      return;
    } else {
      setStatus("GENERATE_ORDER");
    }
  }, [checkLogin, hasProxy, isApprovedForAll, contract, open]);

  useEffect(() => {
    if (!open || status === "PENDING") {
      return;
    }

    if (status === "APPROVE_WETH") {
      approveAllWETH()
        .then(() => updateStatus())
        .catch(() => {
          setStatus("PENDING");
          setOpen(false);
        });
    }
  }, [status]);

  useEffect(() => {
    if (open) {
      updateStatus();
    } else {
      setStatus("PENDING");
    }
  }, [open]);

  const generateOfferOrder = () => {
    if (+price < 0) {
      return;
    }

    const hexPrice = new BN(
      Web3.utils.toWei(price.toString(), "ether")
    ).toString(16);

    generateOffer(
      contract,
      tokenId,
      `0x${hexPrice}`,
      expirationTime?.unix() || 0
    ).then(() => setOpen(false));
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-sell-modal"
      aria-describedby="modal-sell-modal"
    >
      <SellModalBox>
        <StatusBox>
          {status === "PENDING" && <CircularProgress />}
          {status === "PROXY_REGISTER" && (
            <>
              <CircularProgress />
              <StatusText>Register Proxy</StatusText>
            </>
          )}

          {status === "APPROVE_WETH" && (
            <>
              <CircularProgress />
              <StatusText>Approve Your WETH to Exchange Contract.</StatusText>
            </>
          )}
          {status === "GENERATE_ORDER" && (
            <>
              <SellBox>
                <ModalTitle>Offer</ModalTitle>
                <TextField
                  required
                  id="price"
                  label="Price (WETH)"
                  type="number"
                  value={price}
                  onChange={(event) => setPrice(+event.target.value)}
                  fullWidth
                />

                <DateTimePickerBox>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DateTimePicker
                      renderInput={(props) => <TextField {...props} />}
                      label="DateTimePicker"
                      value={expirationTime}
                      onChange={(newValue) => {
                        setExpirationTime(newValue);
                      }}
                    />
                  </LocalizationProvider>
                </DateTimePickerBox>

                <Button
                  sx={{ marginTop: 2 }}
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={generateOfferOrder}
                >
                  Generate Offer
                </Button>
              </SellBox>
            </>
          )}
        </StatusBox>
      </SellModalBox>
    </Modal>
  );
};

const SellModalBox = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  background-color: #f0f0f0;
  padding: 48px 24px;
  border-radius: 8px;
`;

const StatusBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusText = styled.div`
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
`;

const SellBox = styled.div`
  width: 100%;
  align-items: center;
`;

const ModalTitle = styled.div`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
`;

const DateTimePickerBox = styled.div`
  margin-top: 24px;
`;
