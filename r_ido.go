package main

import "strings"

var _ = route("/ido", func(c *C) {
	walletChain := c.GetCookie("walletChain")
	walletAddress := c.GetCookie("walletAddress")
	ido := c.DbGet("select * from idos where symbol = $1", strings.ToUpper(c.Params.Get("ido")))
	if ido == nil {
		renderNotFound(c)
		return
	}

	participateEl := divc("ido-sidebar-message", "Come back on IDO day to participate")
	if ido.Get("status") == "Completed" {
		participateEl = divc("ido-sidebar-message", "Sale Completed")
	}
	if ido.Get("status") == "Live" {
		contentEl := ""
		if walletAddress != "" && walletChain != ido.Get("chain") {
			contentEl = h("a", M{"class": "button w-full",
				"onclick": "javascript:walletConnect();"}, "Wrong chain connected")
		} else if walletAddress != "" {
			contentEl = divc("",
				divc("flex mb-2",
					divc("text-white-50 flex-auto", "Allowance"),
					divc("", "0.0 "+ido.Get("symbol_currency")),
				),
				divc("flex mb-2",
					divc("text-white-50 flex-auto", "Balance"),
					divc("", "0.0 "+ido.Get("symbol_currency")),
				),
				h("input", M{"class": "input w-full mb-4", "id": "amount", "placeholder": "0.0"}),
				h("button", M{"class": "button w-full mb-4", "onclick": "javascript:participate();"}, "Deposit"),
				divc("flex mb-2",
					divc("text-white-50 flex-auto", "Deposited"),
					divc("", "0.0 "+ido.Get("symbol_currency")),
				),
				divc("flex mb-2",
					divc("text-white-50 flex-auto", "Owed Total"),
					divc("", "0.0 "+ido.Get("symbol")),
				),
			)
		} else {
			contentEl = h("a", M{"class": "button w-full",
				"onclick": "javascript:walletConnect();"}, "Connect Wallet")
		}

		participateEl = divc("",
			h("h3", M{"class": "mb-4 mt-8"}, "Participate in IDO"),
			divc("text-sm mb-4", "To participate in an IDO you must be part of Thorstarter's Tiers."),
			contentEl,
		)
	}

	c.Html(200, layoutApp(c, "IDO - "+ido.Get("name"),
		divc("container flex flex-wrap",
			divc("ido-sidebar",
				h("h1", M{"class": ""}, ido.Get("name")),
				divc("mb-4",
					renderLink(ido.Get("link_twitter"), iconTwitter),
					renderLink(ido.Get("link_telegram"), iconTelegram),
					renderLink(ido.Get("link_discord"), iconDiscord),
					renderLink(ido.Get("link_website"), iconExternal),
					renderLink(ido.Get("link_documentation"), iconDocumentation),
					renderLink(ido.Get("link_medium"), iconMedium),
				),
				divc("mb-4",
					divc("label", "Blockchain"),
					divc("", ido.Get("chain"))),
				tern(ido.Get("vesting_terms") != "", divc("mb-4",
					divc("label", "Vesting"),
					divc("", ido.Get("vesting_terms"))), ""),
				divc("flex mb-4",
					divc("flex-auto",
						divc("label", "Offering"),
						divc("", formatInt(ido.GetI("tokens_offered"))+" "+ido.Get("symbol"))),
					divc("flex-auto",
						divc("label", "Raising"),
						divc("", formatInt(ido.GetI("tokens_raising"))+" "+ido.Get("symbol_currency"))),
				),
				divc("flex mb-4",
					divc("flex-auto",
						divc("label", "IDO Date"),
						divc("", ido.Get("ido_date"))),
					divc("flex-auto",
						divc("label", "TGE Date"),
						divc("", ido.Get("tge_date"))),
				),
				participateEl,
			),
			divc("flex-auto",
				divc("ido-header",
					h("img", M{"class": "ido-header-cover", "src": ido.Get("cover_image")}),
					h("img", M{"class": "ido-header-logo", "src": ido.Get("logo_image")}),
				),
				divc("rich", markdownToHTML(ido.Get("long_description"))),
			),
		),
	))
})
