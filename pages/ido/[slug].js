import { useState, useEffect } from "react";
import dateFormat from "dateformat";

import Layout from "../../components/layout";
import Copier from "../../components/copier";
import { IconSvg } from "../../components/icon";

import ido from "../../data/ido.json";

export default function Single({ data }) {
  const [about, setAbout] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState(false);

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
                href={`https://etherscan.io/address/${data.tokenInformation.address.value}`}
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
        <div className="ido-head__main">
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
