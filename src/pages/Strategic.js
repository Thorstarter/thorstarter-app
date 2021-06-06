import React, { useState, useEffect, useMemo } from 'react';
import {
  contracts,
  contractForProvider,
  thornodeReq,
  thorchainDeposit
} from "../utils";

export default function PageStrategic({ accounts, provider, setError, isLoading, setIsLoading }) {
  const [balance, setBalance] = useState("");
  const [value, setValue] = useState("");
  const [txHash, setTxHash] = useState("");
  const memoArgs = [provider?.network?.chainId];
  const Faucet = useMemo(() => contractForProvider(provider, 'faucet'), memoArgs);

  function fetchBalance() {
    thornodeReq(`/cosmos/bank/v1beta1/balances/${accounts.thorchain[0]}`)
      .then(res => res.balances.find(v => v.denom === 'rune').amount)
      .then(balance => setBalance((parseInt(balance)/Math.pow(10, 8)).toFixed(2)))
      .catch(err => console.error(err));
  }

  useEffect(() => {
    if (!accounts.thorchain || accounts.thorchain.length === 0) return;
    fetchBalance();
  }, [accounts.thorchain ? accounts.thorchain[0] : null]);

  async function onStart() {
    if (!provider || !provider.network) return setError('Connect wallet first');
    if (Number.isNaN(parseFloat(value))) return setError('Amount entered is not a number');
    if (!accounts.thorchain || accounts.thorchain.length === 0) return setError('Missing thorchain address');
    if (!accounts.ethereum || accounts.ethereum.length === 0) return setError('Missing ethereum address');
    try {
      setError();
      setIsLoading(true);
      const vaultAddress = await thornodeReq(`/thorchain/inbound_addresses`)
        .then(vaults => vaults.find(v => v.chain === 'ETH').address);
      const thorchainAddress = accounts.thorchain[0];
      await Faucet.start(vaultAddress, thorchainAddress);
      const memo = 'ADD:ETH.XRUNE-'+contracts.token[provider.network.chainId]+':'+accounts.ethereum[0];
      const txHash = await thorchainDeposit({ from: thorchainAddress, memo: memo, amount: value });
      setTxHash(txHash);
      setValue('');
      fetchBalance();
    } catch (e) {
      console.error(e);
      setError("Error withdrawing: " + e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center mb-5">
        <h1 className="mt-0 mb-0 flex-1">Strategic Sale</h1>
        <div className="">
          RUNE Balance: <b>{balance || "-"}</b>
        </div>
      </div>
    {!txHash ? (
      <div className="p-5 border border-primary-500 text-center text-xl">
        <div className="mb-5 font-bold">Become an XRUNE LP on Thorchain</div>
        <p>In order to let Thorchain users take part in Thorstarter's strategic
          sale using their RUNE we've setup this page which will give you 1 XRUNE
          pair it with however many RUNE you want and make you an LP.</p>
        <p>After using the form below to become an LP feel free to manage your
          liquidity using any of the Thorchain UIs like Thorswap, Asgardex or Vanaheimex</p>
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
          onClick={onStart}
        >
          Deposit into XRUNE-RUNE Pool
        </button>
      </div>
    ): (
      <div className="p-5 border border-primary-500 text-center text-xl">
        <div className="mb-5 font-bold">Congratulations!</div>
        <p>You're now an XRUNE LP! To view your transaction in the explorer follow this&nbsp;
          <a href={`https://${window.xfi.thorchain.network === 'testnet' ? 'testnet.' : ''}thorchain.net/#/txs/${txHash}`} target="_blank">link</a></p>
      </div>
    )}
    </div>
  );
}
