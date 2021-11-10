import { useEffect, useState } from "react";
import Layout from "../../components/layout";
import {
  useGlobalState,
  formatNumber,
  parseUnits,
  getContracts,
  ADDRESS_ZERO,
} from "../../utils";

export default function AdminTiers() {
  const state = useGlobalState();
  const [n, setN] = useState(0);
  const [data, setData] = useState();

  async function fetchData() {
    try {
      const contracts = getContracts();
      const users = [];
      for (let i = 0; true; i++) {
        try {
            const address = await contracts.tiers.users(i);
            setN(i);
            users.push(await contracts.tiers.userInfoAmounts(address));
        } catch (e) {
            break;
        }
      }
      const tiers = {1:0,2:0,3:0,4:0};
      let nftCount = 0;
      for (let user of users) {
        if (user[1].gte(parseUnits('150000'))) {
            tiers[4]++;
        } else if (user[1].gte(parseUnits('25000'))) {
            tiers[3]++;
        } else if (user[1].gte(parseUnits('7500'))) {
            tiers[2]++;
        } else if (user[1].gte(parseUnits('2500'))) {
            tiers[1]++;
        }
        if (user[4][2].gt(0)) nftCount++;
      }
      const nftTotalSupply = (await contracts.twnft.totalSupply()).toNumber();
      setData({
          nftCount,
          nftTotalSupply,
          tiers,
      });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout title="Private Investors Vesting">
      <h1 className="title">Admin: Tiers</h1>

      {!data ? "Loading..." + n : null}

      {data ? (
          <table>
              <tr>
                  <td>Tier 1</td>
                  <td>{data.tiers[1]}</td>
              </tr>
              <tr>
                  <td>Tier 2</td>
                  <td>{data.tiers[2]} (+ {data.nftTotalSupply - data.nftCount})</td>
              </tr>
              <tr>
                  <td>Tier 3</td>
                  <td>{data.tiers[3]}</td>
              </tr>
              <tr>
                  <td>Tier 4</td>
                  <td>{data.tiers[4]}</td>
              </tr>
              <tr>
                  <td>Tiers Users With Nfts</td>
                  <td>{data.nftCount}</td>
              </tr>
              <tr>
                  <td>Total Nft Supply</td>
                  <td>{data.nftTotalSupply}</td>
              </tr>
          </table>
      ) : null}
    </Layout>
  );
}
