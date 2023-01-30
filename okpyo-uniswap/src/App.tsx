import "./App.css";

import { useWeb3React } from "@web3-react/core";
import { injected } from "./utils/connectors";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar/NavBar";
import { Swap } from "./pages/Swap/Swap";
import { Liquidity } from "./pages/Liquidity/Liquidity";

function App() {
  const { chainId, account, active, activate, deactivate } = useWeb3React();

  function handleConnect() {
    if (active) {
      deactivate();
      return;
    }

    activate(injected, (error) => {
      if (error) {
        alert(error);
      }
    });
  }

  return (
    <div className="App">
      <div>
        <p>Account: {account}</p>
        <p>ChainId: {chainId}</p>
      </div>
      <div>
        <button onClick={handleConnect}>
          {active ? "Disconnect" : "Connect"}
        </button>
      </div>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Swap network={chainId}></Swap>}></Route>
          <Route
            path="/liquidity"
            element={<Liquidity network={chainId}></Liquidity>}
          ></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
