import classnames from "classnames";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import LoadingOverlay from "../components/loadingOverlay";
import Vault from "../components/vault";
import {
  bn,
  useGlobalState,
  getContracts,
  aprdToApy,
  formatUnits,
  formatNumber,
  runTransaction,
} from "../utils";
import { parseUnits } from "@ethersproject/units";

import vaults from "../data/vaults.json";

const farms = [
  {
    name: "XRUNE-ETH SLP",
    token: "slp",
    poolId: 1,
  },
  {
    name: "XRUNE",
    token: "xrune",
    poolId: 0,
  },
];

export default function Farm() {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [data, setData] = useState();
  const [amounts, setAmounts] = useState(
    farms.map(() => ({ deposit: "", withdraw: "" }))
  );

  async function fetchData() {
    if (!state.address) return;
    const contracts = getContracts();
    const blocksPerDay = bn((24 * 60 * 60) / 13.5);
    const rewardPerBlock = await contracts.staking.rewardPerBlock();
    const rewardPerDay = rewardPerBlock.mul(blocksPerDay);
    const totalAllocPoint = await contracts.staking.totalAllocPoint();
    const farmsData = [];
    for (let farm of farms) {
      const pool = await contracts.staking.poolInfo(farm.poolId);
      const info = await contracts.staking.userInfo(farm.poolId, state.address);
      const poolRewardsPerDay = rewardPerDay.mul(pool[2]).div(totalAllocPoint);
      const totalStaked = await contracts[farm.token].balanceOf(
        contracts.staking.address
      );
      if (farm.poolId === 1) {
        const xruneInSlp = await contracts.xrune.balanceOf(
          contracts.slp.address
        );
        const slpTotalSupply = await contracts.slp.totalSupply();
        totalStaked = totalStaked.mul(xruneInSlp).div(slpTotalSupply).mul("2");
      }
      if (totalStaked.eq("0")) {
        totalStaked = bn("1");
      }
      farmsData.push({
        allocPoint: pool[2],
        staked: info[0],
        balance: await contracts[farm.token].balanceOf(state.address),
        allowance: await contracts[farm.token].allowance(
          state.address,
          contracts.staking.address
        ),
        rewards: await contracts.staking.pendingRewards(
          farm.poolId,
          state.address
        ),
        apy:
          aprdToApy(
            parseFloat(formatUnits(poolRewardsPerDay)) /
              parseFloat(formatUnits(totalStaked))
          ) * 100,
      });
    }
    setData({
      rewardPerBlock,
      totalAllocPoint,
      farms: farmsData,
    });
  }

  useEffect(fetchData, [state.networkId, state.address]);

  function onAmountChange(i, key, e) {
    amounts[i][key] = e.target.value;
    setAmounts([...amounts]);
  }

  async function onDeposit(index) {
    if (!data) return;
    const amount = parseUnits(amounts[index].deposit.replace(/[^0-9\.]/g, ""));
    const contracts = getContracts();
    let call;
    if (data.farms[index].allowance.eq("0")) {
      call = contracts[farms[index].token].approve(
        contracts.staking.address,
        ethers.constants.MaxUint256
      );
    } else if (farms[index].poolId === 0) {
      call = contracts.xrune.transferAndCall(
        contracts.staking.address,
        amount,
        "0x"
      );
    } else {
      call = contracts.staking.deposit(
        farms[index].poolId,
        amount,
        state.address
      );
    }
    await runTransaction(call, setLoading, setError).then(() => {
      if (data.farms[index].allowance.eq("0")) return;
      onAmountChange(index, "deposit", { target: { value: "" } });
      fetchData();
    });
  }

  async function onWithdraw(index) {
    if (!data) return;
    const amount = parseUnits(amounts[index].withdraw.replace(/[^0-9\.]/g, ""));
    const contracts = getContracts();
    const call = contracts.staking.withdrawAndHarvest(
      farms[index].poolId,
      amount,
      state.address
    );
    await runTransaction(call, setLoading, setError).then(() => {
      onAmountChange(index, "withdraw", { target: { value: "" } });
    });
    fetchData();
  }

  async function onHarvest(index) {
    if (!data) return;
    const contracts = getContracts();
    const call = contracts.staking.harvest(farms[index].poolId, state.address);
    await runTransaction(call, setLoading, setError);
    fetchData();
  }

  return (
    <Layout title="Farm" page="farm">
      <h1 className="title">Farm</h1>

      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}

      <div className="flex">
        {farms.map((farm, i) => (
          <div
            className={classnames("box flex-1 mb-4", {
              "mr-4": i % 2 === 0,
            })}
            key={farm.name}
          >
            <div className="flex mb-8">
              <h2 className="flex-1 ma-0">{farm.name}</h2>
              <div className="mt-2">
                {data ? data.farms[i].apy.toFixed(2) : "-"}% APY
              </div>
            </div>

            <div className="flex mb-8">
              <div className="flex-1">
                <label>XRUNE Earned</label>
                <br />
                <div style={{ fontSize: 32 }}>
                  {data ? formatNumber(data.farms[i].rewards) : "-"}
                </div>
              </div>
              <div>
                <label>&nbsp;</label>
                <br />
                <Button onClick={onHarvest.bind(null, i)}>Claim</Button>
              </div>
            </div>

            <div className="flex">
              <div className="flex-1 mr-4">
                {farm.poolId === 0 ? (
                  <div>
                    Single sided XRUNE deposits have been disabled in favor of
                    Vaults!
                  </div>
                ) : (
                  <>
                    <label>
                      Balance:{" "}
                      {data ? formatNumber(data.farms[i].balance) : "-"}
                    </label>
                    <br />
                    <div className="input-with-link">
                      <input
                        type="text"
                        className="input w-full mt-2"
                        value={amounts[i].deposit || ""}
                        onChange={onAmountChange.bind(null, i, "deposit")}
                        placeholder="0.0"
                      />
                      <a
                        className="input-link"
                        onClick={onAmountChange.bind(null, i, "deposit", {
                          target: {
                            value: data
                              ? formatNumber(data.farms[i].balance, 8)
                              : "0",
                          },
                        })}
                      >
                        Max
                      </a>
                    </div>
                    <Button
                      className="button-outline mt-4 w-full"
                      onClick={onDeposit.bind(null, i)}
                    >
                      {farm.poolId !== 0 &&
                      data &&
                      data.farms[i].allowance.eq("0")
                        ? "Approve"
                        : "Deposit"}
                    </Button>
                  </>
                )}
              </div>
              <div className="flex-1">
                <label>
                  Staked: {data ? formatNumber(data.farms[i].staked) : "-"}
                </label>
                <br />
                <div className="input-with-link">
                  <input
                    type="text"
                    className="input w-full mt-2"
                    value={amounts[i].withdraw || ""}
                    onChange={onAmountChange.bind(null, i, "withdraw")}
                    placeholder="0.0"
                  />
                  <a
                    className="input-link"
                    onClick={onAmountChange.bind(null, i, "withdraw", {
                      target: {
                        value: data
                          ? formatNumber(data.farms[i].staked, 8)
                          : "0",
                      },
                    })}
                  >
                    Max
                  </a>
                </div>
                <Button
                  className="button-outline mt-4 w-full"
                  onClick={onWithdraw.bind(null, i)}
                >
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-section">
        <h1 className="title">Vaults</h1>
        <div className="vaults-grid">
          {vaults
            .filter((i) => i.networkId === state.networkId)
            .map((v) => (
              <Vault vault={v} key={v.address} />
            ))}
        </div>
      </div>
    </Layout>
  );
}
