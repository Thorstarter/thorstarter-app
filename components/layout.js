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
} from "../utils";

import imgLogo from "../public/logo.svg";

export default function Layout({ title, children, page }) {
  const state = useGlobalState();

  async function onConnect() {
    if (state.address) return;
    connectWallet();
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
            <Link href="/swap/">
              <a className={page === "swap" ? "text-primary5" : ""}>Swap</a>
            </Link>
            <Link href="/governance/token/">
              <a className={page === "governance" ? "text-primary5" : ""}>
                Governance
              </a>
            </Link>
            <Link href="https://docs.thorstarter.org/">
              <a target="_blank">Learn</a>
            </Link>
          </div>
          <Button onClick={onConnect}>
            {state.address ? formatAddress(state.address) : "Connect Wallet"}
          </Button>
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
