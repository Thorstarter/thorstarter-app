import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useEffect, Component } from "react";
import Button from "./button";
import Icon from "./icon";
import {
  useGlobalState,
  setGlobalState,
  formatAddress,
  connectWallet,
  disconnectWallet,
  networkNames,
} from "../utils";

import imgLogo from "../public/logo.svg";

export default function Layout({ title, children, page }) {
  const state = useGlobalState();
  const isHomeNetwork = state.networkId === 1 || state.networkId === 3;

  async function onConnect() {
    if (state.address) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  }

  return (
    <div>
      <Head>
        <title>{title ? title + " | " : ""}Thorstarter</title>
      </Head>
      <div className="layout-header">
        <div className="layout-header-container">
          <div className="logo">
            <Link href="/">
              <a>
                <Image src={imgLogo} width={282} height={60} alt="Logo" />
              </a>
            </Link>
          </div>
          <div className="nav">
            <Link href="/">
              <a className={page === "idos" ? "text-primary5" : ""}>IDOs</a>
            </Link>
            {isHomeNetwork ? (
              <Link href="/tiers/">
                <a className={page === "tiers" ? "text-primary5" : ""}>Tiers</a>
              </Link>
            ) : null}
            {isHomeNetwork ? (
              <Link href="/farm/">
                <a className={page === "farm" ? "text-primary5" : ""}>Farm</a>
              </Link>
            ) : null}
            {isHomeNetwork ? (
              <Link href="/governance/token/">
                <a className={page === "governance" ? "text-primary5" : ""}>
                  Governance
                </a>
              </Link>
            ) : null}
          </div>
          <div
            className={`layout-header-network ${
              networkNames[state.networkId]
                ? ""
                : "layout-header-network-unsupported"
            }`}
          >
            {networkNames[state.networkId] || "Unsupported network"}
            <Button onClick={onConnect}>
              {state.address ? formatAddress(state.address) : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </div>
      <div className="layout-content">
        <ErrorBoundary>
          <div>{children}</div>
        </ErrorBoundary>
      </div>
      <div className="layout-footer">
        <div className="footer-socials">
          <Link href="https://twitter.com/thorstarter">
            <a>
              <Icon name="twitter" />
            </a>
          </Link>
          <Link href="https://t.me/thorstarter">
            <a>
              <Icon name="telegram" />
            </a>
          </Link>
          <Link href="https://discord.gg/fPjbPxm37F">
            <a>
              <Icon name="discord" />
            </a>
          </Link>
          <Link href="https://medium.com/@thorstarter">
            <a>
              <Icon name="medium" />
            </a>
          </Link>
        </div>
        <div className="footer-links">
          <Link href="https://thorstarter.org/about/">
            <a>About</a>
          </Link>
          <Link href="https://thorstarter.org/">
            <a>Website</a>
          </Link>
          <Link href="https://docs.thorstarter.org/">
            <a>Docs</a>
          </Link>
        </div>
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
