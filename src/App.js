import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import {
  BN,
  parseE,
  formatE,
  contracts,
  stakeContractForProvider,
  tokenContractForProvider,
} from "./utils";

const chainIds = [
  "bitcoin",
  "bitcoincash",
  "binance",
  "litecoin",
  "thorchain",
  "binance",
];

function isTestnet(provider) {
  return provider?.network?.chainId === 3;
}

function providerReq(provider, method, params) {
  return new Promise((resolve, reject) => {
    provider.request({ method, params }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

function App() {
  const [page, setPage] = useState(
    (window.location.hash || "#").slice(1) || "projects"
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
      setProvider(new ethers.providers.Web3Provider(window.ethereum));
      for (let chainName of chainIds) {
        const provider = window.xfi[chainName];
        const accounts = await providerReq(provider, "request_accounts", []);
        setAccounts((a) => ({ ...a, [chainName]: accounts }));
      }
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
      <div className="py-3 px-5 flex items-center">
        <div>
          <img src="./logo-text.svg" width={250} alt="Logo" />
        </div>
        <div className="ml-3 flex-1">
          <a className="nav-link" href="https://thorstarter.org/">
            Home
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
        {accounts.thorchain ? (
          <div className="ml-3 p-3 bg-gray-800 rounded">
            {accounts.thorchain[0].slice(0, 8) +
              "..." +
              accounts.thorchain[0].slice(-4)}
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

function PageProjects() {
  return (
    <div>
      <h1 className="mt-0">Projects</h1>
      <div className="bg-gray-800 rounded-xl py-20 text-center text-xl">
        Comming soon...
      </div>
    </div>
  );
}

function PageFarm({ provider, setError, isLoading, setIsLoading }) {
  const [apr, setApr] = useState();
  const [balance, setBalance] = useState();
  const [staked, setStaked] = useState();
  const [reward, setReward] = useState();
  const [value, setValue] = useState("");
  const Stake = useMemo(() => stakeContractForProvider(provider), [
    provider?.network?.chainId,
  ]);
  const Token = useMemo(() => tokenContractForProvider(provider), [
    provider?.network?.chainId,
  ]);

  async function updateStats() {
    const signer = provider.getSigner();

    const blocksPerDay = BN((24 * 60 * 60) / 15);
    const rewardPerDay = (await Stake.rewardPerBlock()).mul(blocksPerDay);
    const totalStaked = await Token.balanceOf(Stake.address);
    setApr(
      rewardPerDay
        .div(totalStaked.add(BN(1)))
        .mul(BN(365))
        .div(BN(100))
        .toString()
    );

    const balance = await Token.balanceOf(signer.getAddress());
    setBalance(formatE(balance));
    const staked = await Stake.balanceOf(signer.getAddress());
    setStaked(formatE(staked));
    const reward = await Stake.pendingReward(signer.getAddress());
    setReward(formatE(reward));
  }

  useEffect(() => {
    if (!provider || !provider.network) return;
    if (!contracts.token[provider.network.chainId]) {
      setError("XRUNE is not deployed to " + provider.network.name + " yet.");
      return;
    }
    updateStats();
    const handle = setInterval(updateStats, 5000);
    return () => clearInterval(handle);
  }, [provider?.network?.chainId]);

  async function onStake() {
    try {
      setError();
      setIsLoading(true);
      await (
        await Token.transferAndCall(Stake.address, parseE(value), 0)
      ).wait();
      await updateStats();
    } catch (e) {
      console.error(e);
      setError("Error staking: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }
  async function onWithdraw() {
    try {
      setError();
      setIsLoading(true);
      await (await Stake.withdraw(parseE(staked))).wait();
      await updateStats();
    } catch (e) {
      console.error(e);
      setError("Error withdrawing: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }
  async function onFarm() {
    try {
      setError();
      setIsLoading(true);
      await (await Stake.farm()).wait();
      await updateStats();
    } catch (e) {
      console.error(e);
      setError("Error collecting: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mt-0 text-center">Farm</h1>
      <div className="text-center mb-5">
        XRUNE Balance: <b>{balance || "-"}</b>
      </div>
      <div className="p-5 bg-gray-800 rounded-xl text-center text-xl">
        <div className="mb-5 font-bold">XRUNE</div>
        <div className="mb-5">APR: {apr || "-"}%</div>
        <div className="flex">
          <div className="flex-1">
            <input
              type="text"
              className="input block w-full mb-3"
              placeholder="0.0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              className="block button w-full mb-3"
              disabled={isLoading}
              onClick={onStake}
              title="Stake an amount of XRUNE"
            >
              Stake
            </button>
          </div>
          <div className="flex-1 ml-3">
            <div className="mb-3" style={{ height: 36 }}>
              Staked: {staked || "-"}
            </div>
            <button
              className="block button w-full mb-3"
              disabled={isLoading}
              onClick={onWithdraw}
              title="Withdraw rewards and total amount staked"
            >
              Withdraw
            </button>
          </div>
          <div className="flex-1 ml-3">
            <div className="mb-3" style={{ height: 36 }}>
              Rewards: {reward || "-"}
            </div>
            <button
              className="block button w-full mb-3"
              disabled={isLoading}
              onClick={onFarm}
              title="Collect pending rewards"
            >
              Collect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageNotFound() {
  return (
    <div className="bg-gray-800 rounded-xl py-20 text-center text-3xl font-bold">
      Page Not Found
    </div>
  );
}

export default App;
