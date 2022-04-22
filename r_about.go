package main

var _ = route("/about", func(c *C) {
	c.Html(200, layoutSite("About", `
<div class="container rich">
  <h1 class="title">Welcome to Valhalla Venture DAO</h1>
  <p>Our mission is to fund and launch the best up-and-coming THORfi and DeFi projects through liquidity grants and access to our customizable, multichain IDO launchpad.</p>
  <p>Our native currency XRUNE acts as a liquidity relay between the THORChain network and long tail crypto assets (young projects with low liquidity). XRUNE is the settlement currency between new projects (IDOs) and THORChains’ active pools.</p>
  <p>XRUNE holders can become a member of our Valhalla Venture DAO by locking XRUNE for our governance token vXRUNE. Holding 100 or more vXRUNE allows DAO members to take part in Thorstarter IDOs and entitles them to rewards from successful Thorstarter IDOs.</p>

  <h2>The Thorstarter Saga</h2>
  <p>Learn more about the protocol in the chapters below</p>
  <div><a target="_blank" href="https://medium.com/@thorstarter/thorstarter-unlocking-deep-liquidity-for-long-tail-cryptoassets-68d7ad61f2e3"><span>Chapter 1</span> Genesis</a></div>
  <div><a target="_blank" href="https://medium.com/@thorstarter/thostarter-midgard-launch-structure-and-community-ethos-1553f00f29b5"><span>Chapter 2</span> The Coming of Midgard</a></div>
  <div><a target="_blank" href="https://medium.com/@thorstarter/thorstarter-asgard-governance-council-and-project-selection-process-88639c63ee3d"><span>Chapter 3</span> The Age of Asgard</a></div>
  <div><a target="_blank" href="https://blog.thorstarter.org/introducing-xrune-staking-and-liquidity-mining-incentives-fb2a8d8d546e"><span>Chapter 4</span> Crossing the Vimur</a></div>

  <h2>Learn More</h2>
  <div><a download href="/public/lightpaper.pdf">Lightpaper</a></div>
  <div><a target="_blank" href="https://docs.thorstarter.org/">Documentation</a></div>

  <h2>Tokenomics</h2>
  <div><h3>7.5%</h3> Community Treasury</div>
  <div><h3>15%</h3> Operational Treasury</div>
  <div><h3>27.5%</h3> Ecosystem Fund</div>
  <div><h3>50%</h3> Protocol Emissions</div>

  <h2>Valhalla Venture Dao</h2>
  <ul>
    <li>Community First - Transition to on-chain governance structure</li>
    <li>Multichain - Starting with THORfi/DeFi and slowly growing</li>
    <li>Forge - Locking contract with voting and protocol fee distribution</li>
    <li>Democratic Voting - Protocol upgrades and new assets decided by the community</li>
  </ul>

  <h2 class="text-center">Backed By</h2>
  <div class="text-center"><img src="/public/backers.png" /></div>

  <h2 class="text-center">Advisors</h2>
  <div class="flex text-center">
    <div class="flex-auto mr-4">
      <img src="/public/advisors/tehslaw.png" class="rounded-full" />
      <h3 class="mt-2 mb-2">TehColeSlaw</h3>
      <a class="text-primary5" target="_blank" href="https://twitter.com/TehSlaw">@TehSlaw</a>
    </div>
    <div class="flex-auto mr-4">
      <img src="/public/advisors/oaksprout.png" class="rounded-full" />
      <h3 class="mt-2 mb-2">Oaksprout</h3>
      <a class="text-primary5" target="_blank" href="https://twitter.com/tannedoaksprout">@tannedoaksprout</a>
    </div>
    <div class="flex-auto mr-4">
      <img src="/public/advisors/larry.png" class="rounded-full" />
      <h3 class="mt-2 mb-2">The Larry</h3>
      <a class="text-primary5" target="_blank" href="https://twitter.com/larry0x">@larry0x</a>
    </div>
    <div class="flex-auto">
      <img src="/public/advisors/saigon.png" class="rounded-full" />
      <h3 class="mt-2 mb-2">0xSaigon</h3>
      <a class="text-primary5" target="_blank" href="https://twitter.com/0xSaigon">@0xSaigon</a>
    </div>
  </div>

</div>

<style>
body {
  background-image: url(/public/bg-hero-about.jpg), url(/public/bg-footer.png);
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: top center,bottom center;
}
</style>
`))
})
