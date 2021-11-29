import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { parseUnits } from "@ethersproject/units";

import Button from "./button";
import Countdown from "./countdown";
import ProgressSlider from "./progressSlider";

import {
  formatNumber,
  useGlobalState,
  connectWallet,
  disconnectWallet,
  getContracts,
  runTransaction,
  contractAddresses,
} from "../utils";

import abis from "../abis";

export default function Vault({ data }) {
  const [balance, setBalance] = useState(0);
  const [fieldValue, setFieldValue] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [additionalStake, setAdditionalStake] = useState(false);
  const [info, setInfo] = useState(null);
  const state = useGlobalState();

  async function onConnect() {
    if (state.address) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  }

  const onMaxClicked = () => {
    const value = parseFloat(formatNumber(balance).replaceAll(",", ""));
    const limit = parseFloat(info.availableLimit.replaceAll(",", ""));
    if (value < limit) {
      setFieldValue(value);
    } else {
      setFieldValue(limit);
    }
    setLoading("");
    setError("");
  };

  const onStake = async () => {
    const amount = parseUnits(fieldValue.replace(/[^0-9\.]/g, ""));

    if (Number.isNaN(amount)) {
      setError("Not a valid number");
      return;
    }

    const contracts = getContracts();

    const allowance = await contracts.xrune.allowance(
      state.address,
      contracts[`vault${data.duration.value}month`].address
    );

    if (allowance.eq("0")) {
      const call = contracts.xrune.approve(
        contractAddresses[state.networkId][`vault${data.duration.value}month`],
        ethers.constants.MaxUint256
      );
      await runTransaction(call, setLoading, setError);
    } else {
      const call = contracts[
        `vault${data.duration.value}month`
      ].updateCompoundAndStake(amount, { gasLimit: "1000000" });
      await runTransaction(call, setLoading, setError);
      setFieldValue(0);
      setLoading("");
    }
  };

  async function fetchData() {
    const contracts = getContracts();
    if (state.address) {
      const contract = new ethers.Contract(
        contracts[`vault${data.duration.value}month`].address,
        abis.vaults,
        state.signer || state.provider
      );
      const stakeInfo = await contract.getContractInfo();

      const totalHardCap = formatNumber(stakeInfo._totalHardCap);
      const totalStaked = formatNumber(stakeInfo._totalStake);
      const staked = formatNumber(stakeInfo._myTotalStake);
      const earned = formatNumber(stakeInfo._myLatestRewards);

      const numTotalHardCap = parseFloat(totalHardCap.replaceAll(",", ""));
      const numTotalStaked = parseFloat(totalStaked.replaceAll(",", ""));

      const availableLimit = formatNumber(numTotalHardCap - numTotalStaked);
      const progress = (100 * numTotalStaked) / numTotalHardCap;

      const obj = {
        totalHardCap,
        totalStaked,
        staked,
        earned,
        availableLimit,
        progress,
      };

      setInfo((prevState) => ({ ...prevState, ...obj }));
      setBalance(await contracts.xrune.balanceOf(state.address));
    }
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 5000);
    return () => clearInterval(handle);
  }, [state.networkId, state.address]);

  function BalanceBlock() {
    return (
      <div className="vault__balance">
        Balance:{" "}
        <span>
          {formatNumber(balance)} {data.earn}
        </span>
        <a
          href="https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0x69fa0feE221AD11012BAb0FdB45d444D3D2Ce71c"
          className="button button-xs"
          target="_blank"
          rel="noreferrer"
        >
          Buy {data.earn}
        </a>
      </div>
    );
  }

  function FormBLock() {
    return (
      <>
        <div className="vault__form">
          <input
            type="text"
            placeholder="0.00"
            className="vault__field"
            onChange={(e) =>
              setFieldValue(e.target.value.replace(/[^0-9\.]/g, ""))
            }
            value={fieldValue > 0 ? fieldValue : ""}
          />
          <button type="button" className="vault__max" onClick={onMaxClicked}>
            MAX
          </button>
        </div>
        {error ? <div className="error mb-4">{error}</div> : null}
        <div className="tac">
          <button className="button button-lg vault__stake" onClick={onStake}>
            {loading ? loading : "Stake"}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="vault">
      <div className="vault__head">
        <span className="vault__head-label">{data.duration.value}</span>
        <span className="vault__title">Month Vault</span>
      </div>
      <div className="vault__subhead">
        MAX lock per Vault{" "}
        <span>
          {info ? info.totalHardCap : 0} {data.earn}
        </span>
      </div>
      <ul className="vault__data">
        <li className="vault__duration">
          Duration
          <span>
            {data.duration.value} {data.duration.label}
          </span>
        </li>
        <li className="vault__dates">
          <ul>
            <li>
              Start Date <span>{data.startDate}</span>
            </li>
            <li>
              End Date <span>{data.endDate}</span>
            </li>
          </ul>
        </li>
      </ul>
      <ul className="vault__data">
        <li className="vault__apy">
          <ul>
            <li>
              APY <span>{data.apy}</span>
            </li>
            <li>
              Earn <span>{data.earn}</span>
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
            {info && parseFloat(info.staked.replaceAll(",", "")) > 0 ? (
              <>
                <div className="vault__countdown">
                  <div className="vault__countdown-head">
                    <span>Start</span>
                    <div>
                      <span>Time till harvest</span>
                      <Countdown to={new Date(data.endDate)} simple />
                    </div>
                    <span>End</span>
                  </div>
                  <ProgressSlider
                    startDate={new Date(data.startDate)}
                    endDate={new Date(data.endDate)}
                  />
                </div>
                <ul className="vault__results">
                  <li>
                    Staked
                    <span>
                      {info.staked} {data.earn}
                    </span>
                  </li>
                  <li>
                    Earned
                    <span>
                      {info.earned} {data.earn}
                    </span>
                  </li>
                </ul>
                <div className="vault__additional tac">
                  Balance:
                  <span>
                    {formatNumber(balance)} {data.earn}
                  </span>
                  {additionalStake ? (
                    <>
                      <FormBLock />
                    </>
                  ) : (
                    <div className="tac">
                      <button
                        className="button button-lg vault__stake"
                        onClick={() => setAdditionalStake(true)}
                      >
                        Stake
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {parseFloat(formatNumber(balance).replaceAll(",", "")) > 0 ? (
                  <>
                    <BalanceBlock />
                    <FormBLock />
                  </>
                ) : (
                  <BalanceBlock />
                )}
              </>
            )}
          </>
        )}
      </div>
      <div className="vault__foot">
        <div className="vault__value">
          Available limit:
          <span>
            {info ? info.availableLimit : 0} {data.earn}
          </span>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: info ? info.progress + "%" : "0%" }}
            />
          </div>
        </div>
        <div className="vault__value">
          Total Staked:
          <span>
            {info ? info.totalStaked : 0} {data.earn}
          </span>
        </div>
      </div>
    </div>
  );
}
