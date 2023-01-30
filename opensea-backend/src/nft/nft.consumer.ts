import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Processor, Process } from '@nestjs/bull';
import { Nft, NftContract, NftProperty } from 'src/entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';

@Processor('nft')
export class NftConsumer {
  private readonly logger = new Logger(NftConsumer.name);

  private readonly alchemyEndpoint: string;
  private readonly alchemyApiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @InjectRepository(Nft) private nftRepository: Repository<Nft>,
    @InjectRepository(NftContract)
    private nftContractRepository: Repository<NftContract>,
  ) {
    this.alchemyEndpoint = configService.get('ALCHEMY_ENDPOINT');
    this.alchemyApiKey = configService.get('ALCHEMY_API_KEY');
  }

  @Process('nft-token-load')
  async loadTokenList(job: Job) {
    const contract = await this.nftContractRepository.findOne({
      where: { contractAddress: job.data.contractAddress },
    });

    if (contract.synced) {
      return;
    }

    let startToken = '0';
    let added = 0;

    while (startToken) {
      const result = await firstValueFrom(
        this.httpService.get(
          `/nft/v2/${this.alchemyApiKey}/getNFTsForCollection`,
          {
            baseURL: this.alchemyEndpoint,
            params: {
              contractAddress: job.data.contractAddress,
              withMetadata: true,
              startToken,
            },
          },
        ),
      );

      const nfts = result.data.nfts;
      startToken = result.data.nextToken;

      const nftRows = nfts.map((nft) => {
        const nftRow = new Nft();

        nftRow.tokenId = nft.id.tokenId;
        nftRow.contractAddress = job.data.contractAddress;
        nftRow.description = nft.description;
        nftRow.isLazy = false;
        nftRow.image = nft?.media[0]?.gateway;
        nftRow.properties = nft?.metadata?.attributes.map((attribute) => {
          const property = new NftProperty();
          property.propertyKey = attribute.trait_type;
          property.value = attribute.value;

          return property;
        });

        return nftRow;
      });

      for (const nftRow of nftRows) {
        await this.nftRepository.save(nftRow);
      }

      added += nftRows.length;
      this.logger.log(
        `loading NFTs for contract ${job.data.contractAddress}. (${added}/?)`,
      );
    }

    contract.synced = true;
    await this.nftContractRepository.save(contract);
  }
}
