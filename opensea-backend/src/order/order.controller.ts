import { OrderService } from './order.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('/proxy/:address')
  async getProxyAddress(@Param() param) {
    const { address } = param;
    return {
      proxy: await this.orderService.getProxyAddress(address),
    };
  }

  @Get('/sell/:address/:tokenId')
  async getSellOrders(@Param() param) {
    const { address, tokenId } = param;

    return await this.orderService.getSellOrders(address, tokenId);
  }

  @Get('/offer/:address/:tokenId')
  async getOfferOrders(@Param() param) {
    const { address, tokenId } = param;

    return await this.orderService.getOfferOrders(address, tokenId);
  }

  @Post('/sell')
  async generateSellOrder(@Body() body) {
    const { maker, contract, tokenId, price, expirationTime } = body;

    return await this.orderService.generateSellOrder({
      maker,
      contract,
      tokenId,
      price,
      expirationTime,
    });
  }

  @Post('/buy')
  async generateBuyOrder(@Body() body) {
    const { orderId, maker } = body;
    return this.orderService.generateBuyOrderFromFixedPriceSell(orderId, maker);
  }

  @Post('/offer')
  async generateOfferOrder(@Body() body) {
    const { maker, contract, tokenId, price, expirationTime } = body;

    return await this.orderService.generateOfferOrder({
      maker,
      contract,
      tokenId,
      price,
      expirationTime,
    });
  }

  @Post('/offer/verify')
  async verifyOfferOrder(@Body() body) {
    const { orderId, sig } = body;
    return this.orderService.validateOrder(orderId, sig);
  }

  @Post('/offer/accept')
  async acceptOrder(@Body() body) {
    const { orderId, maker } = body;
    return await this.orderService.generateSellOrderFromOffer(orderId, maker);
  }

  @Post('/verify')
  async verifyBuyOrder(@Body() body) {
    const { order, sig } = body;

    try {
      await this.orderService.callVerification(order, sig);
      return true;
    } catch (e) {
      return false;
    }
  }

  @Post('/sell/verify')
  verifySellOrder(@Body() body) {
    const { orderId, sig } = body;
    return this.orderService.validateOrder(orderId, sig);
  }
}
