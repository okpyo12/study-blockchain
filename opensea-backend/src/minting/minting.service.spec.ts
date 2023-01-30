import { Test, TestingModule } from '@nestjs/testing';
import { MintingService } from './minting.service';

describe('MintingService', () => {
  let service: MintingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MintingService],
    }).compile();

    service = module.get<MintingService>(MintingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
