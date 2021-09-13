import { useState } from "react";
import Button from "./button";

export default function DisclaimerBnpl() {
  const [read, setRead] = useState(
    global.window && window.localStorage.getItem("readBnplDisclaimer")
  );

  function onAgree() {
    setRead(true);
    window.localStorage.setItem("readBnplDisclaimer", "yes");
  }

  if (read) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>BNPL Disclaimer</h2>

        <p>
          DISCLAIMER : BNPL PAY tokens are cryptographic utility tokens for use
          to access the functionalities of the BNPL protocol and related use
          cases which include providing uncollateralized loans from its
          decentralised network of banking nodes.
        </p>

        <p>
          Therefore, BNPL PAY tokens should not be identified or construed as a
          capital market product, security or financial instrument of any kind
          and any potential acquirer of BNPL PAY tokens should only acquire BNPL
          PAY tokens for the intended utility and in such quantities as will
          actually be used by such acquirer to access the functionalities of the
          BNPL PAY on the BNPL protocol and its related use cases.
        </p>

        <p>
          BNPL PAY tokens are not intended for sale, distribution and/or use by
          Disqualified Persons. Accordingly, Disqualified people should not
          purchase, acquire and/or use BNPL PAY Tokens and/or the BNPL protocol.
        </p>

        <p>
          “Excluded Jurisdiction” means any of the following jurisdictions : (a)
          the People’s Republic of China, the United States of America,
          Democratic People’s Republic of Korea, Democratic Republic of Congo,
          Iran, Libya, Somalia, South Sudan, Sudan, Yemen; (c) a jurisdiction
          identified by the Financial Action Task Force (FATF) for strategic
          AML/CFT deficiencies and included in FATF’s listing of “High-risk and
          Other Monitored Jurisdictions” accessible at
          http://www.fatf-gafi.org/publications/high-risk-and-other-monitored-jurisdictions;
          and/or (d) a jurisdiction in which the sale, distribution and/or use
          of BNPL Pay tokens and/or BNPL protocol would be prohibited,
          restricted or unauthorised in any form or manner in full or in part
          under the laws, regulatory requirements or rules in such
          jurisdiction.]
        </p>

        <p>“Disqualified Persons” refers to the following person(s) :</p>

        <p>
          (1) a person who is a citizen, domiciled in, resident of, or
          physically present / located in an Excluded Jurisdiction;
        </p>

        <p>
          (2) a body corporate: (a) which is incorporated in, or operates out
          of, an Excluded Jurisdiction, or (b) which is wholly or partially
          owned by or under the control of (i) one or more individuals who
          is/are citizen(s) of, domiciled in, residents of, or physically
          present / located in, an Excluded Jurisdiction; (ii) one or more
          entities which is incorporated in, or operates out of, an Excluded
          Jurisdiction; and/or (iii) a Designated Person/Entity;
        </p>

        <p>
          (3) an individual or body corporate included in (a) the consolidated
          list published by the United Nations Security Council of individuals
          or entities subject to measures imposed by the United Nations Security
          Council accessible at
          https://www.un.org/securitycouncil/content/un-sc-consolidated-list; or
          (b) the United Nations Lists (UN Lists) or within the ambit of any
          regulations adopted by any jurisdictions relating to or implementing
          United Nations Security Council Resolutions (“Designated
          Person/Entity”);
        </p>

        <p>
          (4) an individual or body corporate which is otherwise prohibited or
          ineligible in any way, whether in full or in part, under any laws
          applicable to such individual or body corporate from participating in
          purchasing, acquiring and/or using BNPL Pay tokens and/or the BNPL
          protocol; and/or
        </p>

        <p>
          (5) an individual or body corporate where the sale of BNPL Pay token
          is prohibited, restricted, curtailed, hindered, impaired, unauthorized
          or otherwise adversely affected in any way or in any form or manner
          whether in full or in part under any applicable law, regulation or
          rule in the country of residence or domicile of such person.
        </p>

        <p>
          The Token Vendor does not intend to offer to sell and/or to sell you
          any Token or enter into any transaction or have any dealing with you
          if you are a Disqualified Person. Accordingly, if you are a
          Disqualified Person, you will not be considered/accepted as a
          Participant and shall not participate in the Token Sale.
        </p>

        <p>
          You are required to agree to the Terms and Conditions of the Token
          Sale to acquire any Token or participate in the Token Sale. By
          indicating you agree to the Terms and Conditions of the Token Sale,
          you represent and warrant to the Token Vendor that you are not a
          Disqualified Person.
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
