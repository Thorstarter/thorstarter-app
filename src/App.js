import { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import {
  BN,
  parseE,
  formatE,
  contracts,
  contractForProvider,
  thorchainDeposit
} from "./utils";

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

function providerReq(provider, method, params) {
  return new Promise((resolve, reject) => {
    provider.request({ method, params }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

function thornodeReq(path) {
  const prefix = window.xfi?.thorchain?.network === 'testnet' ? 'testnet.' : '';
  const thornodeApi = `https://${prefix}thornode.thorchain.info`;
  return fetch(thornodeApi + path)
    .then(res => { if (res.status !== 200) throw new Error('Status code: '+res.status); return res; })
    .then(res => res.json());
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

function PageProjects() {
  return (
    <div>
      <h1 className="mt-0">Projects</h1>
      <div className="border border-primary-500 text-primary-500 py-20 text-center text-xl">
        Comming soon...
      </div>
    </div>
  );
}

function PageStrategic({ accounts, provider, setError, isLoading, setIsLoading }) {
  const [balance, setBalance] = useState("");
  const [value, setValue] = useState("");
  const [txHash, setTxHash] = useState("");
  const memoArgs = [provider?.network?.chainId];
  const Faucet = useMemo(() => contractForProvider(provider, 'faucet'), memoArgs);

  function fetchBalance() {
    thornodeReq(`/cosmos/bank/v1beta1/balances/${accounts.thorchain[0]}`)
      .then(res => res.balances.find(v => v.denom === 'rune').amount)
      .then(balance => setBalance((parseInt(balance)/Math.pow(10, 8)).toFixed(2)))
      .catch(err => console.error(err));
  }

  useEffect(() => {
    if (!accounts.thorchain || accounts.thorchain.length === 0) return;
    fetchBalance();
  }, [accounts.thorchain ? accounts.thorchain[0] : null]);

  async function onStart() {
    if (!provider || !provider.network) return setError('Connect wallet first');
    if (Number.isNaN(parseFloat(value))) return setError('Amount entered is not a number');
    if (!accounts.thorchain || accounts.thorchain.length === 0) return setError('Missing thorchain address');
    if (!accounts.ethereum || accounts.ethereum.length === 0) return setError('Missing ethereum address');
    try {
      setError();
      setIsLoading(true);
      const vaultAddress = await thornodeReq(`/thorchain/inbound_addresses`)
        .then(vaults => vaults.find(v => v.chain === 'ETH').address);
      const thorchainAddress = accounts.thorchain[0];
      await Faucet.start(vaultAddress, thorchainAddress);
      const memo = 'ADD:ETH.XRUNE-'+contracts.token[provider.network.chainId]+':'+accounts.ethereum[0];
      const txHash = await thorchainDeposit({ from: thorchainAddress, memo: memo, amount: value });
      setTxHash(txHash);
      setValue('');
      fetchBalance();
    } catch (e) {
      console.error(e);
      setError("Error withdrawing: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center mb-5">
        <h1 className="mt-0 mb-0 flex-1">Strategic Sale</h1>
        <div className="">
          RUNE Balance: <b>{balance || "-"}</b>
        </div>
      </div>
    {!txHash ? (
      <div className="p-5 border border-primary-500 text-center text-xl">
        <div className="mb-5 font-bold">Become an XRUNE LP on Thorchain</div>
        <p>In order to let Thorchain users take part in Thorstarter's strategic
          sale using their RUNE we've setup this page which will give you 1 XRUNE
          pair it with however many RUNE you want and make you an LP.</p>
        <p>After using the form below to become an LP feel free to manage your
          liquidity using any of the Thorchain UIs like Thorswap, Asgardex or Vanaheimex</p>
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
          onClick={onStart}
        >
          Deposit into XRUNE-RUNE Pool
        </button>
      </div>
    ): (
      <div className="p-5 border border-primary-500 text-center text-xl">
        <div className="mb-5 font-bold">Congratulations!</div>
        <p>You're now an XRUNE LP! To view your transaction in the explorer follow this&nbsp;
          <a href={`https://${window.xfi.thorchain.network === 'testnet' ? 'testnet.' : ''}thorchain.net/#/txs/${txHash}`} target="_blank">link</a></p>
      </div>
    )}
    </div>
  );
}

function PageFarm({ provider, setError, isLoading, setIsLoading }) {
  const [apr, setApr] = useState();
  const [balance, setBalance] = useState();
  const [staked, setStaked] = useState();
  const [reward, setReward] = useState();
  const [value, setValue] = useState("");
  const memoArgs = [ provider?.network?.chainId ];
  const Staking = useMemo(() => contractForProvider(provider, 'staking'), memoArgs);
  const Token = useMemo(() => contractForProvider(provider, 'token'), memoArgs);

  async function updateStats() {
    const signer = provider.getSigner();

    const blocksPerDay = BN((24 * 60 * 60) / 15);
    const rewardPerDay = (await Staking.rewardPerBlock()).mul(blocksPerDay);
    const totalStaked = await Token.balanceOf(Staking.address);
    setApr(
      rewardPerDay
        .div(totalStaked.add(BN(1)))
        .mul(BN(365))
        .div(BN(100))
        .toString()
    );

    const balance = await Token.balanceOf(signer.getAddress());
    setBalance(formatE(balance));
    try {
      const staked = (await Staking.userInfo(0, signer.getAddress()))[0];
      setStaked(formatE(staked));
      const reward = await Staking.pendingRewards(0, signer.getAddress());
      setReward(formatE(reward));
    } catch (err) {
      console.error(err);
    }
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
    if (!provider || !provider.network) return setError('Connect wallet first');
    try {
      setError();
      setIsLoading(true);
      await (
        await Token.transferAndCall(Staking.address, parseE(value), 0)
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
    if (!provider || !provider.network) return setError('Connect wallet first');
    try {
      setError();
      setIsLoading(true);
      const address = provider.getSigner().getAddress();
      await (await Staking.withdrawAndHarvest(0, parseE(staked), address)).wait();
      await updateStats();
    } catch (e) {
      console.error(e);
      setError("Error withdrawing: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }
  async function onFarm() {
    if (!provider || !provider.network) return setError('Connect wallet first');
    try {
      setError();
      setIsLoading(true);
      const address = provider.getSigner().getAddress();
      await (await Staking.harvest(0, address)).wait();
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
      <div className="flex items-center mb-5">
        <h1 className="mt-0 mb-0 flex-1">Farm</h1>
        <div className="">
          XRUNE Balance: <b>{balance || "-"}</b>
        </div>
      </div>
      <div className="p-5 border border-primary-500 text-center text-xl">
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
