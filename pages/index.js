import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import Icon from "../components/icon";
import Button from "../components/button";
import Layout from "../components/layout";
import Countdown from "../components/countdown";
import LoadingOverlay from "../components/loadingOverlay";
import DisclaimerBnpl from "../components/disclaimerBnpl";
import {
  bnMin,
  getContracts,
  useGlobalState,
  dateForBlock,
  formatDate,
  formatNumber,
  runTransaction,
} from "../utils";
import abis from "../abis";

import logoSkyrim from "../public/ido/skyrim-logo.png";
import coverSkyrim from "../public/ido/skyrim-cover.png";
import logoBnpl from "../public/ido/bnpl-logo.png";
import coverBnpl from "../public/ido/bnpl-cover.png";

const liveIdo = null;

const idos = [
  {
    name: "BNPL Pay",
    token: "BNPL",
    type: "batch",
    address: {
      1: "0x1a4d12Ab7033483bEEf93b9faCDB818c0f039271",
      3: "0x6B7F9c1dAe5611bA81D097083C719E3563c0019A",
    },
    xrunePrice: 0.2,
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
  },
  {
    name: "Skyrim Finance",
    token: "SKYRIM",
    type: "dutch",
    address: {
      1: "0x9Aa3f4295431e6640f1D2ef50944BAe6cC5123D8",
      3: "0x1D1aEE92c53f481889AbE89c3A17d297f6E89841",
    },
    xrunePrice: 0.5,
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
  },
];

