import { Test, TestingModule } from '@nestjs/testing';
import { MintingController } from './minting.controller';

describe('MintingController', () => {
  let controller: MintingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MintingController],
    }).compile();

    controller = module.get<MintingController>(MintingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
