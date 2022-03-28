import { useState } from "react";
import Button from "./button";

export default function Disclaimer() {
  const [read, setRead] = useState(
    global.window && window.localStorage.getItem("readDisclaimer")
  );

  function onAgree() {
    setRead(true);
    window.localStorage.setItem("readDisclaimer", "yes");
  }

  if (read) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Disclaimer</h2>

        <p>
          This sale&rsquo;s tokens are not intended for sale, distribution
          and/or use by any person who is a citizen, domiciled in, resident of,
          or physically present / located in an &quot;Excluded
          Jurisdiction&quot;. Accordingly, Disqualified people should not
          purchase, acquire and/or use this sale&rsquo;s tokens and/or
          it&rsquo;s protocol.
        </p>

        <p>
          &quot;Excluded Jurisdiction&quot; means any of the following
          jurisdictions : (a){" "}
          <b>
            the People’s Republic of China, the United States of America,
            Democratic People’s Republic of Korea, Democratic Republic of Congo,
            Iran, Libya, Somalia, South Sudan, Sudan, Yemen, Russia
          </b>
          ; (b) a jurisdiction identified by the Financial Action Task Force
          (FATF) for strategic AML/CFT deficiencies and included in FATF’s
          listing of “High-risk and Other Monitored Jurisdictions” accessible at
          http://www.fatf-gafi.org/publications/high-risk-and-other-monitored-jurisdictions;
          and/or (c) a jurisdiction in which the sale, distribution and/or use
          of sale&rsquo;s tokens and/or this sale&rsquo;s protocol would be
          prohibited, restricted or unauthorised in any form or manner in full
          or in part under the laws, regulatory requirements or rules in such
          jurisdiction.
        </p>

        <div className="text-center">
          <Button className="button-lg" onClick={onAgree}>
            I read and agree to those terms
          </Button>
        </div>
      </div>
    </div>
  );
}
