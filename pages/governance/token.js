import { useEffect, useState } from "react";
import Layout from "../../components/layout";
import Button from "../../components/button";
import GovernanceNav from "../../components/governanceNav";
import LoadingOverlay from "../../components/loadingOverlay";
import {
  bn,
  parseUnits,
  ADDRESS_ZERO,
  tcPoolNames,
  formatAddress,
  formatNumber,
  useGlobalState,
  getContracts,
  runTransaction,
} from "../../utils";

export default function GovernanceToken() {
  const state = useGlobalState();
  const [balances, setBalances] = useState(null);

  async function fetchBalances() {
    if (!state.address) return;
    const contracts = getContracts();
    const lastFeeGrowthGlobal = await contracts.voters.lastFeeGrowth();
    const userInfo = await contracts.voters.userInfo(state.address);
    const total = userInfo[1].add(userInfo[2]).add(userInfo[4]);
    const rewards = lastFeeGrowthGlobal
      .sub(userInfo[0])
      .mul(total)
      .div(ethers.utils.parseUnits("1"));
    setBalances({
      xrune: await contracts.xrune.balanceOf(state.address),
      slp: await contracts.slp.balanceOf(state.address),
      xruneAllowance: await contracts.xrune.allowance(
        state.address,
        contracts.voters.address
      ),
      slpAllowance: await contracts.slp.allowance(
        state.address,
        contracts.voters.address
      ),
      lastFeeGrowthGlobal: lastFeeGrowthGlobal,
      lastFeeGrowth: userInfo[0],
      lockedToken: userInfo[1],
      lockedSsLpValue: userInfo[2],
      lockedSsLpAmount: userInfo[3],
      lockedTcLpValue: userInfo[4],
      lockedTcLpAmount: userInfo[5],
      rewards: rewards,
      total: total.add(rewards),
    });
  }
  useEffect(() => {
    fetchBalances();
  }, [state.address]);

  let content = <div className="text-center py-16">Loading...</div>;
  if (!state.address) {
    content = <div className="text-center py-16">Connect your wallet...</div>;
  } else if (balances) {
    content = (
      <div className="voting-row">
        <TokenAction balances={balances} fetchBalances={fetchBalances} />
        <TokenBalances balances={balances} />
      </div>
    );
  }

  return (
    <Layout title="Governance: Voting Token">
      <h1 className="title">Governance: Voting Token</h1>
      <GovernanceNav className="mb-8" page="token" />
      {content}
    </Layout>
  );
}

function TokenBalances({ balances }) {
  return (
    <div className="box">
      <h2 className="title mb-4">Balances</h2>
      <div className="flex mb-3">
        <div className="flex-1 text-gray6">vXRUNE for locked XRUNE</div>
        <div>{formatNumber(balances.lockedToken.add(balances.rewards))}</div>
      </div>
      <div className="flex mb-3">
        <div className="flex-1 text-gray6">vXRUNE for locked SLP</div>
        <div>{formatNumber(balances.lockedSsLpValue)}</div>
      </div>
      <div className="flex mb-3">
        <div className="flex-1 text-gray6">vXRUNE for locked TC LP</div>
        <div>{formatNumber(balances.lockedTcLpValue)}</div>
      </div>
      <div className="flex">
        <div className="flex-1 text-gray6">Total vXRUNE</div>
        <div>{formatNumber(balances.total)}</div>
      </div>
    </div>
  );
}

const tokenActions = [
  /*
  {
    title: "Lock XRUNE",
    token: "XRUNE",
    cta: "Lock",
    balanceField: "xrune",
    tokenContract: "xrune",
    submit: (voters, amount, contracts) =>
      contracts.xrune.transferAndCall(voters.address, amount, "0x"),
  },
  */
  {
    title: "Unlock XRUNE",
    token: "XRUNE",
    cta: "Unlock",
    balanceField: "lockedToken",
    submit: (voters, amount) => voters.unlock(amount),
  },
  /*
  {
    title: "Lock SushiSwap LP",
    token: "SLP",
    cta: "Lock",
    balanceField: "slp",
    tokenContract: "slp",
    submit: (voters, amount) => voters.lockSslp(amount),
  },
  */
  {
    title: "Unlock SushiSwap LP",
    token: "SLP",
    cta: "Unlock",
    balanceField: "lockedSsLpAmount",
    submit: (voters, amount) => voters.unlockSslp(amount),
  },
];

function TokenAction({ balances, fetchBalances }) {
  const state = useGlobalState();
  const [actionIndex, setActionIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const action = tokenActions[actionIndex];

  function onAmountMax() {
    setAmount(ethers.utils.formatUnits(balances[action.balanceField]));
  }
  function needsApproval() {
    if (!action.tokenContract) return false;
    if (action.title === "Lock XRUNE") return false;
    try {
      const parsedAmount = ethers.utils.parseUnits(
        amount.replace(/[^0-9\.]/g, "")
      );
      if (balances[action.tokenContract + "Allowance"].lt(parsedAmount)) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }
  async function onSubmit() {
    const contracts = getContracts();
    const parsedAmount = ethers.utils.parseUnits(
      amount.replace(/[^0-9\.]/g, "")
    );
    setAmount(ethers.utils.formatUnits(parsedAmount));

    if (needsApproval()) {
      const call = contracts[action.tokenContract].approve(
        contracts.voters.address,
        parsedAmount
      );
      await runTransaction(call, setLoading, setError);
      fetchBalances();
      return;
    }

    const call = action.submit(contracts.voters, parsedAmount, contracts);
    await runTransaction(call, setLoading, setError);
    fetchBalances();
    setAmount("");
  }

  return (
    <div className="box">
      <div className="nav-buttons">
        {tokenActions.map((a, i) => (
          <a
            key={a.title}
            onClick={() => setActionIndex(i)}
            className={i === actionIndex ? "text-primary5" : ""}
          >
            {a.title}
          </a>
        ))}
      </div>

      <h2 className="title mb-4">{action.title}</h2>

      {error ? <div className="error mb-4">{error}</div> : null}

      <div className="text-sm mb-2">
        <span className="text-gray6">Balance: </span>
        <span className="text-primary5">
          {formatNumber(balances[action.balanceField])} {action.token}
        </span>
      </div>
      <div className="input-with-link mb-4">
        <input
          className="input w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />
        <a onClick={onAmountMax} className="input-link">
          Max
        </a>
      </div>
      {loading ? <LoadingOverlay message={loading} /> : null}
      <Button
        className="button-lg w-full"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Loading..." : needsApproval() ? "Approve" : action.cta}
      </Button>
    </div>
  );
}
