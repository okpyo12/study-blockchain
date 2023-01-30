import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getContract,
  getNftOfferLists,
  getNfts,
  getNftSellOrders,
  getNftTransferHistory,
  getOneNft,
} from "../api";

export function useNftContract(contractAddress: any) {
  return useQuery(
    ["nft", "contract", contractAddress],
    async () => {
      if (!contractAddress) {
        return {};
      }

      const result = await getContract(contractAddress);

      return result.data;
    },
    {
      retry: false,
    }
  );
}

export function useNfts(contractAddress: any) {
  return useInfiniteQuery(
    ["nft", "contract", contractAddress, "tokens"],
    async ({ pageParam }) => {
      const result = await getNfts(contractAddress, pageParam);

      return result.data;
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextToken;
      },
    }
  );
}

export function useOneNft(contractAddress: any, tokenId: any) {
  return useQuery(
    ["nft", "contract", contractAddress, "tokens", tokenId],
    async () => {
      const result = await getOneNft(contractAddress, tokenId);

      return result.data;
    },
    {
      retry: false,
    }
  );
}

export function useNftTransferHistory(contractAddress: any, tokenId: any) {
  return useQuery(
    ["nft", "contract", contractAddress, "tokens", tokenId, "history"],
    async () => {
      const result = await getNftTransferHistory(contractAddress, tokenId);

      return result.data;
    },
    {
      retry: false,
    }
  );
}

export function useNftSellOrders(contractAddress: any, tokenId: any) {
  return useQuery(
    ["nft", contractAddress, tokenId, "sell-orders"],
    async () => {
      if (!contractAddress || !tokenId) {
        return null;
      }

      const result = await getNftSellOrders(contractAddress, tokenId);
      return result.data;
    },
    {
      retry: false,
    }
  );
}

export function useNftOffers(contractAddress: any, tokenId: any) {
  return useQuery(
    ["nft", contractAddress, tokenId, "offers"],
    async () => {
      if (!contractAddress || !tokenId) {
        return null;
      }

      const result = await getNftOfferLists(contractAddress, tokenId);
      return result.data;
    },
    {
      retry: false,
    }
  );
}
