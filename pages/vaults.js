import Layout from "../components/layout";
import Vault from "../components/vault";

import vaults from "../data/vaults.json";

export default function Vaults() {
  return (
    <Layout title="Vaults" page="vaults">
      <h1 className="title">Vaults</h1>
      <div className="vaults-grid">
        {vaults.map((item, idx) => (
          <Vault data={item} key={idx} />
        ))}
      </div>
    </Layout>
  );
}
