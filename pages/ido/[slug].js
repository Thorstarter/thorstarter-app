import { ethers } from "ethers";
import { useState, useEffect } from "react";
import dateFormat from "dateformat";

import Layout from "../../components/layout";
import Copier from "../../components/copier";
import Countdown from "../../components/countdown";
import { IconSvg } from "../../components/icon";

import { getContracts, useGlobalState, formatNumber } from "../../utils";
import abis from "../../abis";

import ido from "../../data/ido.json";

export default function Single({ data }) {
  const state = useGlobalState();
  const [params, setParams] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [about, setAbout] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState(false);
  const [progress, setProgress] = useState("0");

  async function fetchData() {
    const contracts = getContracts();
    const lastBlock = await getState().provider.getBlock(-1);

    if (data.type === "batch") {
      const sale = new ethers.Contract(
        data.address,
        abis.saleBatch,
        state.provider
      );
      const params = await sale.getParams();
      const newParams = {
        timestamp: lastBlock.timestamp,
        start: new Date(params[0].toNumber() * 1000),
        end: new Date(params[1].toNumber() * 1000),
        raising: params[2],
        offering: params[3],
        cap: params[4],
        comitted: params[5],
        paused: params[6],
        finalized: params[7],
        price: params[2].mul(ethers.utils.parseUnits("1")).div(params[3]),
      };
      setParams(newParams);

      if ((data.type === "batch" || ido.type === "data") && params) {
        const value = Math.min(
          params[5].mul(10000).div(params[2]).toNumber() / 100,
          100
        ).toFixed(2);
        setProgress(value);
      }

      if (!state.address) return;
      const userInfo = await sale.userInfo(state.address);
      setUserInfo({
        amount: userInfo[0],
        claimedRefund: userInfo[1],
        claimedTokens: userInfo[2],
        allocation: await sale.getOfferingAmount(state.address),
        refund: await sale.getRefundingAmount(state.address),
      });
    }
  }

  useEffect(() => {
    setAbout([]);

    // set array of about section blocks
    data.about.forEach((item) => {
      item.title &&
        item.content &&
        setAbout((prevState) => [...prevState, item]);
    });

    // check additional section visibillity
    if (
      data.detailedTokenMetrics.length > 0 ||
      data.privateSale.length > 0 ||
      data.publicSale.length > 0
    ) {
      setAdditionalInfo(true);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
    const handle = setInterval(fetchData, 5000);
    setTimeout(() => clearInterval(handle), 3 * 60 * 60 * 1000); // Stop after 3 hours
    return () => clearInterval(handle);
  }, [state.networkId, state.address]);

  const smoothScrollTo = (id) => {
    window.scrollTo({
      top:
        document.getElementById(id).getBoundingClientRect().top +
        window.scrollY -
        28,
      behavior: "smooth",
    });
  };

  return (
    <Layout title={data.tokenInformation.name.value} page={`/ido/${data.slug}`}>
      <div className="ido-head">
        <div className="ido-head__aside">
          <img src={data.logo} alt="" className="ido-head__logo" />
          <h1 className="ido-head__title">
            {data.tokenInformation.name.value}
          </h1>
          <Copier copy={data.tokenInformation.address.value}>
            <a
              href={`https://etherscan.io/address/${data.tokenInformation.address.value}`}
              target="_blank"
              rel="noreferrer"
            >
              {data.tokenInformation.address.value}
            </a>
          </Copier>
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
        <div className="ido-head__main">
          <div className="ido-head__section">
            <div className="ido-head__subtitle">
              Swap Amount{" "}
              <span>
                1 {data.tokenInformation.symbol.value} = $
                {params && formatNumber(params.price)}
              </span>
            </div>
            <div className="ido-head__section-value">
              {params && formatNumber(params.offering)}{" "}
              {data.tokenInformation.symbol.value}
            </div>
          </div>
          {params && (
            <div className="ido-head__section">
              <div className="ido-head__subtitle">Closes in</div>
              <div className="ido-head__section-value">
                {params.end.getTime() > new Date().getTime() ? (
                  <Countdown to={params.end} simple />
                ) : (
                  "Ended"
                )}
              </div>
            </div>
          )}
          <div className="ido-head__section">
            <div className="ido-head__subtitle">Progress</div>
            <div className="progress with-foot">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
              <div className="progress-foot">
                <span>
                  <span className="progress-value">{progress}%</span>
                </span>
                {params && (
                  <span>
                    $
                    {formatNumber(
                      params.comitted
                        .mul((data.xrunePrice * 10000) | 0)
                        .div(10000),
                      2
                    )}{" "}
                    / {formatNumber(params.comitted)}{" "}
                    {data.tokenInformation.symbol.value}
                  </span>
                )}
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
              return data.poolDetails[key].label &&
                data.poolDetails[key].value ? (
                <tr key={idx}>
                  <td>{data.poolDetails[key].label}</td>
                  {key === "date" ? (
                    <td>{dateString}</td>
                  ) : (
                    <td>{data.poolDetails[key].value}</td>
                  )}
                </tr>
              ) : null;
            })}
          </tbody>
        </table>
      </div>

      {about.length > 0 && (
        <section className="ido-content">
          <h3 className="title">About Project</h3>
          <div className="ido-content__grid">
            <div className="ido-content__aside">
              <ul>
                {about.map(
                  (item, idx) =>
                    item.title &&
                    item.content && (
                      <li
                        key={idx}
                        onClick={() =>
                          smoothScrollTo(`ido-about-section-${idx}`)
                        }
                      >
                        <span>{idx + 1}</span>
                        {item.title}
                      </li>
                    )
                )}
                {additionalInfo && (
                  <li
                    onClick={() =>
                      smoothScrollTo(`ido-about-section-${about.length}`)
                    }
                  >
                    <span>{about.length + 1}</span>
                    Detailed Token Metrics
                  </li>
                )}
              </ul>
            </div>
            <div className="ido-content__main">
              {about.map(
                (item, idx) =>
                  item.title &&
                  item.content && (
                    <section
                      className="ido-content__section"
                      key={idx}
                      id={`ido-about-section-${idx}`}
                    >
                      <h4 className="ido-content__subtitle">
                        {idx + 1}. {item.title}
                      </h4>
                      <div
                        className="ido-content__description"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </section>
                  )
              )}
              {additionalInfo && (
                <section
                  className="ido-content__section"
                  id={`ido-about-section-${about.length}`}
                >
                  <h4 className="ido-content__subtitle">
                    {about.length + 1}. Detailed Token Metrics
                  </h4>
                  {data.detailedTokenMetrics.length > 0 && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th colSpan={2}>Key Metrics</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.detailedTokenMetrics.map((item, idx) =>
                          item.title && item.value ? (
                            <tr key={idx}>
                              <td>{item.title}</td>
                              <td>{item.value}</td>
                            </tr>
                          ) : null
                        )}
                      </tbody>
                    </table>
                  )}
                  {data.privateSale.length > 0 && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th colSpan={2}>Private Sale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.privateSale.map((item, idx) =>
                          item.title && item.value ? (
                            <tr key={idx}>
                              <td>{item.title}</td>
                              <td>{item.value}</td>
                            </tr>
                          ) : null
                        )}
                      </tbody>
                    </table>
                  )}
                  {data.publicSale.length > 0 && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th colSpan={2}>Public Sale (SHO)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.publicSale.map((item, idx) =>
                          item.title && item.value ? (
                            <tr key={idx}>
                              <td>{item.title}</td>
                              <td>{item.value}</td>
                            </tr>
                          ) : null
                        )}
                      </tbody>
                    </table>
                  )}
                </section>
              )}
            </div>
          </div>
        </section>
      )}
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
