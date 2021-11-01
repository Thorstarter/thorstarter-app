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
        <TokenTcLpRequest />
        {/* <TokenDelegate /> */}
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
  {
    title: "Lock XRUNE",
    token: "XRUNE",
    cta: "Lock",
    balanceField: "xrune",
    tokenContract: "xrune",
    submit: (voters, amount, contracts) =>
      contracts.xrune.transferAndCall(voters.address, amount, "0x"),
  },
  {
    title: "Unlock XRUNE",
    token: "XRUNE",
    cta: "Unlock",
    balanceField: "lockedToken",
    submit: (voters, amount) => voters.unlock(amount),
  },
  {
    title: "Lock SushiSwap LP",
    token: "SLP",
    cta: "Lock",
    balanceField: "slp",
    tokenContract: "slp",
    submit: (voters, amount) => voters.lockSslp(amount),
  },
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

function TokenDelegate() {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [delegate, setDelegate] = useState(ADDRESS_ZERO);
  const [newDelegate, setNewDelegate] = useState("");

  async function fetchDelegate() {
    const contracts = getContracts();
    setDelegate((await contracts.voters.userInfo(state.address))[6]);
  }

  async function onSubmit() {
    try {
      setError("");
      setLoading(true);
      const contracts = getContracts();
      const tx = await contracts.voters.delegate(newDelegate);
      await tx.wait();
      setNewDelegate("");
      fetchDelegate();
    } catch (err) {
      console.error(error);
      setError(
        "Error: " + err?.error?.data?.originalError?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => fetchDelegate(), [state.networkId, state.address]);

  return (
    <div className="box">
      <h2 className="title">Delegate</h2>

      {error ? <div className="error mb-4">{error}</div> : null}

      <div className="text-sm mb-2">
        <span className="text-gray6">Current Delegate: </span>
        <span className="text-primary5">{formatAddress(delegate)}</span>
      </div>
      <input
        className="input w-full mb-4"
        value={newDelegate}
        onChange={(e) => setNewDelegate(e.target.value)}
        placeholder="0x0000..."
      />
      <Button
        className="button-lg w-full"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Loading..." : "Update Delegate"}
      </Button>
    </div>
  );
}

function TokenTcLpRequest() {
  const state = useGlobalState();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    current: bn("0"),
    actual: bn("0"),
    cost: bn("0"),
  });

  async function fetchData() {
    const contracts = getContracts();
    const address = state.address;
    const baseUrl = `https://${
      state.networkId === 3 ? "testnet." : ""
    }midgard.thorchain.info/v2`;
    const pool = await fetch(
      baseUrl + "/pool/" + tcPoolNames[state.networkId]
    ).then((r) => r.json());

    const userUnits = (
      await fetch(
        "https://thorstarter-xrune-liquidity.herokuapp.com/get?address=" +
          address
      ).then((r) => (r.ok ? r.json() : { units: "0" }))
    ).units;

    const actual = parseUnits(userUnits, 10)
      .mul("2")
      .mul(parseUnits(pool.assetDepth, 10))
      .div(parseUnits(pool.units, 10));

    const cost = (await contracts.votersTcLpRequester.currentCost())
      .mul("120")
      .div("100");

    setData({
      current: (await contracts.voters.userInfo(address))[4],
      actual: actual,
      cost: cost,
    });
  }

  async function onSubmit() {
    if (data.actual.eq("0")) {
      setError("You don't need to request an update, your TC LP balance is 0");
      return;
    }
    try {
      setError("");
      setLoading(true);
      const contracts = getContracts();
      const address = state.address;
      const call = contracts.votersTcLpRequester
        .request(address, {
          value: data.cost,
        })
        .then(() => {
          setSuccess(true);
        });
      await runTransaction(call, setLoading, setError);
    } catch (err) {
      console.error(error);
      setError(
        "Error: " + err?.error?.data?.originalError?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => fetchData(), [state.networkId, state.address]);

  return (
    <div className="box">
      <h2 className="title">vXRUNE for Thorchain LP request</h2>

      {loading ? <LoadingOverlay message={loading} /> : null}
      {error ? <div className="error mb-4">{error}</div> : null}
      {success ? (
        <div className="success mb-4">
          Success! You balance should update shortly.
        </div>
      ) : null}

      <div className="mb-2" style={{ fontSize: "14px" }}>
        To have your Thorchain XRUNE-RUNE LP value reflected as vXRUNE on the
        Ethereum chain, you can pay the gas fee using the button below and
        Thorstarter will update your vXRUNE balance in the DAO&apos;s Voters
        contract to reflect your current position{" "}
        <i>(Takes up to 60 minutes to process)</i>.
      </div>
      <div className="mb-4" style={{ fontSize: "14px" }}>
        <b>
          WARNING: If you change your LP position on Thorchain, the bot will set
          your vXRUNE balance (for TC LP) back to 0 and you&apos;ll have to
          request an update again (and pay the gas for it).
        </b>
      </div>
      <div className="text-sm mb-2">
        <span className="text-gray6">Current vXRUNE for TC LP: </span>
        <span className="text-primary5">{formatNumber(data.current)}</span>
      </div>
      <div className="text-sm mb-2">
        <span className="text-gray6">vXRUNE your TC LP is worth: </span>
        <span className="text-primary5">{formatNumber(data.actual)}</span>
      </div>
      <div className="text-sm mb-4">
        <span className="text-gray6">Cost to request update: </span>
        <span className="text-primary5">{formatNumber(data.cost, 4)} ETH</span>
      </div>
      <Button
        className="button-lg w-full"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Loading..." : "Request vXRUNE Update"}
      </Button>
    </div>
  );
}
