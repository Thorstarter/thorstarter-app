import Link from "next/link";

export default function GovernanceNav({ className, page }) {
  return (
    <div className={`governance-nav ${className || ""}`}>
      <Link href="/governance/proposals/">
        <a className={page === "proposals" ? "active" : ""}>Proposals</a>
      </Link>
      <Link href="/governance/token/">
        <a className={page === "token" ? "active" : ""}>Voting Token</a>
      </Link>
      <Link href="/governance/dashboard/">
        <a className={page === "dashboard" ? "active" : ""}>
          Vesting Dashboard
        </a>
      </Link>
      <Link href="https://forum.thorstarter.org/">
        <a target="_blank">Forum</a>
      </Link>
    </div>
  );
}
