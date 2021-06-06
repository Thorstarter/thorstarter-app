import React, { useState, useEffect, useMemo } from 'react';
import {
  BN,
  parseE,
  formatE,
  contracts,
  contractForProvider,
} from "../utils";

export default function PageFarm({ provider, setError, isLoading, setIsLoading }) {
  const [apr, setApr] = useState();
  const [balance, setBalance] = useState();
  const [staked, setStaked] = useState();
  const [reward, setReward] = useState();
  const [value, setValue] = useState("");
  const memoArgs = [ provider?.network?.chainId ];
  const Staking = useMemo(() => contractForProvider(provider, 'staking'), memoArgs);
  const Token = useMemo(() => contractForProvider(provider, 'token'), memoArgs);

  async function updateStats() {
    const signer = provider.getSigner();

    const blocksPerDay = BN((24 * 60 * 60) / 15);
    const rewardPerDay = (await Staking.rewardPerBlock()).mul(blocksPerDay);
    const totalStaked = await Token.balanceOf(Staking.address);
    setApr(
      rewardPerDay
        .div(totalStaked.add(BN(1)))
        .mul(BN(365))
        .div(BN(100))
        .toString()
    );

    const balance = await Token.balanceOf(signer.getAddress());
    setBalance(formatE(balance));
    try {
      const staked = (await Staking.userInfo(0, signer.getAddress()))[0];
      setStaked(formatE(staked));
      const reward = await Staking.pendingRewards(0, signer.getAddress());
      setReward(formatE(reward));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!provider || !provider.network) return;
    if (!contracts.token[provider.network.chainId]) {
      setError("XRUNE is not deployed to " + provider.network.name + " yet.");
      return;
    }
    updateStats();
    const handle = setInterval(updateStats, 5000);
    return () => clearInterval(handle);
  }, [provider?.network?.chainId]);

  async function onStake() {
    if (!provider || !provider.network) return setError('Connect wallet first');
    try {
      setError();
      setIsLoading(true);
      await (
        await Token.transferAndCall(Staking.address, parseE(value), 0)
      ).wait();
      await updateStats();
    } catch (e) {
      console.error(e);
      setError("Error staking: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }
  async function onWithdraw() {
    if (!provider || !provider.network) return setError('Connect wallet first');
    try {
      setError();
      setIsLoading(true);
      const address = provider.getSigner().getAddress();
      await (await Staking.withdrawAndHarvest(0, parseE(staked), address)).wait();
      await updateStats();
    } catch (e) {
      console.error(e);
      setError("Error withdrawing: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }
  async function onFarm() {
    if (!provider || !provider.network) return setError('Connect wallet first');
    try {
      setError();
      setIsLoading(true);
      const address = provider.getSigner().getAddress();
      await (await Staking.harvest(0, address)).wait();
      await updateStats();
    } catch (e) {
      console.error(e);
      setError("Error collecting: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center mb-5">
        <h1 className="mt-0 mb-0 flex-1">Farm</h1>
        <div className="">
          XRUNE Balance: <b>{balance || "-"}</b>
        </div>
      </div>
      <div className="p-5 border border-primary-500 text-center text-xl">
        <div className="mb-5 font-bold">XRUNE</div>
        <div className="mb-5">APR: {apr || "-"}%</div>
        <div className="flex">
          <div className="flex-1">
            <input
              type="text"
              className="input block w-full mb-3"
              placeholder="0.0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              className="block button w-full mb-3"
              disabled={isLoading}
              onClick={onStake}
              title="Stake an amount of XRUNE"
            >
              Stake
            </button>
          </div>
          <div className="flex-1 ml-3">
            <div className="mb-3" style={{ height: 36 }}>
              Staked: {staked || "-"}
            </div>
            <button
              className="block button w-full mb-3"
              disabled={isLoading}
              onClick={onWithdraw}
              title="Withdraw rewards and total amount staked"
            >
              Withdraw
            </button>
          </div>
          <div className="flex-1 ml-3">
            <div className="mb-3" style={{ height: 36 }}>
              Rewards: {reward || "-"}
            </div>
            <button
              className="block button w-full mb-3"
              disabled={isLoading}
              onClick={onFarm}
              title="Collect pending rewards"
            >
              Collect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
