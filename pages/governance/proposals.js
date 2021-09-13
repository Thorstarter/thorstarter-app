import { useEffect, useState } from "react";
import Button from "../../components/button";
import Layout from "../../components/layout";
import GovernanceNav from "../../components/governanceNav";
import { useGlobalState, getContracts } from "../../utils";

export default function GovernanceProposals() {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState(null);

  async function fetchProposals() {
    try {
      setError("");
      const contracts = getContracts();
      const nextProposals = [];
      console.log(contracts.dao);
      const proposalsCount = await contracts.dao.proposalsCount();
      for (let i = proposalsCount - 1; i >= 0 && i > proposalsCount - 10; i--) {
        const proposal = await contracts.dao.proposal(i);
        nextProposals.push(proposal);
      }
      setProposals(nextProposals);
    } catch (err) {
      console.error(err);
      setError(
        "Error: " + err?.error?.data?.originalError?.message ||
          err.message ||
          err.toString()
      );
    }
  }

  useEffect(() => {
    setTimeout(fetchProposals, 100);
  }, [state.networkId, state.address]);

  return (
    <Layout title="Governance: Proposals">
      <h1 className="title">Governance: Proposals</h1>
      <GovernanceNav className="mb-8" page="proposals" />
      <div className="coming-soon">Coming soon...</div>
    </Layout>
  );

  return (
    <Layout title="Governance: Proposals">
      <h1 className="title">
        Governance: Proposals
        <Button className="float-right" href="/governance/new-proposal/">
          New Proposal
        </Button>
      </h1>
      <GovernanceNav className="mb-8" />
      {error ? <div className="error mb-4">{error}</div> : null}
      {(proposals || []).map((p) => (
        <div className="box mb-2" key={p.id}>
          <h2 className="title">{JSON.stringify(p)}</h2>
        </div>
      ))}
      {(proposals || []).length === 0 ? (
        <div className="py-16 text-center">No Proposals</div>
      ) : null}
    </Layout>
  );
}
