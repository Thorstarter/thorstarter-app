import { useEffect, useState } from "react";
import Image from "next/image";
import { MsgExecuteContract, Fee, Coin } from "@terra-money/terra.js";
import Layout from "../components/layout";
import Button from "../components/button";
import LoadingOverlay from "../components/loadingOverlay";
import Countdown from "../components/countdown";
import Disclaimer from "../components/disclaimer";
import {
  bn,
  bnMax,
  useGlobalState,
  getContracts,
  parseUnits,
  formatUnits,
  formatNumber,
  runTransactionTerra,
  useCountry,
} from "../utils";

import brokkrLogo from "../public/brokkr_logo.svg";

const saleAddress = "terra1wyjx8t64rswat0a6kyu0tvcvsu3a5hcpc0t683";

export default function Brokkr() {
  const state = useGlobalState();
  const country = useCountry();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [amount, setAmount] = useState("");
  const [data, setData] = useState();
  let stage = "";
  if (data && data.now < data.endDepositTime) {
    stage = "commit";
  } else if (data && data.now < data.endWithdrawTime) {
    stage = "withdraw";
  } else if (data) {
    stage = "claim";
  }

  async function fetchData() {
    if (state.networkId !== "terra-classic") return;
    const now = (Date.now() / 1000) | 0;
    const saleState = await state.lcd.wasm.contractQuery(saleAddress, {
      state: {},
    });
    const userState = await state.lcd.wasm.contractQuery(saleAddress, {
      user_state: { user: state.address, now: now },
    });

    const balances = await state.lcd.bank.balance(state.address);
    const balance = (
      balances[0].map((b) => b).find((b) => b.denom === "uusd") || {
        amount: "0",
      }
    ).amount.toString();

    const saleOfferingAmount = parseUnits(saleState.offering_amount, 0);
    const saleTotalAmount = parseUnits(saleState.total_amount, 0);
    const salePrice = bnMax(
      saleTotalAmount
        .mul(1000000)
        .div(bnMax(saleOfferingAmount, parseUnits("1", 0))),
      parseUnits(saleState.min_price, 0)
    );

    const claimed = parseUnits(userState.claimed, 0);
    const owed = parseUnits(userState.owed, 0);

    const userAmount = parseUnits(userState.amount, 0);
    const userAmountHigh = parseUnits(userState.amount_high, 0);
    let progress =
      (now - saleState.end_deposit_time) /
      (saleState.end_withdraw_time - saleState.end_deposit_time);
    progress = 1 - progress;
    if (progress > 0.95) progress = 1;
    if (progress < 0) progress = 0;
    let withdrawMax = parseUnits(userState.amount_high, 0)
      .mul((progress * 1000000) | 0)
      .div(1000000);
    withdrawMax = withdrawMax.sub(userAmountHigh.sub(userAmount));
    if (withdrawMax.lt(0)) {
      withdrawMax = parseUnits("0");
    }
    let withdrawMaxPreCap = withdrawMax;
    if (withdrawMax.gt(userAmount)) {
      withdrawMax = userAmount;
    }

    setData({
      now,
      startTime: saleState.start_time,
      endDepositTime: saleState.end_deposit_time,
      endWithdrawTime: saleState.end_withdraw_time,
      saleOfferingAmount,
      saleTotalAmount,
      salePrice: salePrice,
      sale: saleState,
      userBalance: parseUnits(balance, 0),
      userAmount: userAmount,
      userAmountHigh: userAmountHigh,
      claimedTokens: owed.sub(claimed).eq("0"),
      claimable: parseUnits(userState.claimable, 0),
      claimed,
      owed,
      withdrawMax,
      withdrawMaxPreCap,
    });
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 10000);
    return () => clearInterval(handle);
  }, [state.networkId, state.address]);

  async function execute(call, coins = []) {
    setError("");
    try {
      await runTransactionTerra(
        {
          msgs: [
            new MsgExecuteContract(state.address, saleAddress, call, coins),
          ],
        },
        setLoading,
        setError
      );
      setAmount("");
    } catch (e) {
      console.log("err", e);
    }
    fetchData();
    setTimeout(fetchData, 5000);
    setTimeout(fetchData, 10000);
    setTimeout(fetchData, 20000);
  }

  function onReset() {
    const now = (Date.now() / 1000) | 0;
    execute({
      configure: {
        token: "terra1td743l5k5cmfy7tqq202g7vkmdvq35q48u2jfm",
        start_time: now + 60,
        end_deposit_time: now + 180,
        end_withdraw_time: now + 300,
        min_price: "50000",
        offering_amount: "10000000" + "000000",
        vesting_initial: "1000000",
        vesting_time: 1,
        finalized: true,
        merkle_root: "",
      },
    });
  }

  function onDeposit(e) {
    e.preventDefault();
    let parsedAmount;
    try {
      parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""), 6);
      setAmount(formatUnits(parsedAmount, 6));
    } catch (e) {
      setError("Invalid amount entered");
      return;
    }
    execute(
      {
        deposit: { allocation: "0", proof: [] },
      },
      [new Coin("uusd", parsedAmount.toString())]
    );
  }

  function onWithdraw(e) {
    e.preventDefault();
    let parsedAmount;
    try {
      parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""), 6);
      setAmount(formatUnits(parsedAmount, 6));
    } catch (e) {
      setError("Invalid amount entered");
      return;
    }
    if (parsedAmount.gt(data.withdrawMax)) {
      setError("Withdraw amount over cap");
      return;
    }
    execute({
      withdraw: { amount: formatUnits(parsedAmount, 0) },
    });
  }

  function onHarvest(e) {
    e.preventDefault();
    execute({
      harvest: {},
    });
  }

  function onDepositMax() {
    setAmount(formatUnits(data.userBalance, 6).slice(0, -2));
  }

  function onWithdrawMax() {
    setAmount(formatUnits(data.withdrawMax, 6).slice(0, -2));
  }

  if (state.networkId !== "terra-classic") {
    return (
      <Layout title="Brokkr Sale" page="brokkr">
        <h1 className="title tac">Brokkr Sale</h1>
        <div className="tac">Switch to the Terra classic network.</div>
      </Layout>
    );
  }
  if (country === "US" || country === "RU") {
    return (
      <Layout title="Brokkr Sale" page="brokkr">
        <h1 className="title tac">Brokkr Sale</h1>
        <div className="tac">
          This sale is not available to USA and Russian users.
        </div>
      </Layout>
    );
  }
  return (
    <Layout title="Brokkr Sale" page="brokkr">
      {/*
      <button className="button mb-4" onClick={onReset}>
        DEBUG: Restart sale
      </button>
      */}

      <Disclaimer />

      <div className="brokkr-container">
        <h1 className="title tac">
          <span style={{ position: "relative", top: "10px" }}>
            <Image
              alt="Brokkr logo"
              src={brokkrLogo}
              width={200}
              height={52.56}
            />
          </span>{" "}
          Sale
        </h1>

        {error ? <div className="error mb-4">{error}</div> : null}
        {loading ? <LoadingOverlay message={loading} /> : null}

        <div className={`brokkr-section ${stage === "commit" ? "active" : ""}`}>
          <h1>
            <span>1</span> Commit
          </h1>
          {stage === "commit" && data.now < data.startTime ? (
            <div className="brokkr-time">
              Starts in&nbsp;
              <Countdown simple to={new Date(data.startTime * 1000)} />
            </div>
          ) : stage === "commit" && data.now < data.endDepositTime ? (
            <div className="brokkr-time">
              Ends in&nbsp;
              <Countdown simple to={new Date(data.endDepositTime * 1000)} />
            </div>
          ) : null}
          {stage === "commit" ? (
            <form className="mt-4">
              <div className="flex">
                <div className="flex-1">Tokens Available:</div>
                <div>
                  <b>{formatNumber(data.saleOfferingAmount, 2, 6)}</b> BRO
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Total Deposited:</div>
                <div>
                  <b>{formatNumber(data.saleTotalAmount, 2, 6)}</b> UST
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Current Price:</div>
                <div>
                  <b>{formatNumber(data.salePrice, 3, 6)}</b> UST/BRO
                </div>
              </div>
              <div className="flex mt-2">
                <div className="flex-1">You Deposited:</div>
                <div>
                  <b>{formatNumber(data.userAmount, 2, 6)}</b> UST
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Owed:</div>
                <div>
                  <b>{formatNumber(data.owed, 2, 6)}</b> BRO
                </div>
              </div>
              <div className="text-sm mb-3 mt-4">
                <span className="text-gray6">Balance: </span>
                <span className="text-primary5">
                  {formatNumber(data.userBalance, 2, 6)} UST
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
                className="button-lg w-full"
                onClick={onDeposit}
                disabled={loading || data.now < data.startTime}
              >
                {loading ? "Loading..." : "Deposit"}
              </Button>
            </form>
          ) : null}
        </div>

        <div
          className={`brokkr-section ${stage === "withdraw" ? "active" : ""}`}
        >
          <h1>
            <span>2</span> Withdraw
          </h1>
          {stage === "withdraw" && data.now < data.endWithdrawTime ? (
            <div className="brokkr-time">
              Ends in&nbsp;
              <Countdown simple to={new Date(data.endWithdrawTime * 1000)} />
            </div>
          ) : null}
          {stage === "withdraw" ? (
            <form className="mt-4">
              <div className="flex">
                <div className="flex-1">Tokens Available:</div>
                <div>
                  <b>{formatNumber(data.saleOfferingAmount, 2, 6)}</b> BRO
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Total Deposited:</div>
                <div>
                  <b>{formatNumber(data.saleTotalAmount, 2, 6)}</b> UST
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Current Price:</div>
                <div>
                  <b>{formatNumber(data.salePrice, 3, 6)}</b> UST/BRO
                </div>
              </div>
              <div className="flex mt-2">
                <div className="flex-1">You Deposited:</div>
                <div>
                  <b>{formatNumber(data.userAmount, 2, 6)}</b> UST
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Owed:</div>
                <div>
                  <b>{formatNumber(data.owed, 2, 6)}</b> BRO
                </div>
              </div>
              <div className="text-sm mb-3 mt-4">
                <span className="text-gray6">Max withdraw: </span>
                <span className="text-primary5">
                  {formatNumber(data.withdrawMax, 2, 6)} UST
                </span>
              </div>
              <div className="input-with-link mb-4">
                <input
                  className="input w-full"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <a onClick={onWithdrawMax} className="input-link">
                  Max
                </a>
              </div>
              <button
                className="button w-full mt-2"
                onClick={onWithdraw}
                disabled={data.userAmount.eq(0)}
              >
                Withdraw UST
              </button>
            </form>
          ) : null}
        </div>

        <div className={`brokkr-section ${stage === "claim" ? "active" : ""}`}>
          <h1>
            <span>3</span> Claim
          </h1>
          {stage === "claim" ? (
            <form className="mt-4">
              <div className="flex">
                <div className="flex-1">You Deposited:</div>
                <div>
                  <b>{formatNumber(data.userAmount, 2, 6)}</b> UST
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Owed:</div>
                <div>
                  <b>{formatNumber(data.owed, 2, 6)}</b> BRO
                </div>
              </div>
              <div className="flex">
                <div className="flex-1">Collected:</div>
                <div>
                  <b>{formatNumber(data.claimed, 2, 6)}</b> BRO
                </div>
              </div>
              <button
                className="button w-full mt-2"
                onClick={onHarvest}
                disabled={data.claimedTokens}
              >
                Claim Tokens
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
