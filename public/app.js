const contracts = {
  'Ethereum': {
    'xrune': '0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c',
    'tiers': '0x817ba0ecafD58460bC215316a7831220BFF11C80',
  },
  'Fantom': {
    'xrune': '0xe1e6b01ae86ad82b1f1b4eb413b219ac32e17bf6',
    'tiers': '0xbc373f851d1EC6aaba27a9d039948D25a6EE8036',
  },
};

let terraInfo;
let terraPromises = {};

// {{{ Utils

function toggle(selector) {
  if (event) event.stopPropagation();
  document.querySelector(selector).classList.toggle('hide');
}

function setCookie(name, value) {
  document.cookie = name+'='+value+';path=/';
}

function getCookie(name) {
  const x = document.cookie.split(';');
  const y = x.map(x => x.split('=').map(x => x.trim())).find(x => x[0] === name)
  return y ? y[1] : null;
}

function parseAmount(selector) {
  const value = document.querySelector(selector).value.replace(/[^0-9\.]/g, '');
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  return BigInt(Math.floor(n * 1000000000).toString() +'000000000');
}

function bigIntToHex(n) {
  const max = '0000000000000000000000000000000000000000000000000000000000000000';
  return (max + n.toString(16)).slice(0 - max.length);
}

function bigIntToTerra(n) {
  return (n / BigInt('1000000000000')).toString();
}

function terraSend(type, data = {}) {
  return new Promise((resolve, reject) => {
    const id = Date.now();
    window.postMessage({
      target: 'station:content',
      data: { ...data, id, type },
    }, location.origin)
    if (type === 'info') terraPromises['onInfo'] = [resolve, reject];
    if (type === 'post') terraPromises['onPost'] = [resolve, reject];
    if (type === 'connect') terraPromises['onConnect'] = [resolve, reject];
    terraPromises[id] = [resolve, reject];
  });
}

// }}}
// {{{ Setup / Lifecycle

async function handleChangedAccounts(accounts) {
  console.log('changed accounts', accounts);
  if (accounts.length === 0) {
    alert('Please connect a wallet');
    return;
  }
  setCookie('walletAddress', accounts[0]);
  const chainId = await ethereum.request({ method: 'eth_chainId' });
  handleChangedChain(chainId);
}

function handleChangedChain(chainId) {
  const chainMap = {'0x1': 'Ethereum', '0x3': 'Ropsten', '0x89': 'Polygon', '0xfa': 'Fantom'};
  console.log('changed chain', chainId, chainMap[chainId], chainMap);
  if (!chainMap[chainId]) {
    alert('Unsupported blockchain selected');
    return;
  }
  setCookie('walletChain', chainMap[chainId]);
  window.location.reload();
  document.querySelector('#walletConnectModal').classList.add('hide');
}

function setupEthereum() {
  if (!window.ethereum) return;
  ethereum.on('accountsChanged', handleChangedAccounts);
  ethereum.on('chainChanged', handleChangedChain);
}

function setupTerra() {
  if (!window.isTerraExtensionAvailable) return;
  let haveSyn = false;
  window.addEventListener('message', (event) => {
    console.log(event);
    if (event.origin !== location.origin) return;
    if (event.source !== window) return;
    if (typeof event.data !== 'object') return;
    if (event.data.target !== 'station:inpage') return;
    if (!event.data.data) return;
    if (event.data.data === 'SYN') {
      haveSyn = true;
      window.postMessage({ target: 'station:content', data: 'ACK' }, location.origin);
      return;
    }
    if (event.data.data === 'ACK') {
      if (!haveSyn) window.postMessage({ target: 'station:content', data: 'ACK' }, location.origin);
      terraSend('info').then(info => terraInfo = info);
      return;
    }
    const data = event.data.data;
    console.log('terra', data);
    const p = terraPromises[data.name] || terraPromises[data.id];
    if (!p) return;
    delete terraPromises[data.id];
    delete terraPromises[data.name];
    if (data.error) return p[1](data.error);
    p[0](data.payload);
  }, false);
  window.postMessage({ target: 'station:content', data: 'SYN' }, location.origin);
}

window.addEventListener('DOMContentLoaded', () => {
  setupEthereum();
  setupTerra();
});

// }}}
// {{{ Wallet Connection

function walletConnectMetamask() {
  if (!window.ethereum) {
    return alert('Metamask wallet is not installed!');
  }
  window.ethereum.request({ method: 'eth_requestAccounts' }).then(handleChangedAccounts);
}

async function walletConnectTerra() {
  if (!window.isTerraExtensionAvailable) {
    return alert('Terra Station wallet is not installed!');
  }
  const connect = await terraSend('connect');
  setCookie('walletChain', 'Terra');
  setCookie('walletAddress', connect.address);
  toggle('#walletConnectModal');
  window.location.reload();
}

