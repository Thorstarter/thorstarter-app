import classnames from "classnames";
import { MsgExecuteContract } from "@terra-money/terra.js";
import { useEffect, useState } from "react";
import SynapsClient from "@synaps-io/verify.js";
import Layout from "../components/layout";
import Button from "../components/button";
import Modal from "../components/modal";
import LoadingOverlay from "../components/loadingOverlay";
import IDORegistration from "../components/idoRegistration";
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

const tiers = [
  { name: "Tier 1", amount: 2500, multiplier: 1 },
  { name: "Tier 2", amount: 7500, multiplier: 3 },
  { name: "Tier 3", amount: 25000, multiplier: 10 },
  { name: "Tier 4", amount: 50000, multiplier: 20 },
  { name: "Tier 5", amount: 100000, multiplier: 40 },
];

function useTiers() {
  const state = useGlobalState();
  const [data, setData] = useState(null);

  async function fetchData() {
    if (!state.address) return;

    let lpXrune = parseUnits("0");
    try {
      const pool = await fetch(
        "https://midgard.thorchain.info/v2/pool/ETH.XRUNE-0X69FA0FEE221AD11012BAB0FDB45D444D3D2CE71C"
      ).then((r) => r.json());
      const lp = await fetch(
        "https://thorstarter-xrune-liquidity.herokuapp.com/get?address=" +
          state.address
      ).then((r) => r.json());
      lpXrune = parseUnits(lp.units, 8)
        .mul(parseUnits(pool.assetDepth, 8))
        .div(parseUnits(pool.liquidityUnits, 8))
        .mul(parseUnits("100", 0));
    } catch (err) {
      console.error("fetching lp units", err.message);
    }

    let apiUser;
    try {
      const network = {
        1: "ethereum",
        137: "polygon",
        250: "fantom",
        "terra-mainnet": "terra",
      }[String(state.networkId)];
      //let apiUrl = "http://localhost:8000";
      let apiUrl = "https://thorstarter-tiers-api.herokuapp.com";
      apiUser = await fetch(
        apiUrl + "/user-fetch?network=" + network + "&address=" + state.address
      ).then((r) => r.json());
    } catch (err) {
      console.error("fetching api user", err.message);
    }

    if (state.networkId === "terra-mainnet") {
      const contracts = contractAddresses[state.networkId];
      const user = await state.lcd.wasm.contractQuery(contracts.tiers, {
        user_state: { user: state.address },
      });
      const balance = await state.lcd.wasm.contractQuery(contracts.xrune, {
        balance: { address: state.address },
      });
      setData({
        balance: parseUnits(balance.balance, 12),
        total: parseUnits(user.balance, 12),
        lastDeposit: user.last_deposit,
        lp: lpXrune,
        forge: parseUnits("0"),
        mintdao: parseUnits(String(apiUser?.user?.amount_mintdao || 0)),
      });
    } else if (state.networkId === 250) {
      const contracts = getContracts();
      const userInfo = await contracts.tiersSimple.userInfos(state.address);
      let forgeAmount = parseUnits("0");
      if (state.networkId === 250) {
        const forgeInfo = await contracts.forge.getUserInfo(state.address);
        forgeAmount = forgeInfo[0];
      }
      setData({
        balance: await contracts.xrune.balanceOf(state.address),
        total: userInfo[0],
        lastDeposit: userInfo[1].toNumber(),
        lp: lpXrune,
        forge: forgeAmount,
        mintdao: parseUnits(String(apiUser?.user?.amount_mintdao || 0)),
      });
    } else {
      const contracts = getContracts();
      const user = await contracts.tiers.userInfos(state.address);
      const userInfo = await contracts.tiers.userInfoAmounts(state.address);
      setData({
        balance: await contracts.xrune.balanceOf(state.address),
        total: userInfo[4][0],
        lastDeposit: user[1].toNumber(),
        lp: lpXrune,
        forge: parseUnits("0"),
        mintdao: parseUnits("0"),
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
    } else if (state.networkId === 250) {
      const contracts = getContracts();
      const call = contracts.xrune.transferAndCall(
        contracts.tiersSimple.address,
        amount,
        "0x"
      );
      await runTransaction(call, setLoading, setError);
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
                  amount: amount.div("1000000000000").toString(),
                },
              }
            ),
          ],
        },
        setLoading,
        setError
      );
    } else if (state.networkId === 250) {
      const contracts = getContracts();
      const call = contracts.tiersSimple.withdraw(amount);
      await runTransaction(call, setLoading, setError);
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
  const total = data
    ? parseFloat(
        formatUnits(data.total.add(data.lp).add(data.forge).add(data.mintdao))
      )
    : 0;

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

  const isMainnet = state.networkId === 1;
  return (
    <Layout title="Tiers" page="tiers">
      <IDORegistration />

      <div className="flex-heading">
        <h1 className="title">Tiers</h1>
        {isMainnet ? (
          <span className="apy-label">
            APY: <strong>10%</strong>
          </span>
        ) : null}
      </div>

      <div className="tiers-wrapper">
        <div className="tiers-wrapper__line">
          <div className="tiers-wrapper__progress" style={{ width: percent }}>
            <div className="tiers-wrapper__data">
              Your score: <span>{data ? formatNumber(total, 0) : "-"}</span>
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

      <section className="page-section">
        <h3 className="title">Deposit</h3>
        <div className="default-table">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Balance</th>
                <th>Staked{isMainnet ? " (Including 10% APY)" : null}</th>
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
              <tr>
                <td>Forge</td>
                <td className="tac" style={{ width: 110 }}>
                  N/A
                </td>
                <td className="tac" style={{ width: 110 }}>
                  {data ? formatNumber(data.forge) : "-"}
                </td>
                <td></td>
              </tr>
              <tr>
                <td>THORChain LP XRUNE</td>
                <td className="tac" style={{ width: 110 }}>
                  N/A
                </td>
                <td className="tac" style={{ width: 110 }}>
                  {data ? formatNumber(data.lp) : "-"}
                </td>
                <td></td>
              </tr>
              <tr>
                <td><a href="https://app.mintdao.io/collections/thorstarter-shields" target="_blank">MintDAO NFT</a></td>
                <td className="tac" style={{ width: 110 }}>
                  N/A
                </td>
                <td className="tac" style={{ width: 110 }}>
                  {data ? formatNumber(data.mintdao) : "-"}
                </td>
                <td></td>
              </tr>
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
        WARNING: You have to wait 7 days to withdraw XRUNE after each deposit.
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
    if (before7Days) return;
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
        Withdraw After:{" "}
        <strong>
          {formatDate((data.lastDeposit + 7 * 24 * 60 * 60) * 1000)}
        </strong>
      </div>

      {before7Days ? (
        <p className="error text-sm">
          WARNING You can&rsquo;t withdraw before waiting 7 days after your last
          deposit.
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
      <Button className="mt-4 w-full" disabled={before7Days} onClick={onSubmit}>
        {before7Days ? "Wait at least 7 days" : "Withdraw"}
      </Button>
    </Modal>
  );
}
