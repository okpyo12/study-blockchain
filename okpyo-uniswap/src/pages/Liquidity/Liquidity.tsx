import { CreateExchange } from "./CreateExchange";

export function Liquidity(props: any) {
  return (
    <div>
      Liquidity
      <CreateExchange network={props.network} />
    </div>
  );
}
