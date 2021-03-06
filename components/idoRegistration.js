import classnames from "classnames";
import { MsgExecuteContract } from "@terra-money/terra.js";
import { useEffect, useState } from "react";
import SynapsClient from "@synaps-io/verify.js";
import Layout from "../components/layout";
import Button from "../components/button";
import Modal from "../components/modal";
import LoadingOverlay from "../components/loadingOverlay";
import {
  parseUnits,
  formatDate,
  formatNumber,
  useGlobalState,
  getContracts,
  formatUnits,
  contractAddresses,
  runTransaction,
  runTransactionTerra,
  formatErrorMessage,
} from "../utils";

const tiers = [
  { name: "Tier 1", amount: 2500, multiplier: 1 },
  { name: "Tier 2", amount: 7500, multiplier: 3 },
  { name: "Tier 3", amount: 25000, multiplier: 10 },
  { name: "Tier 4", amount: 50000, multiplier: 20 },
  { name: "Tier 5", amount: 100000, multiplier: 40 },
];

//const TIERS_API_URL = "http://localhost:8000";
const TIERS_API_URL = "https://thorstarter-tiers-api.herokuapp.com";
const idoId = "kol";
const idoName = "KOLnet";
const idoChain = "polygon";

export default function IDORegistration() {
  const state = useGlobalState();
  const [data, setData] = useState();
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [synapsData, setSynapsData] = useState(false);
  const [registerAddress, setRegisterAddress] = useState("");

  function userTotal(user) {
    return (
      (user.amount_ethereum || 0) +
      (user.amount_terra || 0) +
      (user.amount_fantom || 0) +
      (user.amount_polygon || 0) +
      (user.amount_tclp || 0) +
      (user.amount_forge || 0) +
      (user.amount_mintdao || 0)
    );
  }
  function userTier(user) {
    const total = userTotal(user);
    for (let i = tiers.length - 1; i >= 0; i--) {
      let tier = tiers[i];
      if (total >= tier.amount) {
        return i + 1;
      }
    }
    return 0;
  }
  function userMultiplier(user) {
    const total = userTotal(user);
    for (let i = tiers.length - 1; i >= 0; i--) {
      let tier = tiers[i];
      if (total >= tier.amount) {
        return tier.multiplier;
      }
    }
    return 0;
  }

  async function fetchData(refresh = false) {
    let user;
    const network = {
      1: "ethereum",
      137: "polygon",
      250: "fantom",
      "terra-classic": "terra",
    }[String(state.networkId)];
    if (state.address) {
      user = await fetch(
        TIERS_API_URL +
          "/user-fetch?network=" +
          network +
          "&address=" +
          state.address +
          "&refresh=" +
          (refresh ? "1" : "0")
      ).then((r) => r.json());
    }
    const registration = user
      ? user.registrations.find((r) => r.ido === idoId.toLowerCase())
      : null;
    console.log("data", user);
    setData({
      ...user,
      registration,
      network,
    });
  }

  useEffect(() => {
    fetchData();

    /*
    if (!state.address) return;
    (async () => {
      const res = await fetch(TIERS_API_URL + "/kyc?address=" + state.address, {
        method: "POST",
        body: "",
      });
      if (!res.ok) {
        console.error("error starting synaps session", res);
        return;
      }
      const response = await res.json();
      if (!response.verified) {
        const Synaps = new SynapsClient(response.session_id, "individual");
        Synaps.init();
      }
      setSynapsData(response);
    })();
    */
  }, [state.address]);

  function onRegister() {
    if (idoChain !== "terra" && state.address.startsWith("0x")) {
      setRegisterAddress(state.address);
    }
    if (idoChain === "terra" && state.address.startsWith("terra")) {
      setRegisterAddress(state.address);
    }
    setModal(true);
  }

  async function onSubmit() {
    try {
      setLoading(true);
      const res = await fetch(
        TIERS_API_URL +
          "/user-register?user_id=" +
          data.user.id +
          "&ido=" +
          idoId +
          "&address=" +
          registerAddress,
        { method: "POST" }
      );
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error((await res.json()).error);
        }
        throw new Error("Bad error code: " + res.status);
      }
      setRegisterAddress("");
      fetchData();
      setModal(false);
    } catch (err) {
      console.error(err);
      alert("Error: " + formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!data) return null;
  return (
    <>
      <div className="flex-heading">
        <h1 className="title">Upcoming {idoName} IDO</h1>
        <div>
          {!data.registration ? (
            <button
              className="button"
              onClick={onRegister}
              disabled={!state.address}
            >
              {state.address ? "Register Interest" : "Connect Wallet"}
            </button>
          ) : null}
        </div>
      </div>
      {data.user ? (
        <div className="tiers-upcoming-ido" style={{ marginBottom: 32 }}>
          <div className="flex mb-4">
            <div className="flex-1">
              <div>
                <strong>Total: </strong>
                {userTotal(data.user)} ({data.user["amount_" + data.network]}{" "}
                tiers + {data.user.amount_tclp || 0} TC LP) (
                <a onClick={() => fetchData(true)} className="text-primary5">
                  Refresh
                </a>
                )
              </div>
              <div>
                <strong>Tier: </strong>
                {userTier(data.user)} (Multiplier: {userMultiplier(data.user)}x)
              </div>
              <div>
                <strong>Registered: </strong>
                {data.registration ? "Yes" : "No"}
              </div>
              {data.registration ? (
                <>
                  <div>
                    <strong>Registered Address: </strong>
                    {data.registration.address}&nbsp; (
                    <a onClick={onRegister} className="text-primary5">
                      Update
                    </a>
                    )
                  </div>
                  <div>
                    <strong>Estimated Allocation: </strong>$
                    {data.userAllocation.toFixed(2)}{" "}
                    {!data.userInSnapshot
                      ? `(Our records show you have 0 XRUNE in tiers/forge)`
                      : null}
                  </div>
                </>
              ) : null}
            </div>
            <div style={{ display: "none" }}>
              <div>
                <strong>Address: </strong>
                {data.user["address_" + data.network]}
              </div>
            </div>
          </div>

          {synapsData ? (
            <div
              className="error flex mt-4 mb-0"
              style={{
                backgroundColor: "rgb(247, 229, 17)",
                color: "rgb(86, 81, 13)",
              }}
            >
              <div className="flex-1">The {idoName} IDO requires KYC:</div>
              <a
                className="button"
                id="synaps-btn"
                disabled={synapsData.verified}
              >
                {synapsData.verified
                  ? "You are verified!"
                  : "Verify with Synaps"}
              </a>
            </div>
          ) : null}

          <p className="text-sm">
            You only need to register once, connecting your wallet that is in a
            Thorstarter tier. When registering, you will be asked for the
            address you want claim your allocation with (the day of the sale).
            You don&apos;t need to visit the tiers page with the
            registered/allocation address, simply connect that wallet on the day
            of the sale on the &quot;IDOs&quot; page.
          </p>

          {/*
      <strong>Estimated Allocations (based on registrations)</strong>
      <table>
        <tbody>
          <tr>
            <th>Tier 0</th>
            <th>Tier 1</th>
            <th>Tier 2</th>
            <th>Tier 3</th>
            <th>Tier 4</th>
            <th>Tier 5</th>
          </tr>
          <tr>
            <td>
              $ {data.stats[0].allocation.toFixed(0)}{" "}
              {data.stats[0].chance !== 1
                ? `(${(data.stats[0].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[1].allocation.toFixed(0)}{" "}
              {data.stats[1].chance !== 1
                ? `(${(data.stats[1].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[2].allocation.toFixed(0)}{" "}
              {data.stats[2].chance !== 1
                ? `(${(data.stats[2].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[3].allocation.toFixed(0)}{" "}
              {data.stats[3].chance !== 1
                ? `(${(data.stats[3].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[4].allocation.toFixed(0)}{" "}
              {data.stats[4].chance !== 1
                ? `(${(data.stats[4].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
            <td>
              $ {data.stats[5].allocation.toFixed(0)}{" "}
              {data.stats[5].chance !== 1
                ? `(${(data.stats[5].chance * 100).toFixed(1)}% chance)`
                : ""}
            </td>
          </tr>
          <tr>
            <td>
              {data.stats[0].count} ({data.stats[0].allocations})
            </td>
            <td>
              {data.stats[1].count} ({data.stats[1].allocations})
            </td>
            <td>
              {data.stats[2].count} ({data.stats[2].allocations})
            </td>
            <td>
              {data.stats[3].count} ({data.stats[3].allocations})
            </td>
            <td>
              {data.stats[4].count} ({data.stats[4].allocations})
            </td>
            <td>
              {data.stats[5].count} ({data.stats[5].allocations})
            </td>
          </tr>
        </tbody>
      </table>
      */}
        </div>
      ) : null}

      {modal ? (
        <Modal onClose={() => setModal(false)} style={{ width: 400 }}>
          <h2>Register</h2>
          <p>
            Enter the address you want to claim your allocation with on IDO day.
          </p>
          <label className="label">
            {{ terra: "Terra " }[idoChain] || ""}Address
          </label>
          <input
            value={registerAddress}
            onChange={(e) => setRegisterAddress(e.target.value)}
            className="input w-full"
            placeholder={idoChain === "terra" ? "terra..." : "0x..."}
          />
          <br />
          <button
            className="button mt-4"
            onClick={onSubmit}
            disabled={loading || !registerAddress}
          >
            {loading ? "Loading..." : "Register"}
          </button>
        </Modal>
      ) : null}
    </>
  );
}
