import classnames from "classnames";
import { MsgExecuteContract } from "@terra-money/terra.js";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import Modal from "../components/modal";
import LoadingOverlay from "../components/loadingOverlay";
import {
  parseUnits,
  formatDate,
  formatNumber,
  useGlobalState,
  getContracts,
  formatUnits,
  contractAddresses,
  runTransaction,
  runTransactionTerra,
  formatErrorMessage,
} from "../utils";

const assets = {
  xrune: {
    name: "XRUNE",
    token: "xrune",
  },
};

const tiers = [
  { name: "Tier 1", amount: 2500, multiplier: 1 },
  { name: "Tier 2", amount: 7500, multiplier: 2 },
  { name: "Tier 3", amount: 25000, multiplier: 4 },
  { name: "Tier 4", amount: 75000, multiplier: 8 },
  { name: "Tier 5", amount: 150000, multiplier: 12 },
];

function useTiers() {
  const state = useGlobalState();
  const [data, setData] = useState(null);

  async function fetchData() {
    if (!state.address) return;

    if (state.networkId === "terra-mainnet") {
      const contracts = contractAddresses[state.networkId];
      const tiersState = await state.lcd.wasm.contractQuery(contracts.tiers, {
        state: {},
      });
      const tiersBalance = await state.lcd.wasm.contractQuery(contracts.xrune, {
        balance: { address: contracts.tiers },
      });
      const user = await state.lcd.wasm.contractQuery(contracts.tiers, {
        user_state: { user: state.address },
      });
      const balance = await state.lcd.wasm.contractQuery(contracts.xrune, {
        balance: { address: state.address },
      });
      setData({
        tiersBalance: parseUnits(tiersBalance.balance, 12),
        tiersTotal: parseUnits(tiersState.total_balance, 12),
        balance: parseUnits(balance.balance, 12),
        total: tiersState.total_balance == 0 ? parseUnits('0') : parseUnits(user.balance, 12)
          .mul(parseUnits(tiersBalance.balance, 12))
          .div(parseUnits(tiersState.total_balance, 12)),
        lastDeposit: user.last_deposit,
      });
    } else {
      const contracts = getContracts();
      const user = await contracts.tiers.userInfos(state.address);
      const userInfo = await contracts.tiers.userInfoAmounts(state.address);
      setData({
        balance: await contracts.xrune.balanceOf(state.address),
        total: userInfo[4][0],
        lastDeposit: user[1].toNumber(),
      });
    }
  }

  useEffect(() => {
    fetchData();
    const handle = setInterval(() => fetchData(), 5000);
    return () => clearTimeout(handle);
  }, [state.networkId, state.address]);

  async function onDeposit({ amount, setError, setLoading }) {
    if (String(state.networkId).startsWith("terra-")) {
      await runTransactionTerra(
        {
          msgs: [
            new MsgExecuteContract(
              state.address,
              contractAddresses[state.networkId].xrune,
              {
                send: {
                  amount: amount.div("1000000000000").toString(),
                  contract: contractAddresses[state.networkId].tiers,
                  msg: btoa(JSON.stringify({ bond: {} })),
                },
              }
            ),
          ],
        },
        setLoading,
        setError
      );
    } else {
      const contracts = getContracts();
      const call = contracts.xrune.transferAndCall(
        contracts.tiers.address,
        amount,
        "0x"
      );
      await runTransaction(call, setLoading, setError);
    }
  }

  async function onWithdraw({
    data,
    amount,
    before7Days,
    setError,
    setLoading,
  }) {
    if (String(state.networkId).startsWith("terra-")) {
      await runTransactionTerra(
        {
          msgs: [
            new MsgExecuteContract(
              state.address,
              contractAddresses[state.networkId].tiers,
              {
                [before7Days ? "unbond_now" : "unbond"]: {
                  amount: amount.mul(data.tiersTotal).div(data.tiersBalance).div("1000000000000").toString(),
                },
              }
            ),
          ],
        },
        setLoading,
        setError
      );
    } else {
      const contracts = getContracts();
      const call = before7Days
        ? contracts.tiers.withdrawNow(
            contractAddresses[state.networkId].xrune,
            amount,
            state.address
          )
        : contracts.tiers.withdraw(
            contractAddresses[state.networkId].xrune,
            amount,
            state.address
          );
      await runTransaction(call, setLoading, setError);
    }
  }

  return { data, fetchData, onDeposit, onWithdraw };
}

