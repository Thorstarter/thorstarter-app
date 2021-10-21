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

export default function Tiers() {
  const state = useGlobalState();
  const [modal, setModal] = useState();
  const [data, setData] = useState(null);
  const total = data ? parseFloat(formatUnits(data.total)) : 0;

  async function fetchData() {
    if (!state.address) return;
    const contracts = getContracts();
    const userInfo = await contracts.tiers.userInfoAmounts(state.address);
    setData({
      total: userInfo[1],
      allowances: {
        xrune: await contracts.xrune.allowance(
          state.address,
          contracts.tiers.address
        ),
      },
      balances: {
        xrune: await contracts.xrune.balanceOf(state.address),
      },
      staked: {
        xrune: userInfo[4][0],
      },
    });
  }

  useEffect(fetchData, [state.networkId, state.address]);

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
            style={{
              width:
                Math.max(5, Math.min(100, (total / 100000) * 100)).toFixed(4) +
                "%",
            }}
          >
            <div className="tiers-wrapper__data">
              Your score:{" "}
              <span>{data ? formatNumber(data.total, 0) : "-"}</span>
            </div>
          </div>
        </div>
        <div className="tiers-wrapper__grid">
          <div className="tiers-wrapper__col">
            <div
              className={classnames("tiers-wrapper__block", {
                "is-active": total >= 1250,
              })}
            >
              <div className="tiers-wrapper__caption">Tier 1</div>
              <div className="tiers-wrapper__sum">1,250</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div className="tiers-wrapper__subtext">
                Allocation <br />
                Multiplier
              </div>
              <div
                className={classnames("tiers-wrapper__num", {
                  "is-active": total >= 1250,
                })}
              >
                1x
              </div>
            </div>
          </div>
          <div className="tiers-wrapper__col">
            <div
              className={classnames("tiers-wrapper__block", {
                "is-active": total >= 5000,
              })}
            >
              <div className="tiers-wrapper__caption">Tier 2</div>
              <div className="tiers-wrapper__sum">5,000</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div
                className={classnames("tiers-wrapper__num", {
                  "is-active": total >= 5000,
                })}
              >
                2x
              </div>
            </div>
          </div>
          <div className="tiers-wrapper__col">
            <div
              className={classnames("tiers-wrapper__block", {
                "is-active": total >= 25000,
              })}
            >
              <div className="tiers-wrapper__caption">Tier 3</div>
              <div className="tiers-wrapper__sum">25,000</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div
                className={classnames("tiers-wrapper__num", {
                  "is-active": total >= 25000,
                })}
              >
                5x
              </div>
            </div>
          </div>
          <div className="tiers-wrapper__col">
            <div
              className={classnames("tiers-wrapper__block", {
                "is-active": total >= 150000,
              })}
            >
              <div className="tiers-wrapper__caption">Tier 4</div>
              <div className="tiers-wrapper__sum">150,000</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div
                className={classnames("tiers-wrapper__num", {
                  "is-active": total >= 150000,
                })}
              >
                10x
              </div>
            </div>
          </div>
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
                <th>Staked</th>
                <th />
              </tr>
            </thead>
            <tbody>{renderAsset("xrune")}</tbody>
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
      const call = contracts.tiers.withdraw(
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

  async function onSubmit() {
    if (!data) return;
    const parsedAmount = parseUnits(amount.replace(/[^0-9\.]/g, ""));
    if (Number.isNaN(parsedAmount)) {
      setError("Not a valid number");
      return;
    }
    const contracts = getContracts();
    const call = contracts.tiers.withdraw(
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
        Withdraw
      </Button>
    </Modal>
  );
}
