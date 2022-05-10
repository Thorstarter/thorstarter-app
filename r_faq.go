package main

var _ = route("/faq", func(c *C) {
	c.Html(200, layoutSite("FAQ", `
<div class="container rich">
  <h1 class="title text-center">FAQ</h1>

  <div class="mt-16">
    <h2>Token</h2>
    <details>
      <summary>What is $XRUNE?</summary>
      <p>THORSTARTER uses $XRUNE as a settlement currency between new projects (IDOs) and THORChain’s active pools. $XRUNE: $RUNE pool in THORChain acts as a “Liquidity relayer” between short-tail and long-tail assets.</p>
    </details>
    <details>
      <summary>What is the difference between $XRUNE and $RUNE?</summary>
      <p>$XRUNE has different tokenomics and governance structure, and $XRUNE price is not 1:1 to $RUNE.</p>
      <p>Though both tokens act as settlement currencies.</p>
    </details>
    <details>
      <summary>What are the use cases of $XRUNE?</summary>
      <p>$XRUNE will be paired with $RUNE in THORChain pools, to have a liquidity relayer pool out.</p>
      <p>$XRUNE will be paired with "Assets" on external AMMs, for these "Assets" to access THORChain's cross-chain liquidity.</p>
      <p>$XRUNE will be required for early access in THORSTARTER IDOs. External liquidity pools will be bootstrapped with $XRUNE liquidity.</p>
      <p>$XRUNE will also be used as a lockable DAO governance token that receives protocol revenue</p>
    </details>
    <details>
      <summary>What is the token release structure? Where can we find the tokenomics?</summary>
      <p><a href="https://docs.thorstarter.org/what-is-thorstarter/tokenomics" target="_blank">Read here about $XRUNE Tokenomics</a></p>
    </details>
    <details>
      <summary>Why use $XRUNE as settlement currency, and not main chain assets like $ETH, $BNB etc?</summary>
      <p>Thorstarter is an IDO platform, first and foremost. Core to the launch model is provisioning new projects with an XRUNE grant.</p>
      <p>XRUNE allows the Thorstarter network to coordinate around IDO launches, establish governance and voting, and enable network participants to gain access to vetted IDOs.</p>
    </details>
    <details>
      <summary>Why named $XRUNE? Won’t it create confusion with xAssets from Haven protocol?</summary>
      <p>The X in XRUNE signifies cross-chain liquidity relaying of RUNE, therefore: XRUNE.</p>
      <p>To distinguish between Haven xASSETs, use capital X in XRUNE, and lowercase x in any Haven xASSET (xRUNE or otherwise).</p>
    </details>
    <details>
      <summary>Once THORChain pool becomes active, people can just buy $XRUNE from THORChain. Why a public round in Sushiswap then?</summary>
      <p>Two reasons: 1) XRUNE is starting as an ERC20 token, and 2) the design of the Thorstarter is to seed pools on external AMMs. We are starting with SushiSwap on Ethereum as the first AMM to pool on/with other new tokens.</p>
    </details>
    <details>
      <summary>Given the model of THORStarter, is $XRUNE also going to be deterministic in nature?</summary>
      <p>In part a lot of the value of the XRUNE token will come from being needed to participate in IDOs but some of that XRUNE will get sold by the project after the sale. The deterministic part is determined by the fact that XRUNE will be paired in a pool that aims to have deep liquidity on THORChain and in many smaller pools across many blockchains, if the value of this aggregate of tokens it's paired with trends upwards over time, XRUNE's price will naturally follow. On top of that it has other uses as a governance token that's also productive / entitles you to a share of revenue.</p>
    </details>
    <details>
      <summary>Can locked $XRUNE tokens be used in IDO participation, staking $XRUNE and for liquidity mining purposes?</summary>
      <p>Escrow locked XRUNE won't be usable for IDOs or liquidity mining / staking. If you lock in some XRUNE it would make sense that you actually want to use it for governance and earn protocol revenue with it. It will be easy to unlock a portion of it to use for IDOs at anything though, so that limitation shouldn't be an issue. As for liquidity mining, most of it will be happening before governance is fully in place which means locked XRUNE won't really be a concern as they don't overlap.</p>
    </details>
    <details>
      <summary>In what situations will XRUNE have lower slippage as an intermediary token than a deep/liquid token like ETH/BNB/Tether/etc?</summary>
      <p>In the short term, projects launching with Thorstarter and receiving a liquidity grant will have the least slippage and shortest route when using the XRUNE pool on Thorchain. Over time, the IDO projects will grow and gather increased liquidity in other pools / pairings and ETH might become a better route to purchasing the project's tokens but at that point, Thorstarter will have accomplished its goal of helping the project get started and gartner attention. In the medium term we also expect the XRUNE pool on Thorchain to be deep enough to support the stream of IDO with low enough slippage that other pools being deeper is an non issue, the thing to keep in mind is that we never needed to support low slippage on large 1M+ trades only enough for project investors to pay for allocation in an upcoming project's launch.</p>
    </details>
    <details>
      <summary>Are there mechanisms to prevent IDO projects from dumping their grant of XRUNE tokens? Because if i were an IDO project, i'd immediately dump to have working capital</summary>
      <p>Two different things are at play here, the "liquidity grants" themselves will be in a timelock to ensure they don't get sold. But as for the "funds'' a project raises during their crowdsale it doesn't feel right to restrict projects from selling it, it's theirs and they'll need it to build their vision, if they want to have it all in stable coin in order to avoid price risk that should be their decision to make. That simply means that it will be doubly important for Thorstarter to keep a steady inflow of projects so that the demands for XRUNE flows from one project to the other. We might step in and instruct / help projects sell their XRUNE in a way to avoid a large price impact.</p>
    </details>
    <details>
      <summary>When the pool is added after 3 days, it will be able to withdraw 50/50 no ?</summary>
      <p>You can withdraw 50/50 immediately</p>
    </details>
  </div>

  <div class="mt-16">
    <h2>Ecosystem</h2>
    <details>
      <summary>What are long-tail and short-tail assets?</summary>
      <p>Short-tail assets are high volume/fee generating assets.</p>
      <p>THORChain will support them, but only 100 slots will be available in THORChain.</p>
      <p>Thorstarter connects long-tail assets to THORChain.</p>
    </details>
    <details>
      <summary>What is your strategy for building a strong community? Do you agree that the power of the community will lead your project to develop globally? What services do you provide to the community?</summary>
      <p>We are working with some of the original community team/members from Thorchain, which itself is very decentralized (and soon to be fully community owned). On top of that, we are launching with multi language support in several different languages. In the near term: Vietnamese, Russian, and Spanish.</p>
    </details>
    <details>
      <summary>What exactly is the difference between ThorStarter short and long tail entities?</summary>
      <p>Short vs long tail is not well defined. Think of "short tail" as any crypto coin/asset that is economically significant, i.e. one that you would see in the top 50 or 100 on CMC.</p>
    </details>
    <details>
      <summary>Currently in my opinion one of the ways to attract more users would be to collaborate with youtubers or influencers dedicated to the world of the game. Do you plan to develop this marketing strategy so that your project grows?</summary>
      <p>Many of the best and brightest minds are backing the projects, and these include influencers. We do not simply seek influencers who have large reach (we do), but people who are truly thought leaders in the Thorchain ecosystem and outside of it</p>
    </details>
    <details>
      <summary>What's stopping the council of 9 who decide the IDO projects from creating an unfair whale launch?</summary>
      <p>The main mechanisms to avoid that would be that the elected members of the council can be removed by the DAO so if they act in a way that is not in the best interest of Thorstarter they will get voted out. But my bigger concern here is projects pushing for an unfair launch and how good we will be at convincing them that it's for the worst or rejecting them outright.</p>
    </details>
    <details>
      <summary>What is an AMM? Can THORStarter both act as an AMM as well as an exchange?</summary>
      <p>AMM means automated market maker. Uniswap, Sushiswap, Pancakeswap (and Thorchain too!) are all AMMs. It just means that, when you make a trade (swap one token for another) you’re trading against a pool of capital. This is different from an exchange (DEX or CEX) where you trade against other people. ie, there is a “counterparty to each trade.” “DEX” and “AMM” are often used interchangeably today. Some people call Uniswap a DEX though it’s actually an AMM. Thorstarter itself is not building a new/unique AMM, but calling it a DEX (decentralized exchange) would be suitable, for sure. A better way to think about us is: IDO platform+DEX</p>
    </details>
    <details>
      <summary>How does the Thorstarter DAO work? Will it change over time?</summary>
      <p>Definitely! I hope everyone is familiar with the basic concepts of a DAO (decentralized autonomous organization).</p>
      <p>It basically just means a group of individuals governed by laws that are written in code (smart contracts).</p>
      <p>The final goal of the Thorstarter DAO is to evolve into an on-chain governance structure called the Valhalla DAO. In this later phase, Valhalla DAO members will identify and recommend projects, provide opportunities for liquidity pools, and adjust incentives for liquidity providers. Members of the DAO will be able to pool capital and decide which projects to support.</p>
      <p>On-chain governance will allow XRUNE holders to propose and vote on a number of strategies via the DAO. Execution of these strategies will then be provided by Council members.</p>
      <p>Valhalla DAO will allow democratic voting for protocol upgrades and new features, as well as treasury allocation. Decisions will be made via Discord discussions, community calls, forum discussions, and ultimately Snapshot votes.</p>
      <p>Over time, fees and funds from these LP shares in the pool will accrue to the DAO, and people who stake and lock their XRUNE will earn these fees.</p>
    </details>
  </div>

  <div class="mt-16">
    <h2>Platform</h2>
    <details>
      <summary>What is xIDO Model?</summary>
      <p>Projects launching on Thorstarter will have the flexibility to choose from several different launch models. This will allow them to optimize for a token distribution that is most suitable for their project and community. This will be referred to as xIDO, reflecting the flexibility available when using XRUNE as part of project launches.</p>
      <p>Distinct xIDO features include Fixed Price Crowdsale, Dynamic Price Auction, Pool Share, Limited Supply vs. Elastic Supply, Minimum Purchase vs. Max Purchase, Open vs. Gated Tiers, Overflow Sale Method, Multiple Sales, Lock Ups and Vesting.</p>
    </details>
    <details>
      <summary>What criteria will THORStarter set to qualify or disqualify projects for IDO on the platform?</summary>
      <p>Each project will need to fill out an application form with a set of 20+ questions ranging from product Q/A, token function, future plans and state of development. These questions are reviewed by the Council to decide if they can launch with TS.</p>
      <p>Big areas of focus are working product, proficient team and clearly well understood problem/solution.</p>
      <p>Projects that can benefit the TC ecosystem are given special consideration.</p>
    </details>
    <details>
      <summary>Is there any platform risks involved for project IDOs and also for IDO participants, (if any)?</summary>
      <p>Since Thorstarter just helps in assisting source initial liquidity for project launches there is a very low associated risk on the Thorstarter platform side. There might be some risk related to a sale's smart contract malfunctioning but after testing and the first few sales running smoothly there should be very low risk on that end. To that end we will mostly have a way to recover funds for the first few sales in case something goes wrong so that at least no money is at risk.</p>
    </details>
    <details>
      <summary>Does THORStarter have any security guard rails in place for flash loan attacks?</summary>
      <p>THORStarter shouldn't be open to any flash loan attacks with the currently planned crowdsale models/contracts. Because of the nature of a crowdsale where you pay for an allocation upfront but don't receive any tokens until the sale is done, flash loan users wouldn't be able to repay their loan in the same transaction, which means their transaction would fail.</p>
    </details>
    <details>
      <summary>What is the process for founders and investors to propose projects?</summary>
      <p>We will have a form on thorstarter.org that anybody, including investors can fill up with the details of their project and crowdsale. Those project applications will then get vetted / reviewed by the council of asgard and possibly discussed by the dao in the governance forum after initial review.</p>
    </details>
    <details>
      <summary>What does success mean for your company? Both short term and long term.</summary>
      <p>Long term success for THORstarter means a steady inflow of quality projects will be the real tell that THORStarter has succeeded at becoming a great place to launch, that offers more value and guidance than any other launchpad out there. In the short term I would like to see it offer a great and fair IDO experience for investors and projects, on top of that I'd like to see the governance and council to be deployed and put into action.</p>
    </details>
    <details>
      <summary>Vast majority of Crypto projects are built just for the sole purpose of amassing wealth for themselves. So, I want to know the value you aim to add to the crypto industry that will bring greater abundance to the industry?</summary>
      <p>One way you can know that we are strategically aligned with investors is that we technically have ZERO runway. 100% of our raise is going into the pools themselves. We have no funds whatsoever to build the project, it's all out of pocket. Like early investors, we are just LPs in the pools.</p>
    </details>
    <details>
      <summary>"Staking" is one of the strategies to attract users and hold users. Does your platform have Staking?</summary>
      <p>Staking,and LPing, is not only a core feature of Thorstarter, it *is* the project. Users in the XRUNE pools will earn very high APY rewards for providing liquidity.</p>
    </details>
    <details>
      <summary>Besides helping new projects to launch safely what other benefits do you offer them? Do you invest in them also or what will they stand to gain from joining your platform from launching?</summary>
      <p>The main benefits to projects, additional to safe/fair launches, is three-fold: 1) a sizable grant in the form of XRUNE (this amount is TBD, but it will be a lot), 2) full marketing support from both the Thorstarter and Thorchain armies, and 3) expert help in designing and refining their products and token models.</p>
    </details>
  </div>

  <div class="mt-16">
    <h2>Team</h2>
    <details>
      <summary>How many of you are working on Thorstarter, how big is your dev team at the moment?</summary>
      <p>I’m compound22 but go by my initials AM. I’m one of three co-founders of the Thorstarter network.</p>
      <p>I’ve been personally active in the crypto space since 2016, investing and advising various projects, several of which are now DeFi blue chip projects. I was an early investor in Thorchain, participating in their IDO on Binance Chain.</p>
      <p>One of the earliest projects I worked with was Bancor, which is one of the first if not the first protocols to use and implement the AMM (automated market maker model), which is now a core feature of many great projects like Uniswap, Sushiswap, and Thorchain.</p>
      <p>Now, regarding the team.</p>
      <p>The marketing and operations team working on Thorstarter has likewise been involved in crypto for some 6+ years, and worked with several of the more well known projects in the DeFi space.</p>
      <p>Our developer team includes 4 devs, two of which are full time. Our lead developer is working on smart contracts and core features of the Thorstarter protocol, and the others are taking a supporting role working on front- and back-end.</p>
      <p>We have a large team of full- and part-timer contracts taking on various supporting tasks as needed.</p>
    </details>
    <details>
      <summary>You mentioned about 3 founders. Who are the other 2?</summary>
      <p>Our lead developer is a co-founder. The other co-founder is situated in an operations and management role, with some support on marketing, business development and network security design.</p>
    </details>
  </div>
</div>
`))
})