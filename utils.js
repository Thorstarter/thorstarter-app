import { useState, useEffect } from "react";
import { ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import abis from "./abis";

if (global.window) window.ethers = ethers;

export const ADDRESS_ZERO = "0x" + "0".repeat(40);
export const ZERO_BYTES32 = "0x" + "0".repeat(64);

export const parseUnits = ethers.utils.parseUnits;

const infuraProjectId = "f9dfccab907d4cc891817733689eaff4";
const rpcUrl = `https://mainnet.infura.io/v3/${infuraProjectId}`;

let listeners = [];
let state = {
  networkId: 1,
  address: null,
  signer: null,
  provider: new ethers.providers.JsonRpcProvider(rpcUrl),
};

if (global.window) {
  window.getState = () => state;
}

let contractAddresses = {
  1: {
    xrune: "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c",
    slp: "0x95cfa1f48fad82232772d3b1415ad4393517f3b5",
    voters: "0xEBCD3922A199cd1358277C6458439C13A93531eD",
    dao: "0x5b1b8BdbcC534B17E9f8E03a3308172c7657F4a3",
    votersInvestmentDispenser: "0xc7C525076B21F5be086D77A61E971a0369A77E8D",
    epd: "0x8f283547cA7B872F15d50861b1a676a301fC6d42",
    epdOld: "0x2B9775942ecC36bF4DC449DdB828CF070b3CC71c",
    vid: "0xc7C525076B21F5be086D77A61E971a0369A77E8D",
    vestingDispenser: "0x6A483903AaA40f2543EDb4DbbC071A6B30b1b70a",
    votersTcLpRequester: "",
  },
  3: {
    xrune: "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2",
    slp: "0x4fc5a04948935f850ef3504bf69b2672f5b4bdc6",
    voters: "0x9657A3C676479EDE66319a447ed39BAdFb082B61",
    dao: "0x09F267E7A8831b12fEDc695a47EfB8cC57038942",
    votersInvestmentDispenser: "0x6897B1a24b587a49d8F9Bb130C51555b3A0006BA",
    epd: "0xDB0a151FFD93a5F8d29A241f480DABd696DE76BE",
    epdOld: "0xDB0a151FFD93a5F8d29A241f480DABd696DE76BE",
    vid: "0xB46A5c58bB9C2Ed00c212dF8DBb465006641DB75",
    vestingDispenser: "0x73f3BAf35E8076E1ACa143C7fD96721435C813B2",
    votersTcLpRequester: "0xcDb6137F27d579dbe8873116ACd16520D344f381",
  },
};

export async function connectWallet() {
  if (!window.ethereum) {
    const wcProvider = new WalletConnectProvider({ infuraId: infuraProjectId });
    await wcProvider.enable();
    state.provider = new ethers.providers.Web3Provider(wcProvider);
  } else {
    await window.ethereum.request({
      method: "eth_requestAccounts",
      params: [],
    });
    state.provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  const signer = state.provider.getSigner();
  const address = await signer.getAddress();
  const networkId = (await state.provider.getNetwork()).chainId;
  setGlobalState({ signer, address, networkId });
  window.localStorage.setItem("connectedAddress", address);

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

if (global.window && window.ethereum) {
  connectWallet();
}

function buildContracts() {
  const addresses = contractAddresses[state.networkId];
  return {
    address: state.address,
    networkId: state.networkId,
    xrune: new ethers.Contract(
      addresses.xrune,
      abis.token,
      state.signer || state.provider
    ),
    slp: new ethers.Contract(
      addresses.slp,
      abis.token,
      state.signer || state.provider
    ),
    voters: new ethers.Contract(
      addresses.voters,
      abis.voters,
      state.signer || state.provider
    ),
    dao: new ethers.Contract(
      addresses.dao,
      abis.dao,
      state.signer || state.provider
    ),
    epd: new ethers.Contract(
      addresses.epd,
      abis.epd,
      state.signer || state.provider
    ),
    epdOld: new ethers.Contract(
      addresses.epdOld,
      abis.epd,
      state.signer || state.provider
    ),
    vid: new ethers.Contract(
      addresses.vid,
      abis.vid,
      state.signer || state.provider
    ),
    vestingDispenser: new ethers.Contract(
      addresses.vestingDispenser,
      abis.vestingDispenser,
      state.signer || state.provider
    ),
    votersTcLpRequester: new ethers.Contract(
      addresses.votersTcLpRequester,
      abis.votersTcLpRequester,
      state.signer || state.provider
    ),
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

export function formatNumber(n, decimals = 2, units = 18) {
  if (n instanceof ethers.BigNumber) {
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
  return (
    "Error: " +
    (err?.error?.data?.originalError?.message || err.message || err.toString())
  );
}

export async function runTransaction(callPromise, setLoading, setError) {
  try {
    const contracts = getContracts();
    setError("");
    setLoading(t("waitingForConfirmation"));
    const tx = await callPromise;
    setLoading(t("transactionPending"));
    await tx.wait();
  } catch (err) {
    console.error("runTransaction:", err);
    setError(formatErrorMessage(err));
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
