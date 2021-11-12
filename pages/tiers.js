import classnames from "classnames";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import Modal from "../components/modal";
import LoadingOverlay from "../components/loadingOverlay";
import {
  parseUnits,
  formatNumber,
  useGlobalState,
  getContracts,
  formatUnits,
  contractAddresses,
  runTransaction,
} from "../utils";

const assets = {
  xrune: {
    name: "XRUNE",
    token: "xrune",
  },
};

const tiers = [
  { name: "Tier 1", amount: 2500, multiplier: 1 },
  { name: "Tier 2", amount: 7500, multiplier: 1.5 },
  { name: "Tier 3", amount: 25000, multiplier: 5 },
  { name: "Tier 4", amount: 150000, multiplier: 10 },
];

export default function Tiers() {
  const state = useGlobalState();
  const [modal, setModal] = useState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [data, setData] = useState(null);
  const [percent, setPercent] = useState("0");
  const total = data ? parseFloat(formatUnits(data.total)) : 0;

  async function fetchData() {
    if (!state.address) return;
    const contracts = getContracts();
    const user = await contracts.tiers.userInfos(state.address);
    const userInfo = await contracts.tiers.userInfoAmounts(state.address);
    setData({
      user: user,
      total: user[1].toNumber() > 0 ? userInfo[1] : 0,
      allowances: {
        xrune: await contracts.xrune.allowance(
          state.address,
          contracts.tiers.address
        ),
      },
      balances: {
        xrune: await contracts.xrune.balanceOf(state.address),
        twnft: userInfo[4][userInfo[2].indexOf(contracts.twnft.address)],
      },
      staked: {
        xrune: userInfo[4][0],
      },
    });
  }

  useEffect(fetchData, [state.networkId, state.address]);

  useEffect(() => {
    if (typeof document !== "undefined" && data?.total) {
      const totalWidth = document.querySelector(".tiers-wrapper__line").getBoundingClientRect().width;

      let basePercent = 0;
      let thisTier = 0;
      let nextTier = tiers[0].amount;
      for (let i = 0; total >= tiers[i].amount; i++) {
        basePercent = (i * 25) + 12.5;
        thisTier = tiers[i].amount;
        if (i === 3) {
          nextTier = 200000;
          break;
        } else {
          nextTier = tiers[i+1].amount;
        }
      }
      console.log(basePercent, thisTier, nextTier, tiers[0].amount);
      
      const value = Math.min(1, ((total - thisTier) / (nextTier - thisTier)));
      const partWidth = totalWidth / 4;
      const position = partWidth * value;
      setPercent(`calc(${basePercent}% + ${position - 24}px)`);
    }
  }, [data, total]);

  function onStartDeposit(id) {
    setModal({ type: "deposit", asset: id });
  }

  function onStartWithdraw(id) {
    setModal({ type: "withdraw", asset: id });
  }

  function onClose() {
    setModal();
    fetchData();
  }

  async function onSignup() {
    const contracts = getContracts();
    const call = contracts.xrune.transferAndCall(contracts.tiers.address, "0", "0x");
    await runTransaction(call, setLoading, setError).then(fetchData);
  }

  function renderAsset(id) {
    return (
      <tr>
        <td>{assets[id].name}</td>
        <td>{data ? formatNumber(data.balances[id]) : "-"}</td>
        <td>{data ? formatNumber(data.staked[id]) : "-"}</td>
        <td className="tar">
          <Button onClick={onStartDeposit.bind(null, id)} disabled={!data}>
            Deposit
          </Button>
          <Button
            onClick={onStartWithdraw.bind(null, id)}
            disabled={!data}
            className="button-outline"
          >
            Withdraw
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <Layout title="Tiers" page="tiers">
      <h1 className="title">Tiers</h1>
      <div className="tiers-wrapper">
        <div className="tiers-wrapper__line">
          <div
            className="tiers-wrapper__progress"
            style={{width: percent}}
          >
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
      <section className="page-section">
        {error ? <div className="error mb-4">{error}</div> : null}
        {loading ? <LoadingOverlay message={loading} /> : null}
        <h3 className="title">Deposit</h3>
        <div className="default-table">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Balance</th>
                <th>Staked</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {renderAsset("xrune")}
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
        <ModalDeposit asset={modal.asset} data={data} onClose={onClose} />
      ) : null}
      {modal && modal.type === "withdraw" ? (
        <ModalWithdraw asset={modal.asset} data={data} onClose={onClose} />
      ) : null}
    </Layout>
  );
}

