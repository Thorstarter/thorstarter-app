function setCookie(name, value) {
  document.cookie = name+'='+value+';path=/';
}

function getCookie(name) {
  const x = document.cookie.split(';');
  const y = x.map(x => x.split('=').map(x => x.trim())).find(x => x[0] === name)
  return y ? y[1] : null;
}

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
}

function setupEthereum() {
  if (!window.ethereum) return;
  ethereum.on('accountsChanged', handleChangedAccounts);
  ethereum.on('chainChanged', handleChangedChain);
}

function ready() {
  setupEthereum();
}

function walletConnect() {
  if (getCookie('walletAddress')) {
    setCookie('walletChain', '');
    setCookie('walletAddress', '');
    window.location.reload();
    return;
  }
  if (!window.ethereum) {
    return alert('Metamask wallet is not installed!');
  }
  window.ethereum.request({ method: 'eth_requestAccounts' }).then(handleChangedAccounts);
}

window.addEventListener('DOMContentLoaded', ready);
