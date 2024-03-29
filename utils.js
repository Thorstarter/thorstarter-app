import { useState, useEffect } from "react";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  createLCDClient,
  WalletController,
} from "@terra-money/wallet-controller";
import { Coin, Coins, Fee, isTxError } from "@terra-money/terra.js";
import abis from "./abis";

if (global.window) window.ethers = ethers;

export const ADDRESS_ZERO = "0x" + "0".repeat(40);
export const ZERO_BYTES32 = "0x" + "0".repeat(64);

export const parseUnits = ethers.utils.parseUnits;
export const formatUnits = ethers.utils.formatUnits;

export const networkNames = {
  1: "Ethereum",
  3: "Ropsten",
  4: "Rinkeby",
  137: "Polygon",
  250: "Fantom",
  "terra-classic": "Terra",
  "terra-testnet": "Terra (Testnet)",
};

export const terraGasPriceApi = {
  "terra-classic": "https://fcd.terra.dev/v1/txs/gas_prices",
  "terra-testnet": "https://bombay-fcd.terra.dev/v1/txs/gas_prices",
};

export const tcPoolNames = {
  1: "ETH.XRUNE-0X69FA0FEE221AD11012BAB0FDB45D444D3D2CE71C",
  3: "ETH.XRUNE-0X8626DB1A4F9F3E1002EEB9A4F3C6D391436FFC23",
};

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/eth";

let terraWalletSubscription;
let terraWalletController;
if (global.window) {
  try {
    terraWalletController = new WalletController({
      walletConnectChainIds: {
        1: {
          chainID: "columbus-5",
          lcd: "https://lcd.terra.dev",
          mantle: "https://mantle.terra.dev",
          name: "classic",
          walletconnectID: 1,
        },
      },
    });
  } catch (e) {}
}

let listeners = [];
let state = {
  ready: false,
  networkId: 1,
  address: null,
  signer: null,
  provider: new ethers.providers.JsonRpcProvider(rpcUrl),
};

if (global.window) {
  window.getState = () => state;
}

export const contractAddresses = {
  1: {
    xrune: "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c",
    slp: "0x95cfa1f48fad82232772d3b1415ad4393517f3b5",
    staking: "0x93F5Dc8bC383BB5381a67A67516A163d1E56012a",
    voters: "0xEBCD3922A199cd1358277C6458439C13A93531eD",
    dao: "0x5b1b8BdbcC534B17E9f8E03a3308172c7657F4a3",
    votersInvestmentDispenser: "0xc7C525076B21F5be086D77A61E971a0369A77E8D",
    epd: "0xcCe70dfb669832F3263caEa571135D55DC02B0Fa",
    epdOld: "0x8f283547cA7B872F15d50861b1a676a301fC6d42",
    epdOld2: "0x2B9775942ecC36bF4DC449DdB828CF070b3CC71c",
    vid: "0xc7C525076B21F5be086D77A61E971a0369A77E8D",
    vestingDispenser: "0x6A483903AaA40f2543EDb4DbbC071A6B30b1b70a",
    votersTcLpRequester: "0x3fe9995dAEAe2510C1984E8D211d5f4480b26727",
    tiers: "0x817ba0ecafD58460bC215316a7831220BFF11C80",
    twnft: "0x53D917d66EcFec3eF379434b0Ad481E4DdEDcF66",
    tgnft: "0xA98b29A8F5A247802149C268ecf860b8308B7291",
  },
  3: {
    xrune: "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2",
    slp: "0x4fc5a04948935f850ef3504bf69b2672f5b4bdc6",
    staking: "0xD7331af1a928D1bd032e8e162017c2A258824E07",
    voters: "0x9657A3C676479EDE66319a447ed39BAdFb082B61",
    dao: "0x09F267E7A8831b12fEDc695a47EfB8cC57038942",
    votersInvestmentDispenser: "0x6897B1a24b587a49d8F9Bb130C51555b3A0006BA",
    epd: "0xDB0a151FFD93a5F8d29A241f480DABd696DE76BE",
    epdOld: "0xDB0a151FFD93a5F8d29A241f480DABd696DE76BE",
    vid: "0xB46A5c58bB9C2Ed00c212dF8DBb465006641DB75",
    vestingDispenser: "0x73f3BAf35E8076E1ACa143C7fD96721435C813B2",
    votersTcLpRequester: "0xcDb6137F27d579dbe8873116ACd16520D344f381",
    tiers: "0x1190C41f4c47A466F507E28C8fe4cC6aC3E34906",
    twnft: "0x4fc5a04948935f850ef3504bf69b2672f5b4bdc6",
    tgnft: "0x4fc5a04948935f850ef3504bf69b2672f5b4bdc6",
    forge: "0xaA8Bf7F8166fAb6Be431Ef4dF900ef4f9352FB96",
  },
  4: {
    xrune: "0xbd66a8dbe53c4118c27c6c06646bc5a046bcb511",
  },
  250: {
    xrune: "0xe1e6b01ae86ad82b1f1b4eb413b219ac32e17bf6",
    tiersSimple: "0xbc373f851d1EC6aaba27a9d039948D25a6EE8036",
    forge: "0x2D23039c1bA153C6afcF7CaB9ad4570bCbF80F56",
  },
  "terra-classic": {
    xrune: "terra1td743l5k5cmfy7tqq202g7vkmdvq35q48u2jfm",
    tiers: "terra18s7n93ja9nh37mttu66rhtsw05dxrcpsmw0c45",
  },
};

