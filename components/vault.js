import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Button from "./button";
import Countdown from "./countdown";
import ProgressSlider from "./progressSlider";
import LoadingOverlay from "./loadingOverlay";

import {
  bnMin,
  parseUnits,
  formatUnits,
  formatNumber,
  formatMDY,
  useGlobalState,
  connectWallet,
  disconnectWallet,
  getContracts,
  runTransaction,
} from "../utils";

import abis from "../abis";

export default function Vault({ vault }) {
  const state = useGlobalState();
  const [data, setData] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState("");
  const [balance, setBalance] = useState(parseUnits("0"));
  const [amount, setAmount] = useState("");
  const [additionalStake, setAdditionalStake] = useState(false);

  async function onConnect() {
    if (state.address) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  }

  function onMaxClicked() {
    setError();
    setAmount(formatUnits(bnMin(balance, data.available)));
  }

  async function onSubmit() {
    const contracts = getContracts();
    const parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""));
    if (Number.isNaN(parsedAmount)) {
      setError("Not a valid number");
      return;
    }

    const gasLimit = await contracts.xrune.estimateGas.transferAndCall(
      vault.address,
      parsedAmount,
      "0x"
    );
    const call = contracts.xrune.transferAndCall(
      vault.address,
      parsedAmount,
      "0x",
      { gasLimit: gasLimit.mul(120).div(100) }
    );
    runTransaction(call, setLoading, setError).then(
      () => {
        setAmount("");
        fetchData();
      },
      () => {}
    );
  }

  async function fetchData() {
    if (!state.address) return;
    const contracts = getContracts();
    const contract = new ethers.Contract(
      vault.address,
      abis.vault,
      state.signer || state.provider
    );
    const params = await contract.getParams();
    const userInfo = await contract.getUserInfo(state.address);
    const totalAmount = params[2];
    const capTotal = params[0];

    setData({
      progress: totalAmount.mul(10000).div(capTotal).toNumber() / 100,
      available: capTotal.sub(totalAmount),
      totalAmount: totalAmount,
      capTotal: capTotal,
      startAt: params[5],
      endAt: params[6],
      staked: userInfo[2],
      earned: userInfo[3],
    });
    setBalance(await contracts.xrune.balanceOf(state.address));
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 10000);
    return () => clearInterval(handle);
  }, [state.networkId, state.address]);

  function renderBalance() {
    return (
      <div className="vault__balance">
        Balance: <span>{formatNumber(balance)} XRUNE</span>
        <a
          href="https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0x69fa0feE221AD11012BAb0FdB45d444D3D2Ce71c"
          className="button button-xs"
          target="_blank"
          rel="noreferrer"
        >
          Buy XRUNE
        </a>
      </div>
    );
  }

  function renderForm() {
    return (
      <>
        <div className="vault__form">
          <input
            type="text"
            placeholder="0.00"
            className="vault__field"
            onChange={(e) => setAmount(e.target.value)}
            value={amount}
          />
          <button type="button" className="vault__max" onClick={onMaxClicked}>
            Max
          </button>
        </div>
        {error ? <div className="error mb-4">{error}</div> : null}
        <div className="tac">
          <button
            className="button button-lg vault__stake"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Loading..." : "Stake"}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="vault">
      <div className="vault__head">
        <span className="vault__head-label">{vault.months}</span>
        <span className="vault__title">Month Vault</span>
      </div>
      <div className="vault__subhead">
        Vault max capacity{" "}
        <span>{data ? formatNumber(data.capTotal, 0) : 0} XRUNE</span>
      </div>
      <ul className="vault__data">
        <li className="vault__duration">
          Duration
          <span>{vault.months} months</span>
        </li>
        <li className="vault__dates">
          <ul>
            <li>
              Start Date <span>{data ? formatMDY(data.startAt) : "-"}</span>
            </li>
            <li>
              End Date <span>{data ? formatMDY(data.endAt) : "-"}</span>
            </li>
          </ul>
        </li>
      </ul>
      <ul className="vault__data">
        <li className="vault__apy">
          <ul>
            <li>
              APY <span>{vault.apy}</span>
            </li>
            <li>
              Earn <span>XRUNE</span>
            </li>
          </ul>
        </li>
      </ul>
      <div className="vault__body">
        {!state.address ? (
          <div className="tac">
            <Button onClick={onConnect}>Connect Wallet</Button>
          </div>
        ) : (
          <>
            {data && data.staked.gt(0) ? (
              <>
                <div className="vault__countdown">
                  <div className="vault__countdown-head">
                    <span>Start</span>
                    <div>
                      <span>Time till harvest</span>
                      <Countdown to={new Date(data.endAt * 1000)} simple />
                    </div>
                    <span>End</span>
                  </div>
                  <ProgressSlider
                    startDate={new Date(data.startAt * 1000)}
                    endDate={new Date(data.endAt * 1000)}
                  />
                </div>
                <ul className="vault__results">
                  <li>
                    Staked
                    <span>{formatNumber(data.staked)} XRUNE</span>
                  </li>
                  <li>
                    Earned
                    <span>{formatNumber(data.earned)} XRUNE</span>
                  </li>
                </ul>
                {/* === if user can harvest === */}
                {/*<div className="vault__additional tac">*/}
                {/*  <button className="button button-lg vault__stake">*/}
                {/*    Harvest 0 XRUNE*/}
                {/*  </button>*/}
                {/*</div>*/}
                {data && data.available.gt(0) ? (
                  <div className="vault__additional tac">
                    Balance:
                    <span>{formatNumber(balance)} XRUNE</span>
                    {additionalStake ? (
                      renderForm()
                    ) : (
                      <div className="tac">
                        <button
                          className="button button-lg vault__stake"
                          onClick={() => setAdditionalStake(true)}
                        >
                          Stake More
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="vault__filled">Filled</div>
                )}
              </>
            ) : (
              <>
                {data && data.available.gt(0) ? (
                  <>
                    {balance.gt(0) ? (
                      <>
                        {renderBalance()}
                        {renderForm()}
                      </>
                    ) : (
                      renderBalance()
                    )}
                  </>
                ) : (
                  <div className="vault__filled">Filled</div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <div className="vault__foot">
        <div className="vault__value">
          Available limit:
          <span>{data ? formatNumber(data.available) : 0} XRUNE</span>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: data ? data.progress + "%" : "0%" }}
            />
          </div>
        </div>
        <div className="vault__value">
          Total staked:
          <span>{data ? formatNumber(data.totalAmount) : 0} XRUNE</span>
        </div>
      </div>
      {loading ? <LoadingOverlay message={loading} /> : null}
    </div>
  );
}
