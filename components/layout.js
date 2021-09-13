import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, Component } from "react";
import Button from "./button";
import { useGlobalState, setGlobalState, formatAddress, connectWallet } from "../utils";

import imgLogo from "../public/logo.svg";

export default function Layout({ title, children, page }) {
  const state = useGlobalState();

  async function onConnect() {
    if (state.address) return;
    connectWallet();
  }

  useEffect(() => {
    if (global.window && window.localStorage.getItem("connectedAddress")) {
      connectWallet();
    } else {
      (async () => {
        const networkId = (await state.provider.getNetwork()).chainId;
        if (state.networkId !== networkId) {
          setGlobalState({ networkId });
        }
      })();
    }
  }, []);

  return (
    <div>
      <Head>
        <title>{title ? title + " | " : ""}Thorstarter</title>
      </Head>
      <div className="layout-header">
        <div className="layout-header-top">
          <div className="layout-header-container flex">
            <div className="flex-1">
              <Image src={imgLogo} width={200} height={43} alt="Logo" />
            </div>
            <div>
              <Button onClick={onConnect}>
                {state.address ? formatAddress(state.address) : "Connect Wallet"}
              </Button>
            </div>
          </div>
        </div>
        <div className="layout-header-nav">
          <div className="layout-header-container nav">
            <Link href="/"><a className={page === 'idos' ? 'text-primary5' : ''}>IDOs</a></Link>
            <Link href="/swap/"><a className={page === 'swap' ? 'text-primary5' : ''}>Swap</a></Link>
            <Link href="/governance/token/"><a className={page === 'governance' ? 'text-primary5' : ''}>Governance</a></Link>
            <Link href="https://docs.thorstarter.org/"><a target="_blank">Learn</a></Link>
          </div>
        </div>
      </div>
      <div className="layout-content">
        <ErrorBoundary>
          <div>{children}</div>
        </ErrorBoundary>
      </div>
      <div className="layout-footer">
        <Link href="https://thorstarter.org/about/">About</Link>
        <Link href="https://twitter.com/thorstarter">Twitter</Link>
        <Link href="https://t.me/thorstarter">Telegram</Link>
        <Link href="https://discord.gg/fPjbPxm37F">Discord</Link>
        <Link href="https://medium.com/@thorstarter">Medium</Link>
        <Link href="https://thorstarter.org/">Website</Link>
        <Link href="https://docs.thorstarter.org/">Docs</Link>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("boundary", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error">
          Unexepcted error occured: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}
