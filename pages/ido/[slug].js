import dateFormat from "dateformat";

import Layout from "../../components/layout";
import Copier from "../../components/copier";
import { IconSvg } from "../../components/icon";

import ido from "../../data/ido.json";

export default function Single({ data }) {
  return (
    <Layout title={data.tokenInformation.name.value} page={`/ido/${data.slug}`}>
      <div className="ido-head">
        <div className="ido-head__aside">
          <img src={data.logo} alt="" className="ido-head__logo" />
          <h1 className="ido-head__title">
            {data.tokenInformation.name.value}
          </h1>
          <Copier
            label={data.tokenInformation.address.value}
            copy={data.tokenInformation.address.value}
          />
          <ul className="ido-head__buttons">
            <li>
              <a href="#" className="button button-lg">
                <img
                  src="/icons/plus.svg"
                  alt=""
                  width={12}
                  height={12}
                  loading="lazy"
                  decoding="async"
                />
                Join Pool
              </a>
            </li>
            <li>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="button button-lg button-outline button-white"
              >
                View Etherscan
              </a>
            </li>
          </ul>
          <ul className="ido-head__meta">
            <li>
              <img
                src="/icons/crypto-ethereum.svg"
                alt=""
                width={24}
                height={24}
                loading="lazy"
                decoding="async"
              />
              Ethereum
            </li>
            <li>
              <span className="fill-label">Filled</span>
            </li>
            <li>Published 1 day ago</li>
          </ul>
          <div className="ido-links">
            {data.socials.map((item, idx) => {
              return (
                <a href={item.link} key={idx}>
                  <IconSvg name={item.provider} />
                </a>
              );
            })}
          </div>
        </div>
        <div>
          <div className="ido-head__section">
            <div className="ido-head__subtitle">
              Swap Amount{" "}
              <span>1 {data.tokenInformation.symbol.value} = $0.5</span>
            </div>
            <div className="ido-head__section-value">
              {data.tokenInformation.totalSupply.value}{" "}
              {data.tokenInformation.symbol.value}
            </div>
          </div>
          <div className="ido-head__section">
            <div className="ido-head__subtitle">Closes in</div>
            <div className="ido-head__section-value">Ended</div>
          </div>
          <div className="ido-head__section">
            <div className="ido-head__subtitle">Progress</div>
            <div className="progress with-foot">
              <div className="progress-bar" style={{ width: `100%` }} />
              <div className="progress-foot">
                <span>
                  <span className="progress-value">100%</span> (Min. 52%)
                </span>
                <span>$500,000/1,000,000 BROKKR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="ido-tables">
        <table className="table justified">
          <thead>
            <tr>
              <th colSpan={2}>Token Information</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(data.tokenInformation).map((key, idx) => (
              <tr key={idx}>
                <td>{data.tokenInformation[key].label}</td>
                <td>{data.tokenInformation[key].value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="table justified">
          <thead>
            <tr>
              <th colSpan={2}>Pool Details</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(data.poolDetails).map((key, idx) => {
              const dateString = `${dateFormat(
                Number(
                  +new Date(data.poolDetails[key].value),
                  "mmmm, dd yyyy",
                  true
                )
              )} UTC`;
              return (
                data.poolDetails[key].label &&
                data.poolDetails[key].value && (
                  <tr key={idx}>
                    <td>{data.poolDetails[key].label}</td>
                    {key === "date" ? (
                      <td>{dateString}</td>
                    ) : (
                      <td>{data.poolDetails[key].value}</td>
                    )}
                  </tr>
                )
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ query: { slug } }) {
  const data = ido.filter((item) => item.slug === slug)[0] ?? {};

  if (!Object.keys(data).length) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      data,
    },
  };
}