export default function Tiers() {
  const state = useGlobalState();
  const { data, fetchData, onDeposit, onWithdraw } = useTiers();
  const [modal, setModal] = useState();
  const [percent, setPercent] = useState("0");
  const total = data ? parseFloat(formatUnits(data.total)) : 0;

  useEffect(() => {
    if (typeof document !== "undefined" && data?.total) {
      const tiersCount = tiers.length;
      const totalWidth = document
        .querySelector(".tiers-wrapper__line")
        .getBoundingClientRect().width;

      let basePercent = 0;
      let thisTier = 0;
      let nextTier = tiers[0].amount;
      for (let i = 0; total >= tiers[i].amount; i++) {
        basePercent = i * (100 / tiersCount) + 50 / tiersCount;
        thisTier = tiers[i].amount;
        if (i === tiersCount - 1) {
          nextTier = 200000;
          break;
        } else {
          nextTier = tiers[i + 1].amount;
        }
      }

      const value = Math.min(1, (total - thisTier) / (nextTier - thisTier));
      const partWidth = totalWidth / tiersCount;
      const position = partWidth * value;
      setPercent(`calc(${basePercent}% + ${position - 24}px)`);
    }
  }, [data, total]);

  function onStartDeposit() {
    setModal({ type: "deposit" });
  }

  function onStartWithdraw() {
    setModal({ type: "withdraw" });
  }

  function onClose() {
    setModal();
    fetchData();
  }

  const isTerra = String(state.networkId).startsWith("terra-");
  return (
    <Layout title="Tiers" page="tiers">
      <div className="flex-heading">
        <h1 className="title">Tiers</h1>
        {!isTerra ? (
          <span className="apy-label">
            APY: <strong>10%</strong>
          </span>
        ) : null}
      </div>

      <div className="tiers-wrapper">
        <div className="tiers-wrapper__line">
          <div className="tiers-wrapper__progress" style={{ width: percent }}>
            <div className="tiers-wrapper__data">
              Your score:{" "}
              <span>{data ? formatNumber(data.total, 0) : "-"}</span>
            </div>
          </div>
        </div>
        <div className="tiers-wrapper__grid">
          {tiers.map((t) => (
            <div className="tiers-wrapper__col" key={t.name}>
              <div
                className={classnames("tiers-wrapper__block", {
                  "is-active": total >= t.amount,
                })}
              >
                <div className="tiers-wrapper__caption">{t.name}</div>
                <div className="tiers-wrapper__sum">
                  {formatNumber(parseUnits(String(t.amount)))}
                </div>
              </div>
              <div className="tiers-wrapper__foot">
                <div className="tiers-wrapper__subtext">
                  Allocation <br />
                  Multiplier
                </div>
                <div
                  className={classnames("tiers-wrapper__num", {
                    "is-active": total >= t.amount,
                  })}
                >
                  {t.multiplier}x
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* <UpcomingIDORegistration
        ido="LUART"
        size={500000}
        xrune={data ? data.total : parseUnits("0")}
      /> */}

      <section className="page-section">
        <h3 className="title">Deposit</h3>
        <div className="default-table">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Balance</th>
                <th>Staked{!isTerra ? " (Including 10% APY)" : null}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>XRUNE</td>
                <td>{data ? formatNumber(data.balance) : "-"}</td>
                <td>{data ? formatNumber(data.total) : "-"}</td>
                <td className="tar">
                  <Button onClick={onStartDeposit} disabled={!data}>
                    Deposit
                  </Button>
                  <Button
                    onClick={onStartWithdraw}
                    disabled={!data}
                    className="button-outline"
                  >
                    Withdraw
                  </Button>
                </td>
              </tr>
              {/*
              <tr>
                <td>ThorWallet NFT</td>
                <td className="tac" style={{ width: 110 }}>
                  {data ? formatNumber(data.balances.twnft, 0, 0) : "-"}
                </td>
                <td className="tac" style={{ width: 110 }}>
                  N/A
                </td>
                <td className="tar">
                  {total === 0 && data && data.balances.twnft.toNumber() > 0 ? (
                    <Button onClick={onSignup} disabled={!data}>
                      Click For NFT Credit
                    </Button>
                  ) : null}
                </td>
              </tr>
              */}
            </tbody>
          </table>
        </div>
        {/*
        <div className="grid">
          <div className="default-table">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th className="tac">Balance</th>
                  <th className="tac">Staked</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Some TOKEN</td>
                  <td className="tac" style={{ width: 110 }}>
                    999 <br />
                    <Button className="button-sm">Deposit</Button>
                  </td>
                  <td className="tac" style={{ width: 110 }}>
                    20 <br />
                    <Button className="button-outline button-sm">
                      Withdraw
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="default-table">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th className="tac">Balance</th>
                  <th className="tac">Staked</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Some NFT</td>
                  <td className="tac" style={{ width: 110 }}>
                    1
                  </td>
                  <td className="tac" style={{ width: 110 }}>
                    N/A
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        */}
      </section>

      {modal && modal.type === "deposit" ? (
        <ModalDeposit
          asset={modal.asset}
          data={data}
          onClose={onClose}
          onDeposit={onDeposit}
        />
      ) : null}
      {modal && modal.type === "withdraw" ? (
        <ModalWithdraw
          asset={modal.asset}
          data={data}
          onClose={onClose}
          onWithdraw={onWithdraw}
        />
      ) : null}
    </Layout>
  );
}

function ModalDeposit({ data, onClose, onDeposit }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [amount, setAmount] = useState("");

  function onSubmit() {
    if (!data) return;
    let parsedAmount;
    try {
      parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""));
      if (Number.isNaN(parsedAmount)) throw new Error("!number");
    } catch (err) {
      setError("Not a valid number");
      return;
    }
    onDeposit({ amount: parsedAmount, setError, setLoading }).then(() =>
      onClose()
    );
  }

  if (!data) {
    return <LoadingOverlay message={"Loading..."} />;
  }
  return (
    <Modal onClose={onClose} style={{ maxWidth: 400 }}>
      <h2>Deposit XRUNE</h2>

      <p className="text-sm text-gray6">
        Warning: You have to wait 7 days to withdraw XRUNE after each deposit
        (you can withdraw before 7 days at a cost of 50% of the amount).
      </p>

      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}

      <label>Balance: {formatNumber(data.balance)}</label>
      <br />
      <div className="input-with-link">
        <input
          type="text"
          className="input w-full mt-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
        <a
          className="input-link"
          style={{ top: 22 }}
          onClick={() => setAmount(formatUnits(data.balance))}
        >
          Max
        </a>
      </div>
      <Button className="mt-4 w-full" onClick={onSubmit}>
        Deposit
      </Button>
    </Modal>
  );
}

