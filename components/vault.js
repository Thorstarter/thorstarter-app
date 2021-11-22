import { useState, useEffect } from "react";

import Button from "./button";
import Countdown from "./countdown";
import ProgressSlider from "./progressSlider";

import { formatNumber } from "../utils";
import {
  useGlobalState,
  connectWallet,
  disconnectWallet,
  getContracts,
} from "../utils";

export default function Vault({ data }) {
  const [balance, setBalance] = useState(0);
  const [stakeValue, setStakeValue] = useState(0);
  const [additionalStake, setAdditionalStake] = useState(false);
  const state = useGlobalState();

  async function onConnect() {
    if (state.address) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  }

  const onChangeField = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setStakeValue(value);
  };

  async function fetchData() {
    const contracts = getContracts();
    if (state.address) {
      setBalance(await contracts.xrune.balanceOf(state.address));
    }
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 5000);
    setTimeout(() => clearInterval(handle));
    return () => clearInterval(handle);
  }, [state.networkId, state.address]);

  return (
    <div className="vault">
      <div className="vault__head">
        <span className="vault__head-label">{data.duration.value}</span>
        <span className="vault__title">Month Vault</span>
      </div>
      <div className="vault__subhead">
        MAX lock per Vault{" "}
        <span>
          {formatNumber(data.maxLock)} {data.earn}
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
            <div className="vault__form">
              <input
                type="text"
                placeholder="0.00"
                className="vault__field"
                onChange={onChangeField}
                value={stakeValue > 0 ? stakeValue : ""}
              />
              <button type="button" className="vault__max">
                MAX
              </button>
            </div>
            <div className="tac">
              <button className="button button-lg vault__stake">Stake</button>
            </div>

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
                  {formatNumber(0)} {data.earn}
                </span>
              </li>
              <li>
                Earned
                <span>
                  {formatNumber(0)} {data.earn}
                </span>
              </li>
            </ul>
            <div className="vault__additional tac">
              Balance:
              <span>
                {formatNumber(balance)} {data.earn}
              </span>
              {additionalStake ? (
                <div className="vault__form">
                  <input
                    type="text"
                    placeholder="0.00"
                    className="vault__field"
                    onChange={onChangeField}
                    value={stakeValue > 0 ? stakeValue : ""}
                  />
                  <button type="button" className="vault__max">
                    MAX
                  </button>
                </div>
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
        )}
      </div>
      <div className="vault__foot">
        <div className="vault__value">
          Available limit:
          <span>
            {formatNumber(data.maxLock)} {data.earn}
          </span>
          <div className="progress">
            <div className="progress-bar" style={{ width: `0%` }} />
          </div>
        </div>
        <div className="vault__value">
          Total Staked:
          <span>
            {formatNumber(0)} {data.earn}
          </span>
        </div>
      </div>
    </div>
  );
}