export async function connectWallet() {
  setGlobalState({ walletModalOpen: true });
}

export async function connectWalletEthereum(wallet = "metamask") {
  if (wallet === "walletconnect") {
    const wcProvider = new WalletConnectProvider({
      rpc: {
        1: rpcUrl,
        137: "https://polygon-rpc.com/",
        250: "https://rpc.fantom.network",
      },
    });
    await wcProvider.enable();
    state.provider = new ethers.providers.Web3Provider(wcProvider);
  }
  if (wallet === "metamask") {
    if (!window.ethereum) throw new Error("No ethereum wallet installed!");
    await window.ethereum.request({
      method: "eth_requestAccounts",
      params: [],
    });
    state.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  }

  const signer = state.provider.getSigner();
  const address = await signer.getAddress();
  const networkId = (await state.provider.getNetwork()).chainId;
  setGlobalState({
    walletModalOpen: false,
    ready: true,
    signer,
    address,
    networkId,
  });
  window.localStorage.setItem("connectedWallet", wallet);

  async function updateNetworkAndAddress() {
    const signer = state.provider.getSigner();
    const address = await signer.getAddress();
    const networkId = (await state.provider.getNetwork()).chainId;
    setGlobalState({ signer, address, networkId });
  }
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", updateNetworkAndAddress);
    window.ethereum.on("networkChanged", updateNetworkAndAddress);
  }
}
export async function connectWalletTerra(wallet = "terrastation") {
  await terraWalletController.connect(
    wallet === "terrawalletconnect" ? "WALLETCONNECT" : "EXTENSION"
  );
  terraWalletSubscription = terraWalletController.states().subscribe({
    next: async (value) => {
      console.log("terra wallet state", value);
      if (!value.network || !value.wallets) return;
      const networkId = "terra-" + value.network.name;
      let address = "";
      if (value.wallets && value.wallets[0]) {
        address = value.wallets[0].terraAddress;
      }
      const lcd = createLCDClient({
        network: value.network,
        gasPrices: [new Coin("uusd", 0.15)],
        gasAdjustment: 1.6,
        gas: 750000,
      });
      const gasRes = await (await fetch(terraGasPriceApi[networkId])).json();
      const terraTaxRate = await lcd.treasury.taxRate();
      const terraTaxCapUusd = await lcd.treasury.taxCap("uusd");
      setGlobalState({
        walletModalOpen: false,
        ready: true,
        lcd,
        wc: terraWalletController,
        gasPriceUusd: gasRes.uusd,
        gasPriceLuna: gasRes.uluna,
        terraTaxRate: parseUnits(terraTaxRate.toString(), 18),
        terraTaxCapUusd: parseUnits(terraTaxCapUusd.amount.toString(), 8),
        address,
        networkId,
      });
      window.localStorage.setItem("connectedWallet", wallet);
    },
  });
}

