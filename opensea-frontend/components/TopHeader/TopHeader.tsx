import styled from "@emotion/styled";
import { Autocomplete, TextField } from "@mui/material";
import Image from "next/image";
import React, { useContext } from "react";
import WalletIcon from "@mui/icons-material/Wallet";
import { WalletContext } from "../../contexts";
import Link from "next/link";
import { useRouter } from "next/router";

export const TopHeader = () => {
  const { login } = useContext(WalletContext);

  const router = useRouter();

  const onKeyDown = (e: any) => {
    if (
      e.code === "Enter" &&
      /^(0x)?[\wa-zA-Z]{40}$/.test(e.target.value || "")
    ) {
      router.push(`/list/${e.target.value}`);
    }
  };

  return (
    <TopHeaderView>
      <Link href="/">
        <Logo>
          <Image src="/opensea.svg" width={40} height={40} />
          <Title>OpenSea</Title>
        </Logo>
      </Link>

      <SearchView>
        <Autocomplete
          renderInput={(params) => (
            <TextField
              {...params}
              label={"Search items, collections, and accounts"}
              onKeyDown={onKeyDown}
            />
          )}
          options={[]}
        />
      </SearchView>

      <MenuView>
        <Menu>Explore</Menu>
        <Link href="/create">
          <Menu>Create</Menu>
        </Link>
      </MenuView>

      <IconView onClick={login}>
        <WalletIcon />
      </IconView>
    </TopHeaderView>
  );
};

const TopHeaderView = styled.div`
  padding: 16px 32px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
`;

const Title = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-left: 8px;
`;

const SearchView = styled.div`
  flex: 1;
  margin-left: 64px;
`;

const MenuView = styled.div`
  display: flex;
  flex-direction: row;
  margin-left: 64px;
`;

const Menu = styled.div`
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
`;

const IconView = styled.div`
  margin-left: 32px;
`;
