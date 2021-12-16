import { useEffect, useState } from "react";
import Button from "../components/button";
import Layout from "../components/layout";
import LoadingOverlay from "../components/loadingOverlay";
import {
  parseUnits,
  useGlobalState,
  formatNumber,
  runTransaction,
  formatErrorMessage
} from "../utils";
import allocations from "../data/skyrimrefund.json";
import abis from "../abis";

const rate = 0.931646972951;
const contractAddress = "0xb8C1Aaf54751efA11D2D8A5DF503b8afB6d80322";
const tokenAddress = "0x2610f0bfc21ef389fe4d03cfb7de9ac1e6c99d6e";

export default function SkyrimRefund() {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [amount, setAmount] = useState("");
  const [approved, setApproved] = useState(parseUnits("0"));
  const data = allocations.find(
    (a) => a.address.toLowerCase() === state.address?.toLowerCase()
  );
  let allocation = parseUnits(data?.amount || "0");
  if (allocation.gt(0)) allocation = allocation.sub(parseUnits("0.01"));
  let mustApprove = true;
  try {
    const parsedAmount = parseUnits((amount || '0').replace(/[^0-9\.]+/g, ""));
    if (parsedAmount.lte(approved)) {
      mustApprove = false;
    }
  } catch (e) {}

  async function fetchData() {
    try {
      if (!state.address) return;
      const contract = new ethers.Contract(
        tokenAddress,
        abis.token,
        state.signer
      );
      setApproved(await contract.allowance(state.address, contractAddress));
    } catch (err) {
      console.error(err);
      setError(formatErrorMessage(err));
    }
  }

  useEffect(() => {
    fetchData();
  }, [state.networkId, state.address]);

  async function onClaim() {
    const parsedAmount = parseUnits(amount.replace(/[^0-9\.]+/g, ""));

    if (mustApprove) {
      const contract = new ethers.Contract(
        tokenAddress,
        abis.token,
        state.signer
      );
      const call = contract.approve(contractAddress, parsedAmount);
      await runTransaction(call, setLoading, setError);
    }

    const contract = new ethers.Contract(
      contractAddress,
      ["function deposit(uint256, uint256, bytes32[])"],
      state.signer
    );
    const call = contract.deposit(parsedAmount, parseUnits(data.amount), data.proof);
    await runTransaction(call, setLoading, setError);
  }

  return (
    <Layout title="Skyrim Refund">
      <h1 className="title">Skyrim Refund</h1>
      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}
      {!state.address ? (
        <div>Connect your wallet</div>
      ) : (
        <div className="box text-center py-16">
          <div className="title">
            You can swap up to{" "}
            <span className="text-primary5">
              {formatNumber(allocation)}
            </span>{" "}
            SKYRIM
          </div>
          <div className="mb-4">
            In exchange you will get{" "}
            {formatNumber(allocation.mul((rate * 1000000) | 0).div(1000000))}{" "}
            XRUNE (0.9316 per SKYRIM)
          </div>
          <input
            className="input mr-4"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0 (amount to swap)"
          />
          <Button className="button-lg" onClick={onClaim}>
            {mustApprove ? "Approve" : "Claim Refund"}
          </Button>
        </div>
      )}
    </Layout>
  );
}
