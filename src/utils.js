import { ethers } from "ethers";

window.ethers = ethers;

export const BN = ethers.BigNumber.from;
export const parseE = ethers.utils.parseEther;
export const formatE = ethers.utils.formatEther;

export const abis = {
  token: require('./contracts/Token.json'),
  faucet: require('./contracts/Faucet.json'),
  staking: require('./contracts/Staking.json'),
};

export const contracts = {
  token: {
    3: "0x0fe3ecd525d16fa09aa1ff177014de5304c835e2",
  },
  faucet: {
    3: "0xE1F75Fe7f0a052DEc34E4E28088abE2Baf8Fd1d9",
  },
  staking: {
    3: "0x22f9A5070D1FDA397A2adbA52208caF16c5EEa37",
  },
};

export function contractForProvider(provider, name) {
  if (!provider || !provider.network) return;
  return new ethers.Contract(
    contracts[name][provider.network.chainId],
    abis[name],
    provider.getSigner()
  );
}

export function providerReq(provider, method, params) {
  return new Promise((resolve, reject) => {
    provider.request({ method, params }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

export function thornodeReq(path) {
  const prefix = window.xfi?.thorchain?.network === 'testnet' ? 'testnet.' : '';
  const thornodeApi = `https://${prefix}thornode.thorchain.info`;
  return fetch(thornodeApi + path)
    .then(res => { if (res.status !== 200) throw new Error('Status code: '+res.status); return res; })
    .then(res => res.json());
}

export function thorchainDeposit({ from, memo, amount }) {
  const formattedAmount = parseInt(parseFloat(amount) * Math.pow(10, 8));
  return new Promise((resolve, reject) => {
    if (!window.xfi || !window.xfi.thorchain) return reject(new Error("XDEFI wallet not connected"));
    window.xfi.thorchain.request({
      method: 'deposit',
      params: [{ from, memo, amount: { amount: formattedAmount, decimals: 8 } }],
    }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}
