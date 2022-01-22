import { useState, useEffect } from "react";
import { MsgExecuteContract, Fee, Coin } from "@terra-money/terra.js";
import Image from "next/image";
import Icon from "../components/icon";
import Button from "../components/button";
import Layout from "../components/layout";
import Countdown from "../components/countdown";
import LoadingOverlay from "../components/loadingOverlay";
import {
  bnMin,
  useGlobalState,
  formatNumber,
  parseUnits,
  formatUnits,
  runTransaction,
  runTransactionTerra,
} from "../utils";
import abis from "../abis";
import allocationData from "../data/allocations.json";

import logoSkyrim from "../public/ido/skyrim-logo.png";
import coverSkyrim from "../public/ido/skyrim-cover.png";
import logoBnpl from "../public/ido/bnpl-logo.png";
import coverBnpl from "../public/ido/bnpl-cover.png";
import logoThorswap from "../public/ido/thorswap-logo.png";
import coverThorswap from "../public/ido/thorswap-cover.png";
import logoThorwallet from "../public/ido/thorwallet-logo.png";
import coverThorwallet from "../public/ido/thorwallet-cover.png";
import logoMine from "../public/ido/mine-logo.png";
import coverMine from "../public/ido/mine-cover.png";
import logoLuart from "../public/ido/luart-logo.png";
import coverLuart from "../public/ido/luart-cover.png";
import logoOnering from "../public/ido/onering-logo.png";
import coverOnering from "../public/ido/onering-cover.png";

const liveIdo = {
  name: "OneRing",
  token: "RING",
  paymentToken: "USDC",
  type: "tiers",
  networkId: 250,
  address: "0xFfA332907C6b9ff7c6Bf0011a894c10f1d0011dD",
  notFinalized: true,
  paymentPrice: 1,
  paymentTokenAddress: "0x04068da6c83afcfa0e13ba15a6696662335d5b75",
  paymentDecimals: 6,
  paymentDecimalsShown: 2,
  allocations: allocationData.ring,
  logo: logoOnering,
  cover: coverOnering,
  links: {
    twitter: "https://twitter.com/Onering_Finance",
    telegram: "https://t.me/OneRing_Finance",
    medium: "https://onering-finance.medium.com/",
    website: "https://www.onering.finance/",
    discord: "https://discord.com/invite/oneringfinance",
  },
  static: [
    { label: "Offering", value: "800,000 RING" },
    { label: "Raising", value: "400,000 USDC" },
    { label: "Sold %", value: "100%" },
    { label: "Price", value: "0.50 USDC" },
  ],
};