export function disconnectWallet() {
  if (terraWalletSubscription) {
    terraWalletSubscription.unsubscribe();
    terraWalletSubscription = null;
  }
  window.localStorage.setItem("connectedAddress", "");
  setGlobalState({
    networkId: 1,
    address: null,
    signer: null,
    provider: new ethers.providers.JsonRpcProvider(rpcUrl),
  });
}

if (global.window) {
  const wallet = window.localStorage.getItem("connectedWallet");
  if (wallet && wallet.startsWith("terra")) {
    setTimeout(() => connectWalletTerra(wallet), 2500);
  } else {
    connectWalletEthereum(wallet);
  }
}

function buildContracts() {
  const addresses = contractAddresses[state.networkId];
  const contract = (addr, abi) =>
    addr
      ? new ethers.Contract(addr, abi, state.signer || state.provider)
      : null;
  return {
    address: state.address,
    networkId: state.networkId,
    xrune: contract(addresses.xrune, abis.token),
    slp: contract(addresses.slp, abis.token),
    staking: contract(addresses.staking, abis.staking),
    voters: contract(addresses.voters, abis.voters),
    dao: contract(addresses.dao, abis.dao),
    epd: contract(addresses.epd, abis.epd),
    epdOld: contract(addresses.epdOld, abis.epd),
    vid: contract(addresses.vid, abis.vid),
    vestingDispenser: contract(
      addresses.vestingDispenser,
      abis.vestingDispenser
    ),
    votersTcLpRequester: contract(
      addresses.votersTcLpRequester,
      abis.votersTcLpRequester
    ),
    tiers: contract(addresses.tiers, abis.tiers),
    tiersSimple: contract(addresses.tiersSimple, abis.tiersSimple),
    forge: contract(addresses.forge, abis.forge),
    twnft: contract(addresses.twnft, abis.token),
    tgnft: contract(addresses.tgnft, abis.token),
  };
}
let contracts = buildContracts();

export function getContracts() {
  if (
    contracts.address !== state.address ||
    contracts.networkId !== state.networkId
  ) {
    contracts = buildContracts();
  }
  return contracts;
}

export function useGlobalState() {
  const [lastState, setLastState] = useState(state);

  useEffect(() => {
    const handler = () => {
      setLastState(state);
    };
    listeners.push(handler);
    return () => listeners.splice(listeners.indexOf(handler), 1);
  }, []);

  return lastState;
}

export function setGlobalState(newState) {
  state = Object.assign(Object.assign({}, state), newState);
  listeners.forEach((l) => l());
}

export function useCountry() {
  const ipInfo = JSON.parse(
    typeof window !== "undefined"
      ? localStorage.getItem("ipinfo") || "null"
      : "null"
  );
  const [country, setCountry] = useState(ipInfo ? ipInfo.country : "");
  useEffect(() => {
    (async () => {
      if (!ipInfo) {
        const res = await fetch("https://ipinfo.io/?token=ca7efdec9dd655");
        const body = await res.json();
        setCountry(body.country);
        localStorage.setItem("ipinfo", JSON.stringify(body));
      }
    })();
  }, [ipInfo]);
  return country;
}

export function terraTax(amount, taxRate, taxCap) {
  return bnMin(amount.mul(taxRate).div(parseUnits("1", 18)), taxCap);
}

