import { ethers } from "ethers";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Button from "../../components/button";
import Layout from "../../components/layout";
import GovernanceNav from "../../components/governanceNav";
import { useGlobalState, getContracts, formatErrorMessage, formatNumber } from "../../utils";

export default function GovernanceProposals() {
  const router = useRouter();
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [votes, setVotes] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [againstName, setAgainstName] = useState("Against");
  const [options, setOptions] = useState([
    {
      name: "For",
      actions: [{ to: "", value: "", data: "" }],
    },
  ]);

  async function onSubmit() {
    try {
      setError("");
      setLoading(true);
      const contracts = getContracts();
      if (!title) {
        throw new Error("Missing title");
      }
      if (!description) {
        throw new Error("Missing description");
      }
      if (options.length === 0) {
        throw new Error("Missing option");
      }
      const optionNames = [];
      const optionActions = [];
      for (let option of options) {
        if (!option.name) throw new Error("Missing option name");
        optionNames.push(option.name);
        const actions = [];
        for (let action of option.actions) {
          actions.push(
            ethers.utils.defaultAbiCoder.encode(
              ["address", "uint", "bytes"],
              [
                action.to,
                ethers.utils.parseEther(action.value),
                action.data || "0x",
              ]
            )
          );
        }
        optionActions.push(actions);
      }
      optionNames.push(againstName);
      optionActions.push([]);
      const votingTime = await contracts.dao.minVotingTime();
      const executionDelay = await contracts.dao.minExecutionDelay();
      const tx = await contracts.dao.propose(
        title,
        description,
        votingTime,
        executionDelay,
        optionNames,
        optionActions
      );
      await tx.wait();
      const proposalId = (await contracts.dao.proposalsCount()).toNumber() - 1;
      router.push(`/governance/proposals/${proposalId}/`);
    } catch (err) {
      console.error(err);
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateOption(index, key, value) {
    options[index][key] = value;
    setOptions([...options]);
  }

  async function onRemoveOption(index) {
    options.splice(index, 1);
    setOptions([...options]);
  }

  async function onAddAction(index) {
    options[index].actions.push({
      to: "",
      value: "",
      data: "",
    });
    setOptions([...options]);
  }

  async function onUpdateAction(i, ii, key, value) {
    options[i].actions[ii][key] = value;
    setOptions([...options]);
  }

  async function onRemoveAction(i, ii) {
    options[i].actions.splice(ii, 1);
    setOptions([...options]);
  }

  async function onAddOption() {
    options.push({
      name: "",
      actions: [],
    });
    setOptions([...options]);
  }

  async function fetchVotes() {
    const contracts = getContracts();
    setVotes(
      parseFloat(formatNumber(await contracts.voters.votes(state.address)))
    );
  }

  useEffect(() => {
    setTimeout(fetchVotes, 100);
  }, [state.networkId, state.address]);

  const hasEnoughVotes = votes >= 10000;

  return (
    <Layout title="Governance: New Proposal">
      <h1 className="title">
        Governance: New Proposal
        <Button className="float-right" href="/governance/proposals/">
          &larr; Back
        </Button>
      </h1>
      <GovernanceNav className="mb-8" />

      {error ? <div className="error mb-4">{error}</div> : null}

      <div className="flex">
        <div className="flex-1 mr-4">
          <label className="label">Title</label>
          <input
            className="input w-full mb-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="label">Description</label>
          <textarea
            rows="12"
            className="input w-full mb-4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="text-right">
            <Button onClick={onSubmit} disabled={hasEnoughVotes}>
              {hasEnoughVotes ? "Submit" : "Not enough votes"}
            </Button>
          </div>
        </div>
        <div style={{ width: "300px" }}>
          <label className="label">Options</label>
          {options.map((o, i) => (
            <div className="box mb-4" key={i}>
              <label className="label">
                Name
                <a
                  className="float-right text-primary5"
                  onClick={() => onRemoveOption(i)}
                >
                  Remove
                </a>
              </label>
              <input
                className="input w-full mb-4"
                value={o.name}
                onChange={(e) => onUpdateOption(i, "name", e.target.value)}
              />

              {o.actions.map((a, ii) => (
                <div className="box mb-2" key={ii}>
                  <label className="label">
                    To (address)
                    <a
                      className="float-right text-primary5"
                      onClick={() => onRemoveAction(i, ii)}
                    >
                      Remove
                    </a>
                  </label>
                  <input
                    className="input w-full mb-4"
                    value={a.to}
                    onChange={(e) =>
                      onUpdateAction(i, ii, "to", e.target.value)
                    }
                    placeholder="0x0000..."
                  />
                  <label className="label">Value</label>
                  <input
                    className="input w-full mb-4"
                    value={a.value}
                    onChange={(e) =>
                      onUpdateAction(i, ii, "value", e.target.value)
                    }
                    placeholder="0.0"
                  />
                  <label className="label">Data</label>
                  <textarea
                    className="input w-full"
                    value={a.data}
                    onChange={(e) =>
                      onUpdateAction(i, ii, "data", e.target.value)
                    }
                    placeholder="0x"
                  />
                </div>
              ))}

              <div className="text-center">
                <a className="text-primary5" onClick={() => onAddAction(i)}>
                  Add Action
                </a>
              </div>
            </div>
          ))}
          <div className="box mb-4">
            <label className="label">Name</label>
            <input
              className="input w-full mb-4"
              value={againstName}
              onChange={(e) => setAgainstName(e.target.value)}
            />
          </div>
          <div className="text-center">
            <a className="text-primary5" onClick={onAddOption}>
              Add Option
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