const idos = [
  {
    name: "Luart",
    token: "LUART",
    paymentToken: "UST",
    type: "tiers-terra",
    networkId: "terra-mainnet",
    address: "terra10f7w8d5kdzwhlclyk73j887ws8r35972kgzusx",
    notFinalized: true,
    paymentPrice: 1,
    allocations: allocationData.luart,
    logo: logoLuart,
    cover: coverLuart,
    links: {
      twitter: "https://twitter.com/luart_io",
      telegram: "https://t.me/luart_io",
      medium: "https://luart-io.medium.com/",
      website: "https://www.luart.io/",
      discord: "https://discord.com/invite/luart",
    },
    static: [
      { label: "Offering", value: "20,000,000 LUART" },
      { label: "Raising", value: "500,000 UST" },
      { label: "Sold %", value: "100%" },
      { label: "Price", value: "0.025 UST" },
    ],
  },
  {
    name: "MINE Network",
    token: "MNET",
    paymentToken: "ETH",
    type: "tiers",
    networkId: 1,
    address: "0xd7a7Bcf3b166E89e8c7d4EEf54F976854E44612B",
    paymentPrice: 4200,
    allocations: allocationData.mnet,
    logo: logoMine,
    cover: coverMine,
    links: {
      twitter: "https://twitter.com/mine_blockchain",
      telegram: "https://t.me/mine_blockchain",
      medium: "https://mineblockchain.medium.com/",
      website: "https://www.mine.network/",
      docs: "https://docsend.com/view/d9jijm9qqvbavcen",
    },
    static: [
      { label: "Offering", value: "15,000,000 MNET" },
      { label: "Raising", value: "35.71 ETH" },
      { label: "Claimed %", value: "100%" },
      { label: "Price", value: "0.00000238 ETH $ 0.01" },
    ],
  },
  {
    name: "THORWallet",
    token: "TGT",
    paymentToken: "XRUNE",
    type: "fcfs",
    networkId: 1,
    address: "0xd980a5fb418E2127573a001147B4EAdFE283c817",
    xrunePrice: 0.55,
    tiersDuration: 7200,
    notFinalized: false,
    logo: logoThorwallet,
    cover: coverThorwallet,
    links: {
      twitter: "https://twitter.com/ThorWallet",
      telegram: "https://t.me/THORWalletOfficial",
      medium: "https://thorwallet.medium.com/",
      website: "https://thorwallet.org/",
      docs: "https://thorwallet.org/wp-content/uploads/2021/10/Thorwallet-Pitch_v1.9.pdf",
    },
    static: [
      { label: "Offering", value: "20,000,000 TGT" },
      { label: "Raising", value: "909,091 XRUNE" },
      { label: "Committed %", value: "100%" },
      { label: "Committed $", value: "$ 500,000" },
      { label: "Committed XRUNE", value: "909,091 / 909,091" },
      { label: "Price", value: "0.05 XRUNE $ 0.025" },
    ],
  },
  {
    name: "THORSwap",
    token: "THOR",
    paymentToken: "XRUNE",
    type: "batch",
    networkId: 1,
    address: "0xbe50283a23cf952E78272d41ADcF7ffAd711b637",
    xrunePrice: 0.5,
    price: parseUnits("0.15"),
    logo: logoThorswap,
    cover: coverThorswap,
    links: {
      twitter: "https://twitter.com/thorswap",
      telegram: "https://t.me/thorswap_ann",
      medium: "https://thorswap.medium.com/",
      website: "https://thorswap.finance/",
      docs: "https://docs.thorchain.org/",
      discord: "https://discord.gg/thorswap",
    },
    static: [
      { label: "Offering", value: "10,000,000 THOR" },
      { label: "Raising", value: "1,500,000 XRUNE" },
      { label: "Committed %", value: "198%" },
      { label: "Committed $", value: "$ 1,489,220.89" },
      { label: "Committed XRUNE", value: "2,978,442 / 1,500,000" },
      { label: "Price", value: "0.15 XRUNE $ 0.075" },
    ],
  },
  {
    name: "BNPL Pay",
    token: "BNPL",
    paymentToken: "XRUNE",
    type: "batch",
    networkId: 1,
    address: "0x1a4d12Ab7033483bEEf93b9faCDB818c0f039271",
    xrunePrice: 0.2,
    price: parseUnits("0.2"),
    logo: logoBnpl,
    cover: coverBnpl,
    links: {
      twitter: "https://twitter.com/bnplpay",
      telegram: "https://t.me/bnplpay",
      medium: "https://medium.com/bnplpay",
      website: "https://bnplpay.io/",
      docs: "https://bnplpay.io/file/BNPL%20Pay-Whitepaper%201.2.pdf",
      about: "https://thorstarter.org/ido/bnpl",
    },
    static: [
      { label: "Offering", value: "5,000,000 BNPL" },
      { label: "Raising", value: "1,000,000 XRUNE" },
      { label: "Committed %", value: "806%" },
      { label: "Committed $", value: "$ 1,613,930.64" },
      { label: "Committed XRUNE", value: "8,069,653 / 1,000,000" },
      { label: "Price", value: "0.20 XRUNE $ 0.040" },
    ],
  },
  {
    name: "Skyrim Finance",
    token: "SKYRIM",
    paymentToken: "XRUNE",
    type: "dutch",
    networkId: 1,
    address: "0x9Aa3f4295431e6640f1D2ef50944BAe6cC5123D8",
    xrunePrice: 0.5,
    price: parseUnits("1.23164843"),
    logo: logoSkyrim,
    cover: coverSkyrim,
    links: {
      twitter: "https://twitter.com/SkyrimFinance",
      telegram: "https://t.me/skyrimfinance",
      medium: "https://medium.com/@skyrimfinance",
      website: "https://skyrim.finance/",
      docs: "https://docs.skyrim.finance/",
      about: "https://thorstarter.org/ido/skyrim",
    },
    static: [
      { label: "Offering", value: "5,000,000 SKYRIM" },
      { label: "Start Price", value: "2 XRUNE $ 1" },
      { label: "Reserve Price", value: "0.20 XRUNE $ 0.10" },
      { label: "Committed $", value: "$ 3,079,116.21" },
      { label: "Committed XRUNE", value: "6,158,232" },
      { label: "Price", value: "1.23 XRUNE $ 0.61" },
    ],
  },
];

