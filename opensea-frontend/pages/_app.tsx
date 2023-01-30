import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WalletContextProvider } from "../contexts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={client}>
      <WalletContextProvider>
        <Component {...pageProps} />
      </WalletContextProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