function ModalWithdraw({ data, onWithdraw, onClose }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [amount, setAmount] = useState("");
  const before7Days = data
    ? Date.now() / 1000 < data.lastDeposit + 7 * 24 * 60 * 60
    : true;

  function onSubmit() {
    if (!data) return;
    let parsedAmount;
    try {
      parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""));
      if (Number.isNaN(parsedAmount)) throw new Error("!number");
    } catch (err) {
      setError("Not a valid number");
      return;
    }
    onWithdraw({
      data,
      amount: parsedAmount,
      before7Days,
      setError,
      setLoading,
    }).then(() => onClose());
  }

  if (!data) {
    return <LoadingOverlay message={"Loading..."} />;
  }
  return (
    <Modal onClose={onClose} style={{ maxWidth: 400 }}>
      <h2>Withdraw XRUNE</h2>

      <div className="text-sm">
        Last Deposit: <strong>{formatDate(data.lastDeposit * 1000)}</strong>
      </div>
      <div className="text-sm mb-2">
        No Penalty Withdraw:{" "}
        <strong>
          {formatDate((data.lastDeposit + 7 * 24 * 60 * 60) * 1000)}
        </strong>
      </div>

      {before7Days ? (
        <p className="error text-sm">
          WARNING You are withdrawing before waiting 7 days after you last
          deposit. You will lose half of the amount you withdraw if you don&apos;t
          wait.
        </p>
      ) : null}

      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}

      <label>Staked: {formatNumber(data.total)}</label>
      <br />
      <div className="input-with-link">
        <input
          type="text"
          className="input w-full mt-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />
        <a
          className="input-link"
          style={{ top: 22 }}
          onClick={() => setAmount(formatUnits(data.total))}
        >
          Max
        </a>
      </div>
      <Button className="mt-4 w-full" onClick={onSubmit}>
        Withdraw{before7Days ? " (and lose 50%)" : ""}
      </Button>
    </Modal>
  );
}