function ModalDeposit({ asset, data, onClose }) {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [amount, setAmount] = useState("");

  async function onSubmit() {
    if (!data) return;
    const parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""));
    if (Number.isNaN(parsedAmount)) {
      setError("Not a valid number");
      return;
    }
    const contracts = getContracts();
    if (asset === "xrune") {
      const call = contracts.xrune.transferAndCall(
        contracts.tiers.address,
        parsedAmount,
        "0x"
      );
      await runTransaction(call, setLoading, setError).then(onClose);
    } else if (data.allowances[asset].eq("0")) {
      const call = contracts[assets[asset].token].approve(
        contractAddresses[state.networkId].tiers,
        ethers.constants.MaxUint256
      );
      await runTransaction(call, setLoading, setError);
    } else {
      const call = contracts.tiers.deposit(
        contractAddresses[state.networkId][assets[asset].token],
        parsedAmount,
        state.address
      );
      await runTransaction(call, setLoading, setError).then(onClose);
    }
  }

  if (!data) {
    return <LoadingOverlay message={"Loading..."} />;
  }
  return (
    <Modal onClose={onClose} style={{ maxWidth: 400 }}>
      <h2>Deposit {assets[asset].name}</h2>

      <p className="text-sm text-gray6">
        Warning: You have to wait 7 days to withdraw XRUNE after each deposit
        (you can withdraw before 7 days at a cost of 50% of the amount).
      </p>

      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}

      <label>Balance: {formatNumber(data.balances[asset])}</label>
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
          onClick={() => setAmount(formatNumber(data.balances[asset]))}
        >
          Max
        </a>
      </div>
      <Button className="mt-4 w-full" onClick={onSubmit}>
        {asset !== "xrune" && data.allowances[asset].eq("0")
          ? "Approve"
          : "Deposit"}
      </Button>
    </Modal>
  );
}

function ModalWithdraw({ asset, data, onClose }) {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [amount, setAmount] = useState("");
  const before7Days = data
    ? Date.now() / 1000 < data.user[1] + 7 * 24 * 60 * 60
    : true;

  async function onSubmit() {
    if (!data) return;
    const parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""));
    if (Number.isNaN(parsedAmount)) {
      setError("Not a valid number");
      return;
    }
    const contracts = getContracts();
    const call = before7Days
      ? contracts.tiers.withdrawNow(
          contractAddresses[state.networkId][assets[asset].token],
          parsedAmount,
          state.address
        )
      : contracts.tiers.withdraw(
          contractAddresses[state.networkId][assets[asset].token],
          parsedAmount,
          state.address
        );
    await runTransaction(call, setLoading, setError).then(onClose);
  }

  if (!data) {
    return <LoadingOverlay message={"Loading..."} />;
  }
  return (
    <Modal onClose={onClose} style={{ maxWidth: 400 }}>
      <h2>Withdraw {assets[asset].name}</h2>

      {before7Days ? (
        <p className="error text-sm">
          WARNING You are withdrawing before waiting 7 days after you last
          deposit. You will loose half of the amount you withdraw if you
          don&apos;t wait.
        </p>
      ) : null}

      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}

      <label>Staked: {formatNumber(data.staked[asset])}</label>
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
          onClick={() => setAmount(formatNumber(data.staked[asset]))}
        >
          Max
        </a>
      </div>
      <Button className="mt-4 w-full" onClick={onSubmit}>
        Withdraw{before7Days ? " (and loose 50%)" : ""}
      </Button>
    </Modal>
  );
}