export default function IDOs() {
  const [liveIdoParams, setLiveIdoParams] = useState(null);

  return (
    <Layout title="IDOs" page="idos">
      <DisclaimerBnpl />
      {liveIdo ? (
        <>
          <h1 className="live-ido-title title clear">
            {liveIdo.name} IDO
            {liveIdoParams &&
            liveIdoParams.timestamp < liveIdoParams.start.getTime() / 1000 ? (
              <div className="flex float-right">
                <span>Starts in </span>
                <Countdown to={liveIdoParams.start} />
              </div>
            ) : liveIdoParams &&
              liveIdoParams.timestamp < liveIdoParams.end.getTime() / 1000 ? (
              <div className="flex float-right">
                <span>Ends in </span>
                <Countdown to={liveIdoParams.end} />
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
      <h1 className="title">Previous IDOs</h1>
      <div className="ido-list">
        {idos.map((ido) => (
          <IDOCard ido={ido} key={ido.name} />
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

function IDOCard({ ido, parentSetParams }) {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [params, setParams] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  function allocationForAmount(params, amount) {
    if (amount.eq("0")) {
      return ethers.BigNumber.from("0");
    }
    const estimateEndsLater = amount
      .mul(params.offering)
      .div(params.comitted.eq("0") ? amount : params.comitted);
    const estimateEndsNow = amount
      .mul(ethers.utils.parseUnits("1"))
      .div(params.price);
    return estimateEndsLater.lt(estimateEndsNow)
      ? estimateEndsLater
      : estimateEndsNow;
  }

  async function fetchData() {
    const contracts = getContracts();
    const lastBlock = await getState().provider.getBlock(-1);
    if (state.address) {
      setBalance(await contracts.xrune.balanceOf(state.address));
    }
    if (ido.type === "batch") {
      const sale = new ethers.Contract(
        ido.address[state.networkId],
        abis.saleBatch,
        state.provider
      );
      const params = await sale.getParams();
      const newParams = {
        timestamp: lastBlock.timestamp,
        start: new Date(params[0].toNumber() * 1000),
        end: new Date(params[1].toNumber() * 1000),
        raising: params[2],
        offering: params[3],
        cap: params[4],
        comitted: params[5],
        paused: params[6],
        finalized: params[7],
        price: params[2].mul(ethers.utils.parseUnits("1")).div(params[3]),
      };
      setParams(newParams);
      if (parentSetParams) parentSetParams(newParams);
      if (!state.address) return;
      const userInfo = await sale.userInfo(state.address);
      setUserInfo({
        amount: userInfo[0],
        claimedRefund: userInfo[1],
        claimedTokens: userInfo[2],
        allocation: await sale.getOfferingAmount(state.address),
        refund: await sale.getRefundingAmount(state.address),
      });
    }
    if (ido.type === "dutch") {
      const sale = new ethers.Contract(
        ido.address[state.networkId],
        abis.saleDutch,
        state.provider
      );
      const params = await sale.getParams();
      const newParams = {
        timestamp: lastBlock.timestamp,
        start: new Date(params[0].toNumber() * 1000),
        end: new Date(params[1].toNumber() * 1000),
        startPrice: params[2],
        endPrice: params[3],
        offering: params[4],
        cap: params[5],
        comitted: params[6],
        price: params[7],
        clearingPrice: params[8],
        paused: params[9],
        finalized: params[10],
      };
      setParams(newParams);
      if (parentSetParams) parentSetParams(newParams);
      if (!state.address) return;
      const userInfo = await sale.userInfo(state.address);

      setUserInfo({
        amount: userInfo[0],
        claimedTokens: userInfo[1],
        allocation: allocationForAmount(newParams, userInfo[0]),
      });
    }
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 5000);
    return () => clearInterval(handle);
  }, [state.networkId, state.address]);

  async function callSaleMethod(method, ...args) {
    const sale = new ethers.Contract(
      ido.address[state.networkId],
      ido.type === "batch" ? abis.saleBatch : abis.saleDutch,
      state.signer
    );
    const call = sale[method](...args);
    await runTransaction(call, setLoading, setError);
    fetchData();
  }

  async function onDeposit() {
    try {
      const parsedAmount = ethers.utils.parseUnits(
        amount.replace(/[^0-9\.]/g, "")
      );
      setAmount(ethers.utils.formatUnits(parsedAmount));
      const contracts = getContracts();
      const call = contracts.xrune.transferAndCall(
        ido.address[state.networkId],
        parsedAmount,
        "0x"
      );
      await runTransaction(call, setLoading, setError);
      setAmount("");
      fetchData();
    } catch (err) {
      setError("Invalid number provided");
    }
  }

  function onDepositMax() {
    if (formatNumber(params.cap) !== "0") {
      let cap = params.cap;
      if (userInfo) cap = cap.sub(userInfo.amount);
      setAmount(formatNumber(bnMin(cap, balance)).replace(/,/g, ""));
    } else {
      setAmount(formatNumber(balance).replace(/,/g, ""));
    }
  }

  function onCollectOwed() {
    callSaleMethod("harvestTokens");
  }

  function onCollectRefund() {
    callSaleMethod("harvestRefund");
  }

  function onCollectAll() {
    callSaleMethod("harvestAll");
  }

  // TODO check saleSuccessful for dutch auction
  const idoActive =
    params &&
    params.timestamp >= params.start.getTime() / 1000 &&
    params.timestamp <= params.end.getTime() / 1000;
  const canCollectOwed =
    params &&
    params.finalized &&
    !params.paused &&
    userInfo &&
    formatNumber(userInfo.allocation) !== "0" &&
    !userInfo.claimedTokens;
  const canCollectRefund =
    ido.type === "batch" &&
    params &&
    !params.paused &&
    params.timestamp > params.end.getTime() / 1000 &&
    userInfo &&
    formatNumber(userInfo.refund) !== "0" &&
    !userInfo.claimedRefund;
  let progress = "0";
  if (ido.type === "batch" && params) {
    progress = Math.min(
      params.comitted.mul(10000).div(params.raising).toNumber() / 100,
      100
    ).toFixed(2);
  }
  if (ido.type === "dutch" && params) {
    const progressTokens = params.comitted
      .mul(ethers.utils.parseUnits("1"))
      .div(params.clearingPrice)
      .mul("100")
      .div(params.offering)
      .toNumber();
    const progressTime =
      ((params.timestamp - params.start.getTime() / 1000) * 100) /
      ((params.end.getTime() - params.start.getTime()) / 1000);
    progress = Math.min(100, Math.max(progressTokens, progressTime)).toFixed(2);
  }

  return (
    <div className="ido">
      <div className="flex-1">
        {ido !== liveIdo ? (
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
              <a
                href={ido.links.twitter}
                target="_blank"
                rel="noreferrer reopener"
              >
                <Icon name="twitter" />
              </a>
              <a
                href={ido.links.telegram}
                target="_blank"
                rel="noreferrer reopener"
              >
                <Icon name="telegram" />
              </a>
              <a
                href={ido.links.medium}
                target="_blank"
                rel="noreferrer reopener"
              >
                <Icon name="medium" />
              </a>
              <a
                href={ido.links.website}
                target="_blank"
                rel="noreferrer reopener"
              >
                <Icon name="link" />
              </a>
              <a
                href={ido.links.docs}
                target="_blank"
                rel="noreferrer reopener"
              >
                <Icon name="docs" />
              </a>
            </div>
          </div>
        ) : null}
        {params ? (
          <>
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">Offering</div>
              <div>
                {formatNumber(params.offering)}{" "}
                <span className="text-gray6">{ido.token}</span>
              </div>
            </div>
            {ido.type === "dutch" ? (
              <div className="flex mb-3">
                <div className="flex-1 text-gray6">Start Price</div>
                <div>
                  <span className="text-gray6">
                    {formatNumber(params.startPrice)} XRUNE
                  </span>{" "}
                  ${" "}
                  {formatNumber(
                    params.startPrice
                      .mul((ido.xrunePrice * 10000) | 0)
                      .div(10000),
                    2
                  )}
                </div>
              </div>
            ) : null}
            {ido.type === "dutch" ? (
              <div className="flex mb-3">
                <div className="flex-1 text-gray6">Reserve Price</div>
                <div>
                  <span className="text-gray6">
                    {formatNumber(params.endPrice)} XRUNE
                  </span>{" "}
                  ${" "}
                  {formatNumber(
                    params.endPrice
                      .mul((ido.xrunePrice * 10000) | 0)
                      .div(10000),
                    2
                  )}
                </div>
              </div>
            ) : null}
            {ido.type === "batch" ? (
              <div className="flex mb-3">
                <div className="flex-1 text-gray6">Raising</div>
                <div>
                  {formatNumber(params.raising, 0)}{" "}
                  <span className="text-gray6">XRUNE</span>
                </div>
              </div>
            ) : null}
            {ido.type === "batch" ? (
              <div className="flex mb-3">
                <div className="flex-1 text-gray6">Committed %</div>
                <div>
                  {formatNumber(
                    params.comitted.mul(100).div(params.raising),
                    0,
                    0
                  )}
                  %
                </div>
              </div>
            ) : null}
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">Committed $</div>
              <div>
                ${" "}
                {formatNumber(
                  params.comitted.mul((ido.xrunePrice * 10000) | 0).div(10000),
                  2
                )}
              </div>
            </div>
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">Committed XRUNE</div>
              <div>{formatNumber(params.comitted, 0)}</div>
            </div>
            <div className="flex mb-3">
              <div className="flex-1 text-gray6">
                {ido.type === "dutch" ? "Current Price" : "Price"}
              </div>
              <div>
                <span className="text-gray6">
                  {formatNumber(params.price)} XRUNE
                </span>{" "}
                ${" "}
                {formatNumber(
                  params.price.mul((ido.xrunePrice * 10000) | 0).div(10000),
                  2
                )}
              </div>
            </div>
            {formatNumber(params.cap) !== "0" && false ? (
              <div className="flex">
                <div className="flex-1 text-gray6">Per User Cap</div>
                <div>
                  {formatNumber(params.cap)}{" "}
                  <span className="text-gray6">XRUNE</span>
                </div>
              </div>
            ) : null}
            <div className="mb-4" />
            <div className="progress mb-4">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {userInfo ? (
              <>
                {error ? <div className="error">{error}</div> : null}
                {idoActive ? (
                  <>
                    <div className="text-sm mb-3">
                      <span className="text-gray6">Balance: </span>
                      <span className="text-primary5">
                        {formatNumber(balance)} XRUNE
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
                    {formatNumber(userInfo.amount)}{" "}
                    <span className="text-gray6">XRUNE</span>
                  </div>
                </div>
                <div className="flex mb-3">
                  <div className="flex-1 text-gray6">Owed</div>
                  <div>
                    {formatNumber(userInfo.allocation)}{" "}
                    <span className="text-gray6">{ido.token}</span>
                  </div>
                </div>
                {userInfo.refund ? (
                  <div className="flex">
                    <div className="flex-1 text-gray6">Refund</div>
                    <div>
                      {formatNumber(userInfo.refund)}{" "}
                      <span className="text-gray6">XRUNE</span>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>
      {userInfo ? (
        <>
          {canCollectOwed && canCollectRefund ? (
            <Button className="w-full mt-2" onClick={onCollectAll}>
              {loading ? "Loading..." : "Collect owed tokens & refund"}
            </Button>
          ) : canCollectOwed ? (
            <Button className="w-full mt-2" onClick={onCollectOwed}>
              {loading ? "Loading..." : "Collect owed tokens"}
            </Button>
          ) : canCollectRefund ? (
            <Button className="w-full mt-2" onClick={onCollectRefund}>
              {loading ? "Loading..." : "Collect refund"}
            </Button>
          ) : params.timestamp > params.end.getTime() / 1000 ? (
            <Button className="w-full mt-2" disabled={true}>
              Collect owed tokens
            </Button>
          ) : null}
        </>
      ) : null}
      {loading ? <LoadingOverlay message={loading} /> : null}
    </div>
  );
}
