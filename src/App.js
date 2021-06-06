import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { providerReq } from "./utils";

import PageProjects from './pages/Projects';
import PageStrategic from './pages/Strategic';
import PageFarm from './pages/Farm';
import PageNotFound from './pages/NotFound';

let ethProvider = new ethers.providers.Web3Provider(window.ethereum);
window.ethProvider = ethProvider;

const chainIds = [
  "bitcoin",
  "bitcoincash",
  "binance",
  "litecoin",
  "thorchain",
];

function isTestnet(provider) {
  return provider?.network?.chainId === 3;
}

function App() {
  const [page, setPage] = useState(
    (window.location.hash || "#").slice(1) || "strategic"
  );
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState();
  const [accounts, setAccounts] = useState({});
  const [provider, setProvider] = useState();

  useEffect(() => {
    window.addEventListener(
      "hashchange",
      () => setPage((window.location.hash || "#").slice(1)),
      false
    );

    document.onreadystatechange = async () => {
      if (document.readyState !== "complete") return;
      if (!window.xfi) {
        setError("Install XDEFI wallet extension");
        return;
      }
      if (!window.xfi?.thorchain) {
        setError("Missing a Thorchain provider in XDEFI");
        return;
      }
      if (!window.ethereum) {
        setError("Missing window.ethereum web3 provider");
        return;
      }
      setNetwork(window.xfi.thorchain.network);
      for (let chainName of chainIds) {
        const provider = window.xfi[chainName];
        provider.on("chainChanged", (obj) => {
          setNetwork(obj.network || obj._network);
        });
        provider.on("accountsChanged", (obj) => {
          //console.log(`accountsChanged: ${chainName}`, obj);
        });
      }
    };
  }, []);

  async function onConnectWallet() {
    try {
      for (let chainName of chainIds) {
        const provider = window.xfi[chainName];
        const accounts = await providerReq(provider, "request_accounts", []);
        setAccounts((a) => ({ ...a, [chainName]: accounts }));
      }
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      const address = await newProvider.getSigner().getAddress();
      setAccounts((a) => ({ ...a, ethereum: [address] }));
      setProvider(newProvider);
    } catch (e) {
      console.error("Error retrieving accounts", e);
      setError("Error retrieving accounts");
    }
  }

  if (!window.location.search.includes("p=correcthorse")) {
    return (
      <div style={{ textAlign: "center", marginTop: "40vh" }}>
        Missing password
      </div>
    );
  }
  return (
    <div>
      <div className="container py-3 px-5 flex items-center">
        <div className="flex-1">
          <img src="./logo-text.svg" width={250} alt="Logo" />
        </div>
        <div className="ml-3">
          <a
            className={`nav-link ${
              page === "strategic" ? "nav-link-active" : ""
            }`}
            href="#strategic"
          >
            Strategic Sale
          </a>
          <a
            className={`nav-link ${
              page === "projects" ? "nav-link-active" : ""
            }`}
            href="#projects"
          >
            Projects
          </a>
          <a
            className={`nav-link ${page === "farm" ? "nav-link-active" : ""}`}
            href="#farm"
          >
            Farm
          </a>
          <a className="nav-link" href="https://docs.thorstarter.org/" target="_blank">
            Docs
          </a>
        </div>
        {isLoading ? (
          <div className="ml-3">
            <div className="loader">Loading...</div>
          </div>
        ) : null}
        {accounts.thorchain && isTestnet(provider) ? (
          <div className="ml-3 p-3 text-yellow-200 bg-yellow-700 rounded">
            Testnet
          </div>
        ) : null}
        {accounts.ethereum && accounts.ethereum.length > 0 ? (
          <div className="ml-3 p-3 bg-gray-800 rounded">
            {accounts.ethereum[0].slice(0, 6) +
              "..." +
              accounts.ethereum[0].slice(-4)}
          </div>
        ) : (
          <button className="button ml-3" onClick={onConnectWallet}>
            Connect wallet
          </button>
        )}
      </div>
      <div className="container">
        {error ? (
          <div className="bg-red-900 text-red-100 rounded p-5 mb-5">
            {error}
          </div>
        ) : null}

        {page === "projects" ? (
          <PageProjects />
        ) : page === "strategic" ? (
          <PageStrategic
            accounts={accounts}
            provider={provider}
            setError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : page === "farm" ? (
          <PageFarm
            provider={provider}
            setError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          <PageNotFound />
        )}
      </div>
    </div>
  );
}

export default App;
