import { ConfigService } from '@nestjs/config';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Nft, NftContract } from 'src/entities';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { catchError, from, map, mergeMap, of, zip } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BigNumber, ethers } from 'ethers';

@Injectable()
export class NftService {
  private readonly alchemyEndpoint: string;
  private readonly alchemyApiKey: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectRepository(Nft) private nftRepository: Repository<Nft>,
    @InjectRepository(NftContract)
    private nftContractRepository: Repository<NftContract>,
    @InjectQueue('nft') private nftQueue: Queue,
  ) {
    this.alchemyEndpoint = configService.get('ALCHEMY_ENDPOINT');
    this.alchemyApiKey = configService.get('ALCHEMY_API_KEY');
  }

  getNftContract(contractAddress: string) {
    return from(
      this.nftContractRepository.findOne({
        where: {
          contractAddress,
        },
      }),
    ).pipe(
      mergeMap((nftContract) => {
        if (nftContract) {
          return of(nftContract);
        }

        return this.httpService
          .get(`/nft/v2/${this.alchemyApiKey}/getContractMetadata`, {
            baseURL: this.alchemyEndpoint,
            params: {
              contractAddress,
            },
          })
          .pipe(
            catchError(() => {
              throw new HttpException('not NFT contract', HttpStatus.NOT_FOUND);
            }),
            mergeMap((result) => {
              const contractMetadata = result.data.contractMetadata;

              if (contractMetadata.tokenType != 'ERC721') {
                throw new HttpException('not erc721', HttpStatus.NOT_FOUND);
              }

              const nftContract = new NftContract();
              nftContract.contractAddress = contractAddress;
              nftContract.name = contractMetadata.name;
              nftContract.description = contractMetadata.openSea?.description;
              nftContract.symbol = contractMetadata.symbol;
              nftContract.synced = false;
              nftContract.image = contractMetadata.openSea?.imageUrl;
              nftContract.totalSupply = contractMetadata.totalSupply || 0;

              this.nftQueue.add('nft-token-load', { contractAddress });

              return from(this.nftContractRepository.save(nftContract));
            }),
          );
      }),
    );
  }

  getNfts(contractAddress: string, startToken?: string) {
    return this.getNftContract(contractAddress).pipe(
      mergeMap((contract) => {
        if (contract.synced) {
          return this.getNftsFromDB(contractAddress, startToken);
        } else {
          return this.getNftsFromAlchemy(contractAddress, startToken);
        }
      }),
    );
  }

  getNftsFromDB(contractAddress: string, startToken?: string) {
    return from(
      this.nftRepository.find({
        where: {
          tokenId: MoreThanOrEqual(startToken || '0'),
          contractAddress,
        },
        order: {
          tokenId: 'asc',
        },
        take: 100,
      }),
    ).pipe(
      map((nfts) =>
        nfts.map((nft) => ({
          tokenId: nft.tokenId,
          name: nft.name,
          description: nft.description,
          image: nft.image,
        })),
      ),
    );
  }

  getNftsFromAlchemy(contractAddress: string, startToken?: string) {
    return this.httpService
      .get(`/nft/v2/${this.alchemyApiKey}/getNFTsForCollection`, {
        baseURL: this.alchemyEndpoint,
        params: {
          contractAddress,
          withMetadata: true,
          startToken,
        },
      })
      .pipe(
        map((result) => {
          return result.data.nfts.map((nft) => ({
            tokenId: nft.id.tokenId,
            name: nft.title,
            description: nft.description,
            image: nft.media[0]?.gateway,
          }));
        }),
      );
  }

  getNextToken(result) {
    return result.length > 0
      ? ethers.utils.hexZeroPad(
          BigNumber.from(result[result.length - 1].tokenId)
            .add(1)
            .toHexString(),
          32,
        )
      : null;
  }

  getNftMetadta(contractAddress: string, tokenId: string) {
    return this.httpService
      .get(`/nft/v2/${this.alchemyApiKey}/getNFTMetadata`, {
        baseURL: this.alchemyEndpoint,
        params: {
          contractAddress,
          tokenId,
        },
      })
      .pipe(map((result) => result.data));
  }

  getOwnersForToken(contractAddress: string, tokenId: string) {
    return this.httpService
      .get(`/nft/v2/${this.alchemyApiKey}/getOwnersForToken`, {
        baseURL: this.alchemyEndpoint,
        params: {
          contractAddress,
          tokenId,
        },
      })
      .pipe(map((result) => result.data));
  }

  getNft(contractAddress: string, tokenId: string) {
    return zip(
      this.getNftMetadta(contractAddress, tokenId),
      this.getOwnersForToken(contractAddress, tokenId),
    ).pipe(
      map(([nftMetadata, ownersForToken]) => {
        return {
          ...nftMetadata,
          ...ownersForToken,
        };
      }),
    );
  }

  getRecentHistory(contractAddress: string) {
    return this.httpService
      .post(
        `/v2/${this.alchemyApiKey}`,
        {
          id: 1,
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [
            {
              fromBlock: '0x0',
              toBlock: 'latest',
              category: ['ERC721'],
              contractAddresses: [contractAddress],
              withMetadata: false,
              maxCount: '0x3e8',
              order: 'desc',
            },
          ],
        },
        {
          baseURL: this.alchemyEndpoint,
        },
      )
      .pipe(map((result) => result.data?.result?.transfers || []));
  }
}
