import classnames from "classnames";
import Image from "next/image";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import LoadingOverlay from "../components/loadingOverlay";
import Vault from "../components/vault";
import IDORegistration from "../components/idoRegistration";
import {
  bn,
  parseUnits,
  useGlobalState,
  getContracts,
  aprdToApy,
  formatUnits,
  formatNumber,
  formatMDY,
  runTransaction,
} from "../utils";
import forgeTitleImg from "../public/forge-title.png";

async function fetchPrice() {
  const req = await fetch(
    "https://1e35cbc19de1456caf8c08b2b4ead7d2.thorstarter.org/005cf62030316481c442e0ed49580de500/",
    { method: "POST" }
  );
  const res = await req.json();
  return parseFloat(res.xrune.quote.USD.price);
}

export default function Forge({ history }) {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [depositAmount, setDepositAmount] = useState("10000");
  const [depositDays, setDepositDays] = useState("60");
  const [calcSaleRaise, setCalcSaleRaise] = useState("300000");
  const [calcSalesPerYear, setCalcSalesPerYear] = useState("24");
  const [calcSaleRoi, setCalcSaleRoi] = useState("5");
  const [calcSaleAllocation, setCalcSaleAllocation] = useState("250");
  const [xrunePrice, setXrunePrice] = useState(0.1);
  const [data, setData] = useState();

  const amount = parseFloat(depositAmount);
  const shares =
    amount +
    (amount * parseInt(depositDays) * 6) / 365 +
    (amount * amount * 0.1) / 1000000;
  const totalShares = Math.max(
    data ? parseFloat(formatUnits(data.totalShares)) : 0,
    20000000
  );
  const estimatedReturn =
    (shares *
      parseInt(calcSalesPerYear) *
      parseInt(calcSaleRaise) *
      0.2 *
      (parseInt(calcSaleRoi) / 2)) /
    totalShares;
  const estimatedApr = estimatedReturn / (amount * xrunePrice);
  const estimatedSaleReturn =
    parseInt(calcSaleAllocation) *
    parseInt(calcSalesPerYear) *
    (parseInt(calcSaleRoi) - 1);
  const estimatedSaleApr = estimatedSaleReturn / (amount * xrunePrice);

  async function fetchData() {
    setXrunePrice(await fetchPrice());
    if (!state.address) return;
    if (state.networkId !== 250 && state.networkId !== 3) return;

    const contracts = getContracts();
    const totalShares = await contracts.forge.totalSupply();
    const infos = await contracts.forge.getUserInfo(state.address);
    const deposits = [];
    for (let i = 0; i < infos[2].toNumber(); i++) {
      deposits.push(await contracts.forge.users(state.address, i));
    }
    setData({
      totalShares,
      userAmount: infos[0],
      userShares: infos[1],
      deposits,
    });
  }

  useEffect(() => {
    fetchData();
  }, [state.networkId, state.address]);

  function onDeposit(e) {
    try {
      e.preventDefault();
      const contracts = getContracts();
      const parsedAmount = parseUnits(depositAmount);
      const call = contracts.xrune.transferAndCall(
        contracts.forge.address,
        parsedAmount,
        ethers.utils.defaultAbiCoder.encode(["uint256"], [depositDays])
      );
      runTransaction(call, setLoading, setError).then(() => {
        setDepositAmount("10000");
        setDepositDays("60");
        fetchData();
      });
    } catch (err) {
      console.error(err);
      setError("Invalid amount");
    }
  }

  function onWithdraw(deposit, i) {
    const contracts = getContracts();
    const now = (Date.now() / 1000) | 0;
    const start = deposit.lockTime.toNumber();
    const duration = deposit.lockDays.toNumber() * 24 * 60 * 60;
    const unlockTime = start + duration;
    if (now < unlockTime) {
      const returned = deposit.amount.mul(now - start).div(duration);
      if (
        !confirm(
          `You are unlocking early. You will receive only ${formatNumber(
            returned
          )} XRUNE (paying a fee of ${formatNumber(
            deposit.amount.sub(returned)
          )} XRUNE). Are you sure you want to proceed?`
        )
      ) {
        return;
      }
      const call = contracts.forge.unstakeEarly(i);
      runTransaction(call, setLoading, setError).then(() => fetchData);
    } else {
      const call = contracts.forge.unstake(i);
      runTransaction(call, setLoading, setError).then(() => fetchData);
    }
  }

  if (state.networkId !== 3 && state.networkId !== 250) {
    return (
      <Layout title="Forge" page="forge">
        <h1 className="title tac">
          <Image
            alt="Forge"
            src={forgeTitleImg}
            width={233}
            height={100}
            layout="fixed"
          />
        </h1>
        <div className="tac">
          Forge is only available on the Fantom network.
        </div>
      </Layout>
    );
  }
  return (
    <Layout title="Forge" page="forge">
      <IDORegistration />

      <h1 className="title tac">
        <Image
          alt="Forge"
          src={forgeTitleImg}
          width={233}
          height={100}
          layout="fixed"
        />
      </h1>

      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}

      <div
        className="flex flex-wrap"
        style={{ maxWidth: "800px", margin: "0 auto" }}
      >
        <div style={{ flex: "1 0 400px" }}>
          <div className="box mb-4">
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>
              Shares
              <sup style={{ fontWeight: "normal" }}>
                <a href="#shares-explainer">?</a>
              </sup>
              :{" "}
              <span className="text-primary5">
                {formatNumber(data ? data.userShares : 0)}
              </span>
            </div>
            <div className="mt-4" style={{ fontSize: "18px" }}>
              XRUNE Deposited:{" "}
              <span className="text-primary5">
                {formatNumber(data ? data.userAmount : 0)}
              </span>{" "}
            </div>
            <div className="mt-2" style={{ fontSize: "18px" }}>
              Forge Total Shares:{" "}
              <span className="text-primary5">
                {formatNumber(data ? data.totalShares : 0)}
              </span>
            </div>
          </div>

          <form className="box" onSubmit={onDeposit}>
            <h3 style={{ marginTop: 0 }}>Deposit</h3>
            <div className="mb-4">
              <label className="label">XRUNE Amount</label>
              <input
                className="input w-full"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="label">
                Lock Duration: {depositDays} days (
                {(depositDays / 30).toFixed(1)} months)
              </label>
              <input
                className="w-full"
                type="range"
                min="15"
                max="1095"
                step="1"
                value={depositDays}
                onChange={(e) => setDepositDays(e.target.value)}
              />
            </div>
            <button className="button w-full mb-4" type="submit">
              Lock for {depositDays} days
            </button>
            <div style={{ fontSize: 13 }}>
              WARNING: Withdrawing before the end of your commitment has a
              percentage fee proportional to the time left (e.g. commit to 60
              days, withdraw at 15 days, keep 25%, loose 75%). Forge rewards are
              only claimable after your lock period is over.
            </div>
          </form>
        </div>

        <div style={{ flex: "1 0 400px" }}>
          <div className="box mb-4" style={{ background: "var(--gray1)" }}>
            <h3 style={{ marginTop: 0 }}>Calculator</h3>
            <div>
              Shares: <b className="float-right">{formatNumber(shares)}</b>
            </div>
            <div>
              Forge APR:{" "}
              <b className="float-right">
                {formatNumber(estimatedApr * 100, 2)}%
              </b>
            </div>
            <div>
              Forge Yearly Return:{" "}
              <b className="float-right">
                $ {formatNumber(estimatedReturn, 2)}
              </b>
            </div>
            <div>
              Sale APR:{" "}
              <b className="float-right">
                {formatNumber(estimatedSaleApr * 100, 2)}%
              </b>
            </div>
            <div>
              Sale Return:{" "}
              <b className="float-right">
                $ {formatNumber(estimatedSaleReturn, 2)}
              </b>
            </div>
            <div>
              Combined APR:{" "}
              <b className="float-right">
                {formatNumber((estimatedApr + estimatedSaleApr) * 100, 2)}%
              </b>
            </div>
            <div className="mt-4">
              Assumed sales per year:{" "}
              <b className="float-right">{calcSalesPerYear}</b>
              <input
                className="w-full"
                type="range"
                min="6"
                max="60"
                step="1"
                value={calcSalesPerYear}
                onChange={(e) => setCalcSalesPerYear(e.target.value)}
              />
            </div>
            <div>
              Assumed average raise:{" "}
              <b className="float-right">
                {formatNumber(parseInt(calcSaleRaise), 0)}
              </b>
              <input
                className="w-full"
                type="range"
                min="100000"
                max="2000000"
                step="1000"
                value={calcSaleRaise}
                onChange={(e) => setCalcSaleRaise(e.target.value)}
              />
            </div>
            <div>
              Assumed ROI per sale:{" "}
              <b className="float-right">
                {formatNumber(parseInt(calcSaleRoi), 0)}x
              </b>
              <input
                className="w-full"
                type="range"
                min="1"
                max="100"
                step="1"
                value={calcSaleRoi}
                onChange={(e) => setCalcSaleRoi(e.target.value)}
              />
            </div>
            <div>
              Assumed average sale allocation:
              <b className="float-right">
                $ {formatNumber(parseInt(calcSaleAllocation), 0)}
              </b>
              <input
                className="w-full"
                type="range"
                min="25"
                max="5000"
                step="5"
                value={calcSaleAllocation}
                onChange={(e) => setCalcSaleAllocation(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div id="shares-explainer">
        <div
          style={{ maxWidth: "800px", margin: "32px auto", fontSize: "16px" }}
        >
          <h3 style={{ margin: "0 0 8px 0" }}>Shares Explained</h3>
          <p>
            Shares are a representation of how much Forge rewards you are owed.
          </p>
          <p>
            Simply put, all rewards going to Forge are divided up proportionally
            to every member based on how many shares they have (you have 2
            shares, and the total number of Forge shares is 100, you get 2% of
            every reward distribution.)
          </p>
          <p>
            Another way to see it, is shares represent the boosted APY you get
            *on top of* the amount of XRUNE you lock (varying depending on how
            long you lock it for).
          </p>
        </div>
      </div>

      <section className="page-section">
        <h3 className="title">Deposits</h3>
        <div className="default-table">
          <table>
            <thead>
              <tr>
                <th className="tal">Start</th>
                <th className="tal">End</th>
                <th className="tar">Amount</th>
                <th className="tar">Shares</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data && data.deposits.length > 0 ? (
                data.deposits.map((d, i) => (
                  <tr key={d.lockTime}>
                    <td className="tal">{formatMDY(d.lockTime)}</td>
                    <td className="tal">
                      {formatMDY(
                        d.lockTime.toNumber() * 1000 +
                          d.lockDays.toNumber() * 24 * 60 * 60 * 1000
                      )}
                    </td>
                    <td className="tar">{formatNumber(d.amount)}</td>
                    <td className="tar">{formatNumber(d.shares)}</td>
                    <td className="tar">
                      <Button
                        className="button-outline"
                        onClick={onWithdraw.bind(null, d, i)}
                        disabled={d.unstakedTime.toNumber() > 0}
                      >
                        {d.unstakedTime.toNumber() == 0
                          ? "Withdraw"
                          : "Unstaked"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="tac">
                    No deposits yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}
