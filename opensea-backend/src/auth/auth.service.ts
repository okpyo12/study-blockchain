import { AuthRequest } from './../entities/AuthRequest';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';
import { ethers } from 'ethers';
import { User } from 'src/entities';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthRequest)
    private authRequestRepository: Repository<AuthRequest>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async generateAuthRequest(address: string) {
    const authRequest = new AuthRequest();

    authRequest.address = address;
    authRequest.nonce = v4();
    authRequest.expiredAt = new Date(new Date().getTime() + 10 * 60 * 1000);

    return await this.authRequestRepository.save(authRequest);
  }

  generateSignatureMessage(authRequest: AuthRequest) {
    return `Welcome to OpenSea Clone Coding!\n\nWallet Address:\n${authRequest.address}\n\nNonce:\n${authRequest.nonce}`;
  }

  async verifyAuthRequest(id: number, signature: string) {
    const authRequest = await this.authRequestRepository.findOne({
      where: { id, verified: false },
    });

    if (!authRequest) {
      throw new HttpException('auth not found', HttpStatus.BAD_REQUEST);
    }

    if (
      authRequest.expiredAt &&
      authRequest.expiredAt.getTime() < new Date().getTime()
    ) {
      throw new HttpException('expired', HttpStatus.BAD_REQUEST);
    }

    const recoverAddr = ethers.utils.verifyMessage(
      this.generateSignatureMessage(authRequest),
      signature,
    );

    if (
      recoverAddr.replace('0x', '').toLowerCase() !==
      authRequest.address.toLowerCase()
    ) {
      throw new HttpException('invalid', HttpStatus.UNAUTHORIZED);
    }

    authRequest.verified = true;
    await this.authRequestRepository.save(authRequest);

    let user = await this.userRepository.findOne({
      where: { address: authRequest.address },
    });

    if (!user) {
      user = new User();
      user.address = authRequest.address;
      user = await this.userRepository.save(user);
    }

    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        address: user.address,
      }),
    };
  }
}