function UpcomingIDORegistration({ ido, size, xrune }) {
  const state = useGlobalState();
  const [data, setData] = useState();
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressTerra, setAddressTerra] = useState('');

  async function fetchData() {
    const rawStats = await fetch(
      "https://thorstarter-tiers-api.herokuapp.com/stats?ido=" + ido
    ).then((r) => r.json());
    const stats = {};
    let totalAllocations = 0;
    for (let i = 0; i <= tiers.length; i++) {
      const s = rawStats.stats.find((s) => s.tier === i) || { count: 0 };
      const multiplier = i === 0 ? 0.25 : tiers[i - 1].multiplier;
      const allocations = s.count * multiplier;
      stats[i] = { count: s.count, chance: 1, allocations, multiplier };
      totalAllocations += allocations;
    }
    for (let i = 0; i <= tiers.length; i++) {
      const tier = stats[i];
      const minAllocation = i === 0 ? 25 : 100;
      tier.allocation = (size / totalAllocations) * tier.multiplier;
      if (tier.allocation < minAllocation) {
        tier.chance =
          (tier.count * tier.allocation) / minAllocation / tier.count;
        tier.allocation = minAllocation;
      }
    }

    let user;
    let tier0 = false;
    if (state.address) {
      user = await fetch(
        "https://thorstarter-tiers-api.herokuapp.com/user?address=" +
          state.address
      ).then((r) => r.json());
      const lp = await fetch(
        "https://thorstarter-xrune-liquidity.herokuapp.com/get?address=" +
          state.address
      ).then((r) => r.json());
      if (lp.units != "0") {
        tier0 = true;
      }
      const contracts = getContracts();
      const tgBalance = await contracts.tgnft.balanceOf(state.address);
      if (tgBalance.gt("0")) {
        tier0 = true;
      }
    }
    const registered = user
      ? user.registrations.find((r) => r.ido === ido.toLowerCase())
      : null;
    setData({ stats, user, registered, tier0 });
  }

  useEffect(() => {
    fetchData();
  }, [state.address]);

  function onRegister() {
    setModal(true);
  }

  async function onSubmit() {
    try {
      setLoading(true);
      const xruneBalance = parseFloat(formatUnits(xrune)) | 0;
      let tier = 0;
      for (let i = 0; i < tiers.length; i++) {
        if (xruneBalance >= tiers[i].amount) {
          tier = i + 1;
        }
      }
      const res = await fetch(
        "https://thorstarter-tiers-api.herokuapp.com/register?ido=" + ido,
        {
          method: "POST",
          body: JSON.stringify({
            address: state.address,
            tier: tier.toFixed(0),
            xrune: xruneBalance.toFixed(0),
            bonus: "1",
            terra: addressTerra,
          }),
        }
      );
      if (!res.ok) {
        throw new Error('Bad error code: ' + res.status);
      }
      setAddressTerra('');
      fetchData();
      setModal(false);
    } catch (err) {
      console.error(err);
      alert("Error: " + formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!data) return null;
  return (
    <div className="tiers-upcoming-ido">
      <div className="flex">
        <div className="flex-1">
          <h2>Register Interest in the upcoming ${ido} IDO.</h2>
          <p>
            Click the button on the right to indicate that you want to get an
            allocation in the upcoming IDO.
          </p>
        </div>
        <div>
          <button
            className="button"
            onClick={onRegister}
            disabled={
              !state.address ||
              (!data.tier0 && xrune.eq("0"))
            }
          >
            {data.registered
              ? "You Are Registered!"
              : state.address
              ? !data.tier0 && xrune.eq("0")
                ? "Join a tier first"
                : "Register Interest"
              : "Connect Wallet"}
          </button>
        </div>
      </div>
      <strong>Estimated Allocations (based on registrations)</strong>
      <table>
        <tbody>
          <tr>
            <th>Tier 0</th>
            <th>Tier 1</th>
            <th>Tier 2</th>
            <th>Tier 3</th>
            <th>Tier 4</th>
            <th>Tier 5</th>
          </tr>
          <tr>
            <td>
              $ {data.stats[0].allocation.toFixed(0)}{" "}
              {data.stats[0].chance !== 1
                ? `(${(data.stats[0].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[1].allocation.toFixed(0)}{" "}
              {data.stats[1].chance !== 1
                ? `(${(data.stats[1].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[2].allocation.toFixed(0)}{" "}
              {data.stats[2].chance !== 1
                ? `(${(data.stats[2].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[3].allocation.toFixed(0)}{" "}
              {data.stats[3].chance !== 1
                ? `(${(data.stats[3].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[4].allocation.toFixed(0)}{" "}
              {data.stats[4].chance !== 1
                ? `(${(data.stats[4].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[5].allocation.toFixed(0)}{" "}
              {data.stats[5].chance !== 1
                ? `(${(data.stats[5].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
          </tr>
          <tr>
            <td>
              {data.stats[0].count} ({data.stats[0].allocations})
            </td>
            <td>
              {data.stats[1].count} ({data.stats[1].allocations})
            </td>
            <td>
              {data.stats[2].count} ({data.stats[2].allocations})
            </td>
            <td>
              {data.stats[3].count} ({data.stats[3].allocations})
            </td>
            <td>
              {data.stats[4].count} ({data.stats[4].allocations})
            </td>
            <td>
              {data.stats[5].count} ({data.stats[5].allocations})
            </td>
          </tr>
        </tbody>
      </table>

      {modal ? (
        <Modal onClose={() => setModal(false)} style={{width: 400}}>
          <h2>Register</h2>
          <label className="label">Terra Address</label>
          <input value={addressTerra} onChange={e => setAddressTerra(e.target.value)} className="input w-full" placeholder="terra123..." />
          <br/>
          <button className="button mt-4" onClick={onSubmit} disabled={loading}>{loading ? 'Loading...' : 'Register'}</button>
        </Modal>
      ) : null}
    </div>
  );
}
