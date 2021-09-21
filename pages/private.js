import { useEffect, useState } from "react";
import Button from "../components/button";
import Layout from "../components/layout";
import LoadingOverlay from "../components/loadingOverlay";
import {
  t,
  useGlobalState,
  formatNumber,
  getContracts,
  formatErrorMessage,
  runTransaction,
} from "../utils";

export default function GovernanceProposals() {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [claimable, setClaimable] = useState(null);
  const [nonPrivate, setNonPrivate] = useState(false);

  async function fetchData() {
    try {
      if (!state.address) return;
      const contracts = getContracts();
      let claimable = await contracts.epd.claimable(state.address);
      if (claimable.eq("0")) {
        claimable = await contracts.vestingDispenser.claimable(state.address);
        setNonPrivate(true);
      }
      setClaimable(claimable);
    } catch (err) {
      console.error(err);
      setError(formatErrorMessage(err));
    }
  }

  useEffect(() => {
    fetchData();
  }, [state.networkId, state.address]);

  async function onClaim() {
    const contracts = getContracts();
    let call;
    if (!nonPrivate) {
      call = contracts.epd.claim();
    } else {
      call = contracts.vestingDispenser.claim();
    }
    await runTransaction(call, setLoading, setError);
    fetchData();
  }

  return (
    <Layout title="Private Investors Vesting">
      <h1 className="title">Private Investors Vesting</h1>
      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}
      {!state.address ? (
        <div>Connect your wallet</div>
      ) : !claimable ? (
        <div>Loading...</div>
      ) : (
        <div className="box text-center title py-16">
          <div>
            Claimable:{" "}
            <span className="text-primary5">{formatNumber(claimable)}</span>{" "}
            XRUNE
          </div>
          <Button className="button-lg" onClick={onClaim}>
            Claim
          </Button>
        </div>
      )}
    </Layout>
  );
}
