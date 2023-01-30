import React, { ChangeEvent, useEffect } from "react";

import { Button, TextField, InputAdornment } from "@material-ui/core";
import SwapVerticalCircleIcon from "@material-ui/icons/SwapVerticalCircle";
import {
  calculateSlippage,
  getEthToTokenOutputAmount,
} from "../../functions/swap";
import { OKPYO_ADDRESS } from "../../constants/addresses";
import { fromWei, onEthToTokenSwap, toWei } from "../../utils/ethers";

export function Swap(props: any) {
  const [inputValue, setInputValue] = React.useState("");
  const [outputValue, setOutputValue] = React.useState("");
  const slippage = 200;
  const account = props.account;
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setInputValue(event.target.value);
  };

  async function getOutputAmount() {
    const output = await getEthToTokenOutputAmount(
      inputValue,
      OKPYO_ADDRESS,
      props.network
    );
    const outputWithSlippage = calculateSlippage(slippage, output).minimum;
    setOutputValue(fromWei(outputWithSlippage));
  }

  async function onSwap() {
    onEthToTokenSwap(
      toWei(inputValue),
      toWei(outputValue),
      OKPYO_ADDRESS,
      props.network
    );
  }

  useEffect(() => {
    getOutputAmount();
  }, [inputValue]);

  return (
    <div>
      <div>
        <TextField
          value={inputValue}
          onChange={handleInput}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">ETH</InputAdornment>
            ),
          }}
          variant="standard"
        />
      </div>

      <SwapVerticalCircleIcon />
      <div>
        <TextField
          value={outputValue}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">OKPYO</InputAdornment>
            ),
          }}
          variant="standard"
        />
      </div>

      <Button color="primary" variant="contained" onClick={onSwap}>
        Swap
      </Button>
    </div>
  );
}
