import { useEffect, useState } from "react";
import Image from "next/image";
import Button from "../../components/button";
import Layout from "../../components/layout";
import GovernanceNav from "../../components/governanceNav";
import LoadingOverlay from "../../components/loadingOverlay";
import {
  bn,
  parseUnits,
  useGlobalState,
  getContracts,
  formatNumber,
  formatErrorMessage,
  runTransaction,
} from "../../utils";
import abis from "../../abis";

import logoBnpl from "../../public/ido/bnpl-logo.png";
import coverBnpl from "../../public/ido/bnpl-cover.png";
import logoThorswap from "../../public/ido/thorswap-logo.png";
import coverThorswap from "../../public/ido/thorswap-cover.png";

const vestingIdos = [
  {
    name: "THORSwap",
    date: "2021-11-05",
    initialGrant: "$ 250,000",
    vesting: "9 month (1 month cliff)",
    logo: logoThorswap,
    cover: coverThorswap,
    snapshotId: {
      1: "5",
      3: "",
    },
    contract: {
      1: "0xFD3322Cf85d358Fc591dbb8C5e56e7185F7E5aAc",
      3: "",
    },
  },
  {
    name: "BNPL Pay",
    date: "2021-09-14",
    initialGrant: "$ 250,000",
    vesting: "2 years",
    logo: logoBnpl,
    cover: coverBnpl,
    snapshotId: {
      1: "4",
      3: "",
    },
    contract: {
      1: "0xcb12Cb135e0D53775bc4F09Be07809b9Ea62ea90",
      3: "",
    },
  },
  /*
  {
    name: "Skyrim",
    date: "2021-08-31",
    initialGrant: "$ 250,000",
    vesting: "2 years",
    logo: logoSkyrim,
    cover: coverSkyrim,
    snapshotId: {
      1: "3",
      3: "",
    },
    contract: {
      1: "0x7bc47D1632A598A79031e6f65958Aa0f681a3BD3",
      3: "",
    },
  },
  */
];

async function fetchPrice() {
  const req = await fetch(
    "https://1e35cbc19de1456caf8c08b2b4ead7d2.thorstarter.org/005cf62030316481c442e0ed49580de500/",
    { method: "POST" }
  );
  const res = await req.json();
  return parseFloat(res.xrune.quote.USD.price);
}