export function dateForBlock(block, currentBlock) {
  return new Date(Date.now() - (currentBlock - block) * 13250);
}

export function formatAddress(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

export function formatDate(dateLike) {
  if (dateLike instanceof ethers.BigNumber) {
    dateLike = dateLike.toNumber() * 1000;
  }
  const d = new Date(dateLike);
  if (d.getTime() === 0) return "N/A";
  const pad = (s) => ("0" + s).slice(-2);
  return [
    d.getFullYear() + "-",
    pad(d.getMonth() + 1) + "-",
    pad(d.getDate()) + " ",
    pad(d.getHours()) + ":",
    pad(d.getMinutes()),
  ].join("");
}

export function formatMDY(dateLike) {
  if (dateLike._isBigNumber) {
    dateLike = dateLike.toNumber() * 1000;
  }
  const d = new Date(dateLike);
  if (d.getTime() === 0) return "N/A";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatNumber(n, decimals = 2, units = 18) {
  if (n instanceof ethers.BigNumber || (n && n._isBigNumber)) {
    n = parseFloat(ethers.utils.formatUnits(n, units));
  }
  n = n || 0;
  n = n.toFixed(decimals);
  if (n.endsWith((0).toFixed(decimals).slice(1))) {
    n = n.split(".")[0];
  }
  let start = n.indexOf(".");
  if (start === -1) start = n.length;
  for (let i = start - 3; i > 0; i -= 3) {
    n = n.slice(0, i) + "," + n.slice(i);
  }
  return n;
}

export function formatErrorMessage(err) {
  if (err.toString().includes("insufficient funds for intrinsic tr")) {
    return "Error: Not enough ETH in this wallet to pay for this transaction";
  }
  return (
    "Error: " +
    (err?.error?.data?.originalError?.message || err.message || err.toString())
  );
}

export async function runTransaction(callPromise, setLoading, setError) {
  try {
    setError("");
    setLoading(t("waitingForConfirmation"));
    const tx = await callPromise;
    setLoading(t("transactionPending"));
    await tx.wait();
  } catch (err) {
    console.error("runTransaction:", err);
    setError(formatErrorMessage(err));
    throw err;
  } finally {
    setLoading("");
  }
}

export async function runTransactionTerra(params, setLoading, setError) {
  try {
    setError("");
    setLoading(t("waitingForConfirmation"));
    params.gasPrices = new Coins([new Coin("uusd", state.gasPriceUusd)]);
    console.log("gas", state.gasPriceUusd);
    params.fee = new Fee(750000, { uusd: "2000000" });
    const result = await state.wc.post(params);
    console.log("result", result);
    if (isTxError(result)) {
      console.error("error", result.code, result.raw_log);
      const error = `Error: ${result.code}: ${result.codespace}`;
      setError(error);
      throw new Error(error);
    }
  } catch (err) {
    console.error("runTransactionTerra:", err, JSON.stringify(err));
    setError(String(err));
    throw err;
  } finally {
    setLoading("");
  }
}

const translations = {
  en: {
    waitingForConfirmation: "Waiting for confirmation...",
    transactionPending: "Transaction pending...",
  },
};

export function t(k) {
  return translations.en[k] || "Missing translation: " + k;
}

export function bn(n) {
  return ethers.BigNumber.from(n);
}

export function bnMin(a, b) {
  return a.gt(b) ? b : a;
}

export function bnMax(a, b) {
  return a.gt(b) ? a : b;
}

export function aprdToApy(rate) {
  return Math.pow(rate + 1, 365) - 1;
}

export function aprde12ToApy(rate) {
  console.log("asd", ethers.utils.formatUnits(rate, 30));
  return aprdToApy(parseFloat(ethers.utils.formatUnits(rate, 30)));
}

export function cannonicalAddress(address) {
  if (address.startsWith("0x")) {
    return ethers.utils.getAddress(address.toLowerCase());
  }
  return address;
}