function walletConnect() {
  if (getCookie('walletAddress')) {
    setCookie('walletChain', '');
    setCookie('walletAddress', '');
    window.location.reload();
    return;
  }
  toggle('#walletConnectModal');
}

// }}}
// {{{ Transaction Sending

async function sendTransaction(to, data, value) {
  try {
    toggle('#txPendingModal');
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: document.querySelector('#walletAddress').innerText,
        to: to, data: data, value: value,
      }],
    });
    console.log('tx hash', txHash);
    const chain = document.querySelector('#walletChain').innerText;
    const explorer = {
      'Ethereum': 'https://etherscan.io/',
      'Fantom': 'https://ftmscan.com/',
    }[chain];
    const linkEl = document.querySelector('#txSuccessModalLink');
    linkEl.href = explorer + 'tx/' + txHash;
    linkEl.innerText = txHash;
    toggle('#txPendingModal');
    toggle('#txSuccessModal');
  } catch(err) {
    document.querySelector('#txErrorModalText').innerText = 'Error: ' + err.message;
    toggle('#txPendingModal');
    toggle('#txErrorModal');
  }
}

async function sendTransactionTerra(contract, message) {
  try {
    toggle('#txPendingModal');
    const address = document.querySelector('#walletAddress').innerText;
    const result = await terraSend('post', {
      msgs: [JSON.stringify({
        "@type": "/terra.wasm.v1beta1.MsgExecuteContract",
        sender: address,
        contract: contract,
        execute_msg: { ...message },
        coins: [], // [{"amount":"100000","denom":"uluna"}],
      })],
      purgeQueue: true,
    });
    if (!result.success) {
      throw new Error('Error executing: ' + result.error.code + ': ' + result.error.message);
    }
    const txHash = result.result.txhash;
    console.log('tx hash', txHash, result.result);
    const linkEl = document.querySelector('#txSuccessModalLink');
    linkEl.href = 'https://finder.terra.money/mainnet/tx/' + txHash;
    linkEl.innerText = txHash.slice(0,8) + '...' + txHash.slice(-8);
    toggle('#txPendingModal');
    toggle('#txSuccessModal');
  } catch(err) {
    document.querySelector('#txErrorModalText').innerText = 'Error: ' + err.message;
    toggle('#txPendingModal');
    toggle('#txErrorModal');
  }
}

// }}}
// {{{ Page Logic

function tiersDeposit() {
  event.preventDefault();
  const chain = document.querySelector('#walletChain').innerText;
  const amount = parseAmount('#depositAmount');
  if (!amount) return alert('Invalid number entered');
  toggle('#depositModal');

  if (chain === 'Terra') {
    sendTransactionTerra('terra1td743l5k5cmfy7tqq202g7vkmdvq35q48u2jfm', {
      send: {
        amount: bigIntToTerra(amount),
        contract: 'terra18s7n93ja9nh37mttu66rhtsw05dxrcpsmw0c45',
        msg: btoa(JSON.stringify({ bond: {} })),
      },
    });
  } else if (chain === 'Ethereum' || chain === 'Fantom') {
    const data = [
      '0x4000aea0',
      '000000000000000000000000'+contracts[chain].tiers.slice(2).toLowerCase(),
      bigIntToHex(amount),
      '0000000000000000000000000000000000000000000000000000000000000060',
      '0000000000000000000000000000000000000000000000000000000000000000'
    ].join('');
    sendTransaction(contracts[chain].xrune, data);
  } else {
    alert('Unsupported chain: ' + chain);
  }
  document.querySelector('#depositAmount').value = '';
}

function tiersWithdraw() {
  event.preventDefault();
    const chain = document.querySelector('#walletChain').innerText;
    const address = document.querySelector('#walletAddress').innerText;
  const amount = parseAmount('#withdrawAmount');
  if (!amount) return alert('Invalid number entered');
  toggle('#withdrawModal');
  if (chain === 'Terra') {
    sendTransactionTerra('terra18s7n93ja9nh37mttu66rhtsw05dxrcpsmw0c45', {
      unbond: { amount: bigIntToTerra(amount) },
    });
  } else if (chain === 'Ethereum') {
    const data = [
      '0x69328dec',
      '000000000000000000000000'+contracts[chain].xrune.slice(2).toLowerCase(),
      bigIntToHex(amount),
      '000000000000000000000000'+address.slice(2).toLowerCase(),
    ].join('');
    sendTransaction(contracts[chain].tiers, data);
  } else if (chain === 'Fantom') {
    const data = ['0x2e1a7d4d', bigIntToHex(amount)].join('');
    sendTransaction(contracts[chain].tiers, data);
  } else {
    alert('Unsupported chain: ' + chain);
  }
  document.querySelector('#depositAmount').value = '';
}

// }}}
