export interface SolidityOrder {
  exchange: string;
  maker: string;
  taker: string;
  saleSide: number;
  saleKind: number;
  target: string;
  paymentToken: string;
  calldata_: string;
  replacementPattern: string;
  staticTarget: string;
  staticExtra: string;
  basePrice: string;
  endPrice: string;
  listingTime: number;
  expirationTime: number;
  salt: string;
}

export interface OrderSig {
  r: string;
  s: string;
  v: string;
}
