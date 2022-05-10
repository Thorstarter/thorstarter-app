package main

import (
	"log"
)

var _ = route("/forge", func(c *C) {
	walletChain := c.GetCookie("walletChain")
	walletAddress := c.GetCookie("walletAddress")

	info := c.CacheGetf("userForge:"+walletAddress, 150, func() M {
		info := M{
			"xrune":       BNZero,
			"shares":      BNZero,
			"deposited":   BNZero,
			"totalShares": BNZero,
			"deposits":    BNZero,
		}
		if walletChain != "Fantom" {
			return info
		}

		contract := contracts["Fantom"]["xrune"]
		if s, err := chainTokenBalance(c, walletChain, contract, walletAddress); err == nil {
			info.Set("xrune", s)
		} else {
			log.Println("error fetching balance:", err)
		}

		if i, err := chainForgeInfo(c, walletAddress); err == nil {
			info.Set("shares", i["shares"])
			info.Set("deposited", i["amount"])
			info.Set("totalShares", i["totalShares"])
		} else {
			log.Println("error fetching balance:", err)
		}
		return info
	})

	if walletChain != "Fantom" {
		c.Html(200, layoutApp(c, "Tiers",
			divc("container",
				divc("title text-center mt-16",
					h("img", M{"src": "/public/forge-title.png", "height": "100"}),
					h("div", M{"class": "mt-16"}, "Connect to the Fantom network to use forge.")),
			),
		))
		return
	}

	c.Html(200, layoutApp(c, "Tiers",
		divc("container",
			divc("title text-center mt-16",
				h("img", M{"src": "/public/forge-title.png", "height": "100"})),

			h("div", M{"class": "flex flex-wrap", "style": "max-width:800px;margin: 32px auto;"},
				h("div", M{"style": "flex: 1 0 400px"},
					h("div", M{"class": "box"},
						h("h1", M{"style": "margin:0"}, "Shares", h("sup", M{"style": "font-weight:normal"}, h("a", M{"href": "#shares-explainer"}, "?")), ": ",
							h("span", M{"class": "text-primary5"},
								info.GetBN("xrune").Format(6, 2))),
						divc("div", "XRUNE Deposited: ",
							h("span", M{"class": "text-primary5"},
								info.GetBN("deposited").Format(6, 2))),
						divc("div", "Forge Total Shares: ",
							h("span", M{"class": "text-primary5"},
								info.GetBN("totalShares").Format(6, 2))),
					),
					h("div", M{"class": "box"},
						h("h3", M{}, "Deposit"),
					),
				),
				h("div", M{"class": "flex-auto ml-4"},
					h("h3", M{"class": "mt-0"}, "Calculator"),
				),
			),

			h("div", M{"style": "max-width:800px;margin:32px auto;"},
				h("h1", M{"id": "shares-explainer"}, "Shares Explainer"),
				h("p", nil, `Shares are a representation of how much Forge rewards you are owed.`),
				h("p", nil, `Simply put, all rewards going to Forge are divided up proportionally to every member based on how many shares they have (you have 2 shares, and the total number of Forge shares is 100, you get 2% of every reward distribution.)`),
				h("p", nil, `Another way to see it, is shares represent the boosted APY you get *on top of* the amount of XRUNE you lock (varying depending on how long you lock it for).")`),
			),
		),
	))
})
