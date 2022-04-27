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
		return info
	})

	if walletChain != "Forge" {
		c.Html(200, layoutApp(c, "Tiers",
			divc("container",
				divc("title text-center",
					h("img", M{"src": "/public/forge-title.png", "height": "100"}),
					h("div", M{"class": "mt-8"}, "Connect to the Fantom network to use forge.")),
			),
		))
		return
	}

	c.Html(200, layoutApp(c, "Tiers",
		divc("container",
			divc("title text-center",
				h("img", M{"src": "/public/forge-title.png", "height": "100"})),
			divc("", info.GetBN("xrune").Format(6, 2)),
		),
	))
})