export default function GovernanceDashboard() {
  const state = useGlobalState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [idos, setIdos] = useState(null);

  async function fetchData() {
    try {
      const contracts = getContracts();
      const idos = [];
      for (let vestingIdo of vestingIdos) {
        const lpTokenVesting = new ethers.Contract(
          vestingIdo.contract[state.networkId],
          abis.lpTokenVesting,
          state.provider
        );
        const lpToken = new ethers.Contract(
          await lpTokenVesting.pair(),
          abis.token,
          state.provider
        );

        const now = (Date.now() / 1000) | 0;
        const vestingStart = (await lpTokenVesting.vestingStart()).toNumber();
        const vestingCliff = (await lpTokenVesting.vestingCliff()).toNumber();
        const vestingLength = (await lpTokenVesting.vestingLength()).toNumber();
        const progress = Math.min(
          1,
          Math.max(0, (now - vestingStart - vestingCliff) / vestingLength)
        );

        const sentToVoters = await contracts.vid.snapshotAmounts(
          vestingIdo.snapshotId[state.networkId]
        );

        const xrunePrice = await fetchPrice();
        const initialLpShare = (
          await lpTokenVesting.initialLpShareAmount()
        ).div("2");
        const currentLpShare = (
          await lpToken.balanceOf(lpTokenVesting.address)
        ).div("2");
        const lpTotalSupply = await lpToken.totalSupply();
        const xruneBalance = await contracts.xrune.balanceOf(lpToken.address);
        const xruneLeftToVest = currentLpShare
          .mul(xruneBalance)
          .mul("2")
          .div(lpTotalSupply);
        const currentValue = initialLpShare
          .mul(xruneBalance)
          .mul("2")
          .div(lpTotalSupply)
          .mul(parseUnits(xrunePrice.toFixed(5)))
          .div(parseUnits("1"));

        let percentOfSnapshot = parseUnits("0");
        let percentOfVoters = parseUnits("0");
        let claimable = parseUnits("0");
        const votersTotalSupply = await contracts.voters.totalSupply();
        const votersSnapshotTotalSupply = await contracts.voters.totalSupplyAt(
          vestingIdo.snapshotId[state.networkId]
        );
        if (state.address) {
          percentOfSnapshot = (
            await contracts.voters.balanceOfAt(
              state.address,
              vestingIdo.snapshotId[state.networkId]
            )
          )
            .mul(parseUnits("100"))
            .div(votersSnapshotTotalSupply);
          percentOfVoters = (await contracts.voters.balanceOf(state.address))
            .mul(parseUnits("100"))
            .div(votersTotalSupply);
          claimable = await contracts.vid.claimable(
            vestingIdo.snapshotId[state.networkId],
            state.address
          );
        }

        const sentToVoters35 = sentToVoters.div("2");
        const leftToVest35 = xruneLeftToVest.mul("35").div("100");

        idos.push({
          ...vestingIdo,
          xrunePrice: xrunePrice,
          currentValue: currentValue,
          progress: progress * 100,
          sentToDao: sentToVoters.div("35").mul("5"),
          sentToVoters: sentToVoters.mul("2"),
          xruneLeftToVest: xruneLeftToVest,
          percentOfSnapshot: percentOfSnapshot,
          percentOfVoters: percentOfVoters,
          xruneEarned: sentToVoters35
            .mul(percentOfSnapshot)
            .add(sentToVoters35.mul(percentOfVoters))
            .div(parseUnits("100")),
          xruneVesting: leftToVest35
            .mul(percentOfSnapshot)
            .add(leftToVest35.mul(percentOfVoters))
            .div(parseUnits("100")),
          claimable: claimable,
          aprHistorical: sentToVoters35
            .mul("31536000")
            .div((Date.now() / 1000 - vestingStart).toFixed(0))
            .mul(parseUnits("200")) // 1e18 (decimals) * 100 (%) * 2 (70%)
            .div(votersSnapshotTotalSupply),
          aprCurrent: leftToVest35
            .mul("31536000")
            .div((vestingStart + vestingLength - Date.now() / 1000).toFixed(0))
            .mul(parseUnits("200"))
            .div(votersSnapshotTotalSupply),
        });
      }
      setIdos(idos);
    } catch (err) {
      console.error("fetchData:", err);
      setError(formatErrorMessage(err));
    }
  }

  useEffect(() => {
    fetchData();
  }, [state.networkId, state.address]);

  async function onClaim(ido) {
    const contracts = getContracts();
    const call = contracts.vid.claim(ido.snapshotId[state.networkId]);
    await runTransaction(call, setLoading, setError);
    fetchData();
  }

  async function onClaimAll() {
    const snapshotIds = [];
    for (let ido of idos) {
      if (ido.claimable.gt("0"))
        snapshotIds.push(ido.snapshotId[state.networkId]);
    }
    const contracts = getContracts();
    const call = contracts.vid.claimMultipleTo(snapshotIds, state.address);
    await runTransaction(call, setLoading, setError);
    fetchData();
  }

  const totalClaimable = (idos || []).reduce(
    (t, i) => t.add(i.claimable),
    bn("0")
  );

  return (
    <Layout title="Governance: Vesting Dashboard">
      <h1 className="title">Governance: Vesting Dashboard</h1>

      <GovernanceNav className="mb-8" page="dashboard" />

      {error ? <div className="error mb-4">{error}</div> : null}
      {loading ? <LoadingOverlay message={loading} /> : null}

      <div className="flex mb-4">
        <div className="flex-1 box py-4 text-center mr-4">
          Total Grants Value
          <h2 className="ma-0">
            ${" "}
            {formatNumber(
              (idos || []).reduce((t, i) => i.currentValue.add(t), bn("0")),
              0
            )}
          </h2>
        </div>
        <div className="flex-1 box py-4 text-center">
          Combined APR
          <h2 className="ma-0">
            {formatNumber(
              (idos || []).reduce((t, i) => i.aprCurrent.add(t), bn("0"))
            )}{" "}
            %
          </h2>
        </div>
      </div>

      {totalClaimable.gt("0") ? (
        <div className="text-center box mb-4">
          Claim rewards for all IDOs ({formatNumber(totalClaimable)} XRUNE)
          <Button className="ml-4" onClick={onClaimAll}>
            Claim
          </Button>
        </div>
      ) : null}

      {(idos || []).map((ido) => (
        <div className="vesting-ido box mb-2" key={ido.name}>
          <div
            className="vesting-ido-cover"
            style={{ backgroundImage: `url(${ido.cover.src})` }}
          >
            <div className="vesting-ido-logo">
              <Image
                src={ido.logo}
                alt={ido.name}
                height={60}
                width={(60 * ido.logo.width) / ido.logo.height}
              />
            </div>
            <div className="vesting-ido-cover-title">{ido.name}</div>
            <div className="vesting-ido-cover-date">{ido.date}</div>
          </div>
          <div className="flex">
            <div className="flex-1 mr-8">
              <h3>Statistics</h3>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Initial LP Grant Value</div>
                <div>{ido.initialGrant}</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Current LP Grant Value</div>
                <div>$ {formatNumber(ido.currentValue, 0)}</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Vesting Time</div>
                <div>{ido.vesting}</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Vesting Progress</div>
                <div>{formatNumber(ido.progress, 2)}%</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">XRUNE Sent To DAO</div>
                <div>
                  ($
                  {formatNumber(
                    ido.sentToDao.mul((ido.xrunePrice * 10000) | 0).div("10000")
                  )}
                  ) {formatNumber(ido.sentToDao, 0)}
                </div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">XRUNE Sent To Voters</div>
                <div>
                  ($
                  {formatNumber(
                    ido.sentToVoters
                      .mul((ido.xrunePrice * 10000) | 0)
                      .div("10000")
                  )}
                  ) {formatNumber(ido.sentToVoters, 0)}
                </div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">XRUNE Left To Vest</div>
                <div>
                  ($
                  {formatNumber(
                    ido.xruneLeftToVest
                      .mul((ido.xrunePrice * 10000) | 0)
                      .div("10000")
                  )}
                  ) {formatNumber(ido.xruneLeftToVest, 0)}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3>Your Rewards</h3>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Historical APR</div>
                <div>{formatNumber(ido.aprHistorical, 2)}%</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Current APR</div>
                <div>{formatNumber(ido.aprCurrent, 2)}%</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Your % of the snapshot</div>
                <div>{formatNumber(ido.percentOfSnapshot, 4)}%</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">Your % of the voters</div>
                <div>{formatNumber(ido.percentOfVoters, 4)}%</div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">XRUNE earned</div>
                <div>
                  ($
                  {formatNumber(
                    ido.xruneEarned
                      .mul((ido.xrunePrice * 10000) | 0)
                      .div("10000")
                  )}
                  ) ~ {formatNumber(ido.xruneEarned, 1)}
                </div>
              </div>
              <div className="flex mb-2">
                <div className="flex-1 text-gray6">XRUNE vesting</div>
                <div>
                  ($
                  {formatNumber(
                    ido.xruneVesting
                      .mul((ido.xrunePrice * 10000) | 0)
                      .div("10000")
                  )}
                  ) ~ {formatNumber(ido.xruneVesting, 1)}
                </div>
              </div>
              <div className="flex mt-6">
                <div className="flex-1 text-gray6 mb-3">Claimable</div>
                <div>{formatNumber(ido.claimable)} XRUNE</div>
              </div>
              <Button
                disabled={ido.claimable.eq("0")}
                className="w-full"
                onClick={onClaim.bind(null, ido)}
              >
                Claim
              </Button>
            </div>
          </div>
        </div>
      ))}
      {(idos || []).length === 0 ? (
        <div className="py-16 text-center">Loading...</div>
      ) : null}
    </Layout>
  );
}
