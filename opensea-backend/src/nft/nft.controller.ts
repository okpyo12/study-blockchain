import { NftService } from './nft.service';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { map } from 'rxjs';
import { BigNumber } from 'ethers';

@Controller('nft')
export class NftController {
  constructor(private nftService: NftService) {}

  @Get('/contract/:address')
  async getContractMetadata(@Param() param) {
    const { address } = param;
    return this.nftService.getNftContract(address);
  }

  @Get('/contract/:address/tokens')
  async getNfts(@Param() param, @Query() query) {
    const { address } = param;
    const { startToken } = query;

    return this.nftService.getNfts(address, startToken).pipe(
      map((result) => ({
        result,
        nextToken: this.nftService.getNextToken(result),
      })),
    );
  }

  @Get('/contract/:address/tokens/:tokenId')
  async getOneNft(@Param() param) {
    const { address, tokenId } = param;

    return this.nftService.getNft(address, tokenId);
  }

  @Get('/contract/:address/tokens/:tokenId/history')
  async getNftHistory(@Param() param) {
    const { address, tokenId } = param;

    return this.nftService.getRecentHistory(address).pipe(
      map((history) => {
        return history
          .filter((event) =>
            BigNumber.from(event.erc721TokenId).eq(BigNumber.from(tokenId)),
          )
          .slice(0, 3);
      }),
    );
  }
}