export default function IDOs() {
  const state = useGlobalState();
  const [liveIdoParams, setLiveIdoParams] = useState(null);
  const previousIDOs = idos;

  return (
    <Layout title="IDOs" page="idos">
      {liveIdo && liveIdo.networkId === state.networkId ? (
        <>
          <h1 className="live-ido-title title clear">
            {liveIdo.name} IDO
            {liveIdoParams &&
            liveIdoParams.timestamp < liveIdoParams.start.getTime() / 1000 ? (
              <div className="flex float-right">
                <span>Starts in </span>
                <Countdown
                  to={liveIdoParams.start}
                  zeroText="Waiting for next block..."
                />
              </div>
            ) : liveIdoParams && Date.now() < liveIdoParams.end.getTime() ? (
              <div className="flex float-right">
                <span>Allocations Round Ends / FCFS Round Starts in </span>
                <Countdown to={liveIdoParams.end} />
              </div>
            ) : liveIdoParams &&
              !liveIdoParams.raising.eq(liveIdoParams.comitted) ? (
              <div className="flex float-right">
                <span>FCFS Ongoing</span>
              </div>
            ) : null}
          </h1>
          <div className="live-ido flex">
            <div className="live-ido-card">
              <IDOCard ido={liveIdo} parentSetParams={setLiveIdoParams} />
            </div>
            <div
              className="live-ido-info flex-1 flex flex-column"
              style={{ backgroundImage: `url(${liveIdo.cover.src})` }}
            >
              <div className="live-ido-info-logo flex-1">
                <Image
                  src={liveIdo.logo}
                  height={60}
                  width={(60 * liveIdo.logo.width) / liveIdo.logo.height}
                  alt={liveIdo.name}
                />
              </div>
              <div>
                <h1 className="title mb-0">{liveIdo.name}</h1>
                <div className="live-ido-info-links">
                  <a
                    href={liveIdo.links.website}
                    target="_blank"
                    rel="noreferrer reopener"
                  >
                    <Icon name="link" /> <span>Website</span>
                  </a>
                  <a
                    href={liveIdo.links.docs}
                    target="_blank"
                    rel="noreferrer reopener"
                  >
                    <Icon name="docs" /> <span>Whitepaper</span>
                  </a>
                  <a
                    href={liveIdo.links.twitter}
                    target="_blank"
                    rel="noreferrer reopener"
                  >
                    <Icon name="twitter" />
                  </a>
                  <a
                    href={liveIdo.links.telegram}
                    target="_blank"
                    rel="noreferrer reopener"
                  >
                    <Icon name="telegram" />
                  </a>
                  {liveIdo.links.discord ? (
                    <a
                      href={liveIdo.links.discord}
                      target="_blank"
                      rel="noreferrer reopener"
                    >
                      <Icon name="discord" />
                    </a>
                  ) : null}
                  <a
                    href={liveIdo.links.medium}
                    target="_blank"
                    rel="noreferrer reopener"
                  >
                    <Icon name="medium" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
      <br />
      <h1 className="title">
        Previous IDOs
        <a
          href="https://thorstarter.org/#upcoming-projects"
          target="_blank"
          rel="noopener noreferrer"
          className="button button-outline float-right"
        >
          Upcoming IDOs
        </a>
      </h1>
      {previousIDOs.length === 0 ? "No previous IDOs... yet..." : null}
      <div className="ido-list">
        {previousIDOs.map((ido) => (
          <IDOCardStatic ido={ido} key={ido.name} />
        ))}
      </div>
      <div className="footer-buttons text-center py-16">
        <a
          href="https://thorstarter.substack.com/"
          className="button button-lg mr-4"
          target="_blank"
          rel="noreferrer reopener"
        >
          Get Alerts For New IDOs
        </a>
        <a
          href="https://thorstarter.org/apply/"
          className="button button-lg"
          target="_blank"
          rel="noreferrer reopener"
        >
          Apply for IDO
        </a>
      </div>
    </Layout>
  );
}

function IDOCardStatic({ ido }) {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  function getSaleContract() {
    const abi = {
      fcfs: abis.saleFcfs,
      batch: abis.saleBatch,
      dutch: abis.saleDutch,
      tiers: abis.saleTiers,
    }[ido.type];
    return new ethers.Contract(
      ido.address,
      abi,
      state.signer || state.provider
    );
  }

  async function fetchData() {
    if (!state.address) return;
    if (state.networkId !== ido.networkId) return;
    if (ido.type === "tiers-terra") {
      const userState = await state.lcd.wasm.contractQuery(ido.address, {
        user_state: { user: state.address, now: (Date.now() / 1000) | 0 },
      });
      const claimed = parseUnits(userState.claimed, 12);
      const owed = parseUnits(userState.owed, 12);
      setUserInfo({
        amount: parseUnits(userState.amount, 12),
        claimedTokens: owed.sub(claimed).eq("0"),
        claimable: parseUnits(userState.claimable, 12).sub(claimed),
        claimed,
        owed,
      });
    } else if (ido.type === "tiers") {
      const sale = getSaleContract();
      const userInfo = await sale.getUserInfo(state.address);
      setUserInfo({
        amount: userInfo[0],
        claimedTokens: userInfo[3].sub(userInfo[1]).eq("0"),
        claimable: userInfo[3],
        claimed: userInfo[1],
        owed: userInfo[2],
      });
    } else if (ido.type === "batch") {
      const sale = getSaleContract();
      const userInfo = await sale.userInfo(state.address);
      setUserInfo({
        amount: userInfo[0],
        claimedTokens: userInfo[2],
        claimedRefund: userInfo[1],
        owed: await sale.getOfferingAmount(state.address),
        refund: await sale.getRefundingAmount(state.address),
      });
    } else if (ido.type === "fcfs") {
      const sale = getSaleContract();
      const userInfo = await sale.userInfo(state.address);
      setUserInfo({
        amount: userInfo[0],
        claimedTokens: userInfo[1],
        owed: await sale.getOfferingAmount(state.address),
      });
    } else if (ido.type === "dutch") {
      const sale = getSaleContract();
      const userInfo = await sale.userInfo(state.address);
      setUserInfo({
        amount: userInfo[0],
        claimedTokens: userInfo[1],
        owed: userInfo[0].mul(parseUnits("1")).div(ido.price),
      });
    }
  }

  useEffect(() => {
    fetchData();
  }, [state.networkId, state.address]);

  async function callSaleMethod(method, ...args) {
    const sale = getSaleContract();
    const call = sale[method](...args);
    await runTransaction(call, setLoading, setError);
    fetchData();
  }

  async function onHarvest() {
    if (ido.type === "tiers-terra") {
      try {
        await runTransactionTerra(
          {
            msgs: [
              new MsgExecuteContract(state.address, ido.address, {
                harvest: {},
              }),
            ],
          },
          setLoading,
          setError
        );
      } catch (e) {
        console.log("err", e);
      }
      fetchData();
      setTimeout(fetchData, 5000);
      setTimeout(fetchData, 10000);
      setTimeout(fetchData, 20000);
    } else if (ido.type == "fcfs") {
      callSaleMethod("harvest", false);
    } else if (ido.type === "batch") {
      callSaleMethod("harvestTokens");
    } else if (ido.type === "dutch") {
      callSaleMethod("harvestTokens");
    } else {
      callSaleMethod("harvest");
    }
  }

  return (
    <div className="ido">
      <div className="flex-1">
        <IDOHeader ido={ido} />
        {ido.static.map((v) => (
          <div className="flex mb-3" key={v.label}>
            <div className="flex-1 text-gray6">{v.label}</div>
            <div>{v.value}</div>
          </div>
        ))}
        <div className="progress mb-4">
          <div className="progress-bar" style={{ width: "100%" }}></div>
        </div>
        {userInfo && userInfo.amount.gt("0") ? (
          <>
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">Deposited</div>
              <div>
                {formatNumber(
                  userInfo.amount,
                  ido.paymentDecimalsShown,
                  ido.paymentDecimals
                )}{" "}
                <span className="text-gray6">{ido.paymentToken}</span>
              </div>
            </div>
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">
                {userInfo.claimed
                  ? "Total Owed"
                  : userInfo.claimedTokens
                  ? "Collected"
                  : "Owed"}
              </div>
              <div>
                {formatNumber(userInfo.owed)}{" "}
                <span className="text-gray6">{ido.token}</span>
              </div>
            </div>
            {userInfo.claimed ? (
              <div className="flex mt-3">
                <div className="flex-1 text-gray6">Collected</div>
                <div>
                  {formatNumber(userInfo.claimed)}{" "}
                  <span className="text-gray6">{ido.token}</span>
                </div>
              </div>
            ) : null}
            {userInfo.claimable ? (
              <div className="flex mt-3">
                <div className="flex-1 text-gray6">Vested</div>
                <div>
                  {formatNumber(userInfo.claimable)}{" "}
                  <span className="text-gray6">{ido.token}</span>
                </div>
              </div>
            ) : null}
            {userInfo.refund ? (
              <div className="flex mt-3">
                <div className="flex-1 text-gray6">Refund</div>
                <div>
                  {formatNumber(userInfo.refund)}{" "}
                  <span className="text-gray6">{ido.paymentToken}</span>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
        {error ? <div className="error">{error}</div> : null}
        {userInfo && userInfo.amount.gt("0") && !userInfo.claimedTokens ? (
          <Button
            className="w-full mt-2"
            onClick={onHarvest}
            disabled={
              ido.notFinalized ||
              (userInfo.claimable && userInfo.claimable.eq(userInfo.claimed))
            }
          >
            {loading
              ? "Loading..."
              : userInfo.claimable && userInfo.claimable.eq(userInfo.claimed)
              ? "No vested tokens"
              : ido.notFinalized
              ? "Soon..."
              : "Collect"}
          </Button>
        ) : null}
        {loading ? <LoadingOverlay message={loading} /> : null}
      </div>
    </div>
  );
}

function IDOCard({ ido, parentSetParams }) {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [params, setParams] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  async function fetchData() {
    if (ido.type === "tiers-terra") {
      //if (!state.lcd) return;
      const idoState = await state.lcd.wasm.contractQuery(ido.address, {
        state: {},
      });
      const raising = parseUnits(idoState.raising_amount, 12);
      const offering = parseUnits(idoState.offering_amount, 12);
      const newParams = {
        timestamp: (Date.now() / 1000) | 0,
        start: new Date(idoState.start_time * 1000),
        end: new Date(idoState.end_time * 1000),
        raising: raising,
        offering: offering,
        comitted: parseUnits(idoState.total_amount, 12),
        paused: false,
        finalized: idoState.finalized,
        price: raising.mul(parseUnits("1")).div(offering),
      };
      setParams(newParams);
      if (parentSetParams) parentSetParams(newParams);
      if (!state.address) return;

      // fetch ust balance
      const balances = await state.lcd.bank.balance(state.address);
      const balance = (
        balances[0].map((b) => b).find((b) => b.denom === "uusd") || {
          amount: "0",
        }
      ).amount.toString();
      setBalance(parseUnits(balance, 12));

      // fetch ido user state & allocation
      const userState = await state.lcd.wasm.contractQuery(ido.address, {
        user_state: { user: state.address, now: (Date.now() / 1000) | 0 },
      });
      const userAllocation = ido.allocations.find(
        (a) => a.address === state.address
      ) || { allocation: "0", proof: [] };
      setUserInfo({
        amount: parseUnits(userState.amount, 12),
        owed: parseUnits(userState.owed, 12),
        allocationStr: userAllocation.allocation,
        allocation: parseUnits(userAllocation.allocation, 12),
        proof: userAllocation.proof,
      });
    } else {
      const lastBlock = await getState().provider.getBlock(-1);
      const paymentToken = new ethers.Contract(
        ido.paymentTokenAddress,
        abis.token,
        state.provider
      );
      const sale = new ethers.Contract(
        ido.address,
        abis.saleTiers,
        state.provider
      );
      const params = await sale.getParams();
      const newParams = {
        timestamp: lastBlock.timestamp,
        start: new Date(params[0].toNumber() * 1000),
        end: new Date(params[1].toNumber() * 1000),
        raising: params[2],
        offering: params[3],
        comitted: params[4],
        paused: params[5],
        finalized: params[6],
        price: params[2].mul(parseUnits("1")).div(params[3]),
      };
      setParams(newParams);
      if (parentSetParams) parentSetParams(newParams);
      if (!state.address) return;
      setBalance(await paymentToken.balanceOf(state.address));
      const userInfo = await sale.getUserInfo(state.address);
      const userAllocation = ido.allocations.find(
        (a) => a.address === state.address
      ) || { amount: "0", proof: [] };
      let allocation = parseUnits(userAllocation.amount, ido.paymentDecimals);
      if (
        lastBlock.timestamp >= params[1].toNumber() &&
        !params[2].eq(params[4])
      ) {
        allocation = allocation.add(params[2].mul(125).div(100000));
      }
      setUserInfo({
        amount: userInfo[0],
        owed: userInfo[2],
        allocationStr: userAllocation.amount,
        allocation: allocation,
        allocationFcfs: allocation.add(params[2].mul(125).div(100000)),
        proof: userAllocation.proof,
      });
    }
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 5000);
    setTimeout(() => clearInterval(handle), 3 * 60 * 60 * 1000); // Stop after 3 hours
    return () => clearInterval(handle);
  }, [state.networkId, state.address]);

  async function onDeposit() {
    setError("");
    try {
      if (userInfo.proof.length === 0) {
        setError("You don't have an allocation for this IDO");
        return;
      }
      const parsedAmount = parseUnits(
        amount.replace(/[^0-9\.]/g, ""),
        ido.paymentDecimals
      );
      setAmount(formatUnits(parsedAmount, ido.paymentDecimals));
      if (ido.type === "tiers-terra") {
        try {
          await runTransactionTerra(
            {
              msgs: [
                new MsgExecuteContract(
                  state.address,
                  ido.address,
                  {
                    [Date.now() < params.end.getTime()
                      ? "deposit"
                      : "deposit_fcfs"]: {
                      allocation: userInfo.allocationStr,
                      proof: userInfo.proof,
                    },
                  },
                  [
                    new Coin(
                      "uusd",
                      parsedAmount.div("1000000000000").toString()
                    ),
                  ]
                ),
              ],
            },
            setLoading,
            setError
          );
        } catch (e) {
          console.log("err", e);
        }
      } else {
        const paymentToken = new ethers.Contract(
          ido.paymentTokenAddress,
          abis.token,
          state.signer
        );
        const sale = new ethers.Contract(
          ido.address,
          abis.saleTiers,
          state.signer
        );

        const allowance = await paymentToken.allowance(
          state.address,
          sale.address
        );
        if (allowance.lt(userInfo.allocationFcfs)) {
          const call = paymentToken.approve(
            sale.address,
            userInfo.allocationFcfs
          );
          try {
            await runTransaction(call, setLoading, setError);
          } catch (e) {
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        const call = sale.deposit(
          parsedAmount,
          parseUnits(userInfo.allocationStr, ido.paymentDecimals),
          userInfo.proof
        );
        try {
          await runTransaction(call, setLoading, setError);
        } catch (e) {}
      }
      setAmount("");
      fetchData();
    } catch (err) {
      console.error(err);
      setError("Invalid number provided");
    }
  }

  function onDepositMax() {
    let acutalBalance = balance;
    if (ido.paymentToken === "UST") {
      acutalBalance = acutalBalance.sub(parseUnits("5"));
    }
    if (userInfo && userInfo.allocation.gt("0")) {
      const max = userInfo.allocation.sub(userInfo.amount);
      setAmount(
        formatUnits(bnMin(max, acutalBalance), ido.paymentDecimals).replace(
          /,/g,
          ""
        )
      );
    } else {
      setAmount(
        formatUnits(acutalBalance, ido.paymentDecimals).replace(/,/g, "")
      );
    }
  }

  const idoActive =
    params &&
    params.timestamp >= params.start.getTime() / 1000 &&
    !params.raising.eq(params.comitted);
  //params.timestamp <= params.end.getTime() / 1000;
  let progress = "0";
  if (params) {
    progress = Math.min(
      params.comitted.mul(10000).div(params.raising).toNumber() / 100,
      100
    ).toFixed(2);
  }

  if (!params) {
    return (
      <div className="ido">
        <div className="flex-1">
          <div>Loading...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="ido">
      <div className="flex-1">
        <div className="flex mb-3">
          <div className="flex-1 text-gray6">Offering</div>
          <div>
            {formatNumber(params.offering)}{" "}
            <span className="text-gray6">{ido.token}</span>
          </div>
        </div>
        <div className="flex mb-3">
          <div className="flex-1 text-gray6">Raising</div>
          <div>
            {formatNumber(params.raising, 2, ido.paymentDecimals)}{" "}
            <span className="text-gray6">{ido.paymentToken}</span>
          </div>
        </div>
        <div className="flex mb-3">
          <div className="flex-1 text-gray6">Sold %</div>
          <div>
            {formatNumber(params.comitted.mul(100).div(params.raising), 0, 0)}%
          </div>
        </div>
        <div className="flex mb-3">
          <div className="flex-1 text-gray6">Price</div>
          <div>
            {formatNumber(params.price, 2, ido.paymentDecimals)}{" "}
            <span className="text-gray6">{ido.paymentToken}</span>
            {/* ${" "}
            {formatNumber(
              params.price.mul((ido.paymentPrice * 10000) | 0).div(10000),
              2
            )} */}
          </div>
        </div>
        {userInfo ? (
          <div className="flex">
            <div className="flex-1 text-gray6">Your Allocation</div>
            <div>
              ${" "}
              {formatNumber(
                userInfo.allocation,
                ido.paymentDecimalsShown,
                ido.paymentDecimals
              )}
              {/* <span className="text-gray6">{ido.paymentToken}</span> ${" "}
              {formatNumber(
                userInfo.allocation
                  .mul((ido.paymentPrice * 10000) | 0)
                  .div(10000),
                2
              )} */}
            </div>
          </div>
        ) : null}
        <div className="mb-4" />
        <div
          className="progress mb-4"
          title={`${formatNumber(params.comitted, 6)} / ${formatNumber(
            params.raising,
            0
          )}`}
        >
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        {userInfo ? (
          <>
            {error ? <div className="error">{error}</div> : null}
            {idoActive ? (
              <>
                <div className="text-sm mb-3">
                  <span className="text-gray6">Balance: </span>
                  <span className="text-primary5">
                    {formatNumber(
                      balance,
                      ido.paymentDecimalsShown,
                      ido.paymentDecimals
                    )}{" "}
                    {ido.paymentToken}
                  </span>
                </div>
                <div className="input-with-link mb-4">
                  <input
                    className="input w-full"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <a onClick={onDepositMax} className="input-link">
                    Max
                  </a>
                </div>
                <Button
                  className="button-lg w-full mb-4"
                  onClick={onDeposit}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Deposit"}
                </Button>
              </>
            ) : null}
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">Deposited</div>
              <div>
                {formatNumber(
                  userInfo.amount,
                  ido.paymentDecimalsShown,
                  ido.paymentDecimals
                )}{" "}
                <span className="text-gray6">{ido.paymentToken}</span>
              </div>
            </div>
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">Owed</div>
              <div>
                {formatNumber(userInfo.owed)}{" "}
                <span className="text-gray6">{ido.token}</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
      {loading ? <LoadingOverlay message={loading} /> : null}
    </div>
  );
}

function IDOHeader({ ido }) {
  return (
    <div>
      <div
        className="ido-cover"
        style={{ backgroundImage: `url(${ido.cover.src})` }}
      >
        <Image
          src={ido.logo}
          height={60}
          width={(60 * ido.logo.width) / ido.logo.height}
          alt={ido.name}
        />
      </div>
      <h2>{ido.name}</h2>
      <div className="ido-links">
        <a href={ido.links.twitter} target="_blank" rel="noreferrer reopener">
          <Icon name="twitter" />
        </a>
        <a href={ido.links.telegram} target="_blank" rel="noreferrer reopener">
          <Icon name="telegram" />
        </a>
        <a href={ido.links.medium} target="_blank" rel="noreferrer reopener">
          <Icon name="medium" />
        </a>
        <a href={ido.links.website} target="_blank" rel="noreferrer reopener">
          <Icon name="link" />
        </a>
        <a href={ido.links.docs} target="_blank" rel="noreferrer reopener">
          <Icon name="docs" />
        </a>
      </div>
    </div>
  );
}
