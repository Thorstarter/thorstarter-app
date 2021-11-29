import { ethers } from "ethers";
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
  const [data, setData] = useState();

  async function fetchData() {
    try {
      const contracts = getContracts();
      const tiersInfo = new ethers.Contract(
        "0x87AE15ac6E230Adb1E2C8Dd18E6c0685EbbcB641",
        ["function totals(uint256) view returns (uint256[])"],
        state.provider
      );
      const users = await tiersInfo.totals(5000);
      const tiers = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (let user of users) {
        if (user.gte(parseUnits("150000"))) {
          tiers[5]++;
        } else if (user.gte(parseUnits("75000"))) {
          tiers[4]++;
        } else if (user.gte(parseUnits("25000"))) {
          tiers[3]++;
        } else if (user.gte(parseUnits("7500"))) {
          tiers[2]++;
        } else if (user.gte(parseUnits("2500"))) {
          tiers[1]++;
        }
      }
      setData({ tiers });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout title="Admin: Tiers">
      <h1 className="title">Admin: Tiers</h1>

      {!data ? "Loading..." : null}

      {data ? (
        <table>
          <tr>
            <td>Tier 1</td>
            <td>
              {data.tiers[1]} (x1 = {data.tiers[1] * 1})
            </td>
          </tr>
          <tr>
            <td>Tier 2</td>
            <td>
              {data.tiers[2]} (x2 = {data.tiers[2] * 2})
            </td>
          </tr>
          <tr>
            <td>Tier 3</td>
            <td>
              {data.tiers[3]} (x4 = {data.tiers[3] * 4})
            </td>
          </tr>
          <tr>
            <td>Tier 4</td>
            <td>
              {data.tiers[4]} (x8 = {data.tiers[4] * 8})
            </td>
          </tr>
          <tr>
            <td>Tier 5</td>
            <td>
              {data.tiers[5]} (x12 = {data.tiers[5] * 12})
            </td>
          </tr>
          <tr>
            <td>Allocations</td>
            <td>
              {data.tiers[1] * 1 +
                data.tiers[2] * 2 +
                data.tiers[3] * 4 +
                data.tiers[4] * 8 +
                data.tiers[5] * 12}
            </td>
          </tr>
        </table>
      ) : null}
    </Layout>
  );
}
