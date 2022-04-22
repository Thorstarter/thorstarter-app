package main

import (
	"strings"

	"github.com/lib/pq"
)

func renderLink(link, icon string) string {
	if link != "" {
		return h("a", M{"href": link, "target": "_blank", "onclick": "event.stopPropagation()"}, icon)
	}
	return ""
}

func renderIdo(x M) string {
	link := "/ido/" + strings.ToLower(x.Get("symbol")) + "/"
	return h("div", M{"class": "idos-ido", "onclick": "window.location.href='" + link + "';"},
		h("div", M{"class": "idos-ido-header"},
			h("a", M{"href": link},
				h("img", M{"class": "idos-ido-cover", "src": x.Get("cover_image"), "onerror": "javascript:this.src='';"})),
			h("img", M{"class": "idos-ido-logo", "src": x.Get("logo_image"), "onerror": "javascript:this.src='';"}),
			h("span", M{"class": "idos-ido-links"},
				renderLink(x.Get("link_twitter"), iconTwitter),
				renderLink(x.Get("link_telegram"), iconTelegram),
				renderLink(x.Get("link_discord"), iconDiscord),
				renderLink(x.Get("link_website"), iconExternal),
				renderLink(x.Get("link_documentation"), iconDocumentation),
				renderLink(x.Get("link_medium"), iconMedium),
			),
		),
		divc("idos-ido-content",
			h("h2", nil, h("a", M{"href": link}, x.Get("name"))),
			h("p", nil, x.Get("short_description")),
			h("hr", nil),
			divc("flex",
				divc("flex-auto",
					h("span", nil, "Offering"),
					h("div", M{"class": ""}, formatInt(x.GetI("tokens_offered"))+" "+x.Get("symbol"))),
				divc("flex-auto",
					h("span", nil, "Raising"),
					h("div", M{"class": ""}, formatInt(x.GetI("tokens_raising"))+" "+x.Get("symbol_currency"))),
			),
			h("hr", nil),
			divc("flex",
				divc("flex-auto",
					h("span", nil, "IDO Date"),
					h("div", M{"class": ""}, x.Get("ido_date"))),
				divc("flex-auto",
					h("span", nil, "TGE Date"),
					h("div", M{"class": ""}, x.Get("tge_date"))),
			),
		))
}

var _ = route("/", func(c *C) {
	statuses := pq.StringArray{"Upcoming"}
	if c.Params.Get("showhidden") != "" {
		statuses = append(statuses, "Hidden")
	}
	upcomingIdos := c.DbSelect("select * from idos where status = any($1) order by created_at desc", statuses)
	completedIdos := c.DbSelect("select * from idos where status = 'Completed' order by created_at desc")

	upcomingIdosEl := hmapj(upcomingIdos, renderIdo)
	completedIdosEl := hmapj(completedIdos, renderIdo)

	c.Html(200, layoutSite("", `
<div class="container">
  <div style="padding: 120px 0;">
    <h1 style="font-size:48px;font-weight:normal;">Welcome to Thorstarter</h1>
    <p class="text-white-50" style="font-size:22px;max-width:660px;">Thorstarter is a multichain Venture DAO and IDO platform that combines a unique launchpad model with liquidity grants to incubate, fund, and launch the most promising projects across DeFi.</p>
    <a class="button" style="padding:20px 32px;font-size:20px;" href="#upcoming">Upcoming Launches</a>
  </div>

  <h1 class="mt-16">Thorstarter Explained in 4 Steps</h1>
  <div class="index-steps">
    <div><span>1</span> Stake XRUNE in our Forge Contract to gain access to Thorstarter IDOs</div>
    <div><span>2</span> Register interest in an IDO few days before it's sale</div>
    <div><span>3</span> Commit funds to the IDO on the day of the sale</div>
    <div><span>4</span> Receive project tokens at the earliest possible price</div>
  </div>

  <h1 class="mt-16">Join The Community</h1>
  <p>The THORChad army is 3000+ strong and growing daily. Joining is easy and requires lockup of XRUNE to our native pegged governance token vXRUNE. vXRUNE holders actively vote on proposals, governance and split proceeds of each launch.</p>
  <a class="button" style="padding:20px 32px;font-size:20px;" href="/about">Learn More</a>

  <div class="mt-16 text-center">
    <h2>Raise capital across all main blockchain networks</h2>
    <img class="mr-8" src="/public/chains/ethereum.svg" style="height:40px" />
    <img class="mr-8" src="/public/chains/fantom.svg" style="height:40px" />
    <img class="mr-8" src="/public/chains/terra.svg" style="height:40px" />
    <img src="/public/chains/polygon.svg" style="height:40px" />
  </div>

  <h2 class="mt-16" id="upcoming">Upcoming Projects</h2>
	<div class="idos">`+upcomingIdosEl+`</div>

  <h2 class="mt-16">Previous IDOs</h2>
	<div class="idos">`+completedIdosEl+`</div>

  <div class="mt-16 text-center">
    <h2>A council of the best and brightest</h2>
    <p>Projects which partner with Thorstarter are carefully selected by a team of industry leaders from across THORChain and adjacent ecosystems.</p>
    <img class="mr-8" src="/public/chains/thorchain.svg" style="height:40px" />
    <img class="mr-8" src="/public/chains/nine-realms.svg" style="height:40px" />
    <img class="mr-8" src="/public/chains/qi-capital.svg" style="height:40px" />
    <img class="mr-8" src="/public/chains/olympus-pro.svg" style="height:40px" />
    <img src="/public/chains/terra.svg" style="height:40px" />
  </div>
</div>

<style>
body {
  background-image: url(/public/bg-hero.jpg), url(/public/bg-footer.png);
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: top center,bottom center;
}
</style>
`))
})
