import classnames from "classnames";

import Layout from "../components/layout";
import Button from "../components/button";

export default function Tiers() {
  return (
    <Layout title="Tiers" page="tiers">
      <h1 className="title">Tiers</h1>
      <div className="tiers-wrapper">
        <div className="tiers-wrapper__line">
          <div className="tiers-wrapper__progress" style={{ width: "52%" }}>
            <div className="tiers-wrapper__data">
              Your score: <span>23,492</span>
            </div>
          </div>
        </div>
        <div className="tiers-wrapper__grid">
          <div className="tiers-wrapper__col">
            <div className={classnames("tiers-wrapper__block", "is-active")}>
              <div className="tiers-wrapper__caption">Tier 1</div>
              <div className="tiers-wrapper__sum">2,500</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div className="tiers-wrapper__subtext">
                Allocation <br />
                Multiplier
              </div>
              <div className={classnames("tiers-wrapper__num", "is-active")}>
                1x
              </div>
            </div>
          </div>
          <div className="tiers-wrapper__col">
            <div className={classnames("tiers-wrapper__block", "is-active")}>
              <div className="tiers-wrapper__caption">Tier 2</div>
              <div className="tiers-wrapper__sum">10,000</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div className={classnames("tiers-wrapper__num", "is-active")}>
                2x
              </div>
            </div>
          </div>
          <div className="tiers-wrapper__col">
            <div className="tiers-wrapper__block">
              <div className="tiers-wrapper__caption">Tier 3</div>
              <div className="tiers-wrapper__sum">50,000</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div className="tiers-wrapper__num">5x</div>
            </div>
          </div>
          <div className="tiers-wrapper__col">
            <div className="tiers-wrapper__block">
              <div className="tiers-wrapper__caption">Tier 4</div>
              <div className="tiers-wrapper__sum">250,000</div>
            </div>
            <div className="tiers-wrapper__foot">
              <div className="tiers-wrapper__num">15x</div>
            </div>
          </div>
        </div>
      </div>
      <section className="page-section">
        <h3 className="title">Deposit</h3>
        <div className="default-table">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Balance</th>
                <th>Staked</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>vXRUNE</td>
                <td>20,000</td>
                <td>N/A</td>
                <td />
              </tr>
              <tr>
                <td>XRUNE</td>
                <td>0</td>
                <td>3,492</td>
                <td className="tar">
                  <Button>Deposit</Button>
                  <Button className="button-outline">Withdraw</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid">
          <div className="default-table">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th className="tac">Balance</th>
                  <th className="tac">Staked</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>THOR</td>
                  <td className="tac" style={{ width: 110 }}>
                    999 <br />
                    <Button className="button-sm">Deposit</Button>
                  </td>
                  <td className="tac" style={{ width: 110 }}>
                    20 <br />
                    <Button className="button-outline button-sm">
                      Withdraw
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td>TGT</td>
                  <td className="tac" style={{ width: 110 }}>
                    0 <br />
                    <Button className="button-sm">Deposit</Button>
                  </td>
                  <td className="tac" style={{ width: 110 }}>
                    0 <br />
                    <Button className="button-outline button-sm">
                      Withdraw
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="default-table">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th className="tac">Balance</th>
                  <th className="tac">Staked</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ThorGuards NFT</td>
                  <td className="tac" style={{ width: 110 }}>
                    1
                  </td>
                  <td className="tac" style={{ width: 110 }}>
                    N/A
                  </td>
                </tr>
                <tr>
                  <td>ThorWallet NFT</td>
                  <td className="tac" style={{ width: 110 }}>
                    1
                  </td>
                  <td className="tac" style={{ width: 110 }}>
                    N/A
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
}
