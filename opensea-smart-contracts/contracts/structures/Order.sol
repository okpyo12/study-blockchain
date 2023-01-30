// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

enum SaleSide {
    BUY,
    SELL
}

enum SaleKind {
    FIXED_PRICE,
    AUCTION
}

struct Order {
    address exchange;
    address maker;
    address taker;
    SaleSide saleSide;
    SaleKind saleKind;
    address target;
    address paymentToken;
    bytes calldata_;
    bytes replacementPattern;
    address staticTarget;
    bytes staticExtra;
    uint256 basePrice;
    uint256 endPrice;
    uint256 listingTime;
    uint256 expirationTime;
    uint256 salt;
}
