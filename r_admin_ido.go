package main

import (
	"strings"
	"time"
)

var _ = route("/admin-ido", func(c *C) {
	id := c.Params.Get("id")
	ido := c.DbGet("select * from idos where id = $1", id)

	if c.Req.Method == "POST" {
		ido.Set("status", c.Params.Get("status"))
		ido.Set("name", c.Params.Get("name"))
		ido.Set("symbol", strings.ToUpper(c.Params.Get("symbol")))
		ido.Set("symbol_currency", strings.ToUpper(c.Params.Get("symbol_currency")))
		ido.Set("chain", c.Params.Get("chain"))
		ido.Set("contract", c.Params.Get("contract"))
		ido.Set("tokens_offered", stringToInt(c.Params.Get("tokens_offered")))
		ido.Set("tokens_raising", stringToInt(c.Params.Get("tokens_raising")))
		ido.Set("vesting_terms", c.Params.Get("vesting_terms"))
		ido.Set("ido_date", c.Params.Get("ido_date"))
		ido.Set("tge_date", c.Params.Get("tge_date"))
		ido.Set("cover_image", c.Params.Get("cover_image"))
		ido.Set("logo_image", c.Params.Get("logo_image"))
		ido.Set("link_telegram", c.Params.Get("link_telegram"))
		ido.Set("link_discord", c.Params.Get("link_discord"))
		ido.Set("link_twitter", c.Params.Get("link_twitter"))
		ido.Set("link_website", c.Params.Get("link_website"))
		ido.Set("link_medium", c.Params.Get("link_medium"))
		ido.Set("link_documentation", c.Params.Get("link_documentation"))
		ido.Set("short_description", c.Params.Get("short_description"))
		ido.Set("long_description", c.Params.Get("long_description"))
		ido.Set("updated_at", time.Now())
		c.DbPut("idos", ido)
		c.Redirect("/admin")
		return
	}

	c.Html(200, layoutApp(c, "Admin IDO - "+ido.Get("name"),
		h("form", M{"class": "container small", "method": "post"},
			h("h1", M{"class": "title"}, "IDO: "+ido.Get("name")),

			divc("field",
				h("label", M{"class": "label"}, "Name"),
				h("input", M{"class": "input", "name": "name",
					"value": ido.Get("name")})),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "Symbol"),
					h("input", M{"class": "input", "name": "symbol",
						"value": ido.Get("symbol")})),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "Symbol (Payment Currency)"),
					h("input", M{"class": "input", "name": "symbol_currency",
						"value": ido.Get("symbol_currency")})),
			),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "Status"),
					h("select", M{"class": "input", "name": "status"},
						h("option", M{"value": "Hidden",
							"selected": ido.Get("status") == "Hidden"}, "Hidden"),
						h("option", M{"value": "Upcoming",
							"selected": ido.Get("status") == "Upcoming"}, "Upcoming"),
						h("option", M{"value": "Live",
							"selected": ido.Get("status") == "Live"}, "Live"),
						h("option", M{"value": "Completed",
							"selected": ido.Get("status") == "Completed"}, "Completed"),
					)),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "Chain"),
					h("select", M{"class": "input", "name": "chain"},
						h("option", M{"value": "Ethereum",
							"selected": ido.Get("chain") == "Ethereum"}, "Ethereum"),
						h("option", M{"value": "Fantom",
							"selected": ido.Get("chain") == "Fantom"}, "Fantom"),
						h("option", M{"value": "Polygon",
							"selected": ido.Get("chain") == "Polygon"}, "Polygon"),
						h("option", M{"value": "Terra",
							"selected": ido.Get("chain") == "Terra"}, "Terra"),
					)),
			),
			divc("field",
				h("label", M{"class": "label"}, "Contract"),
				h("input", M{"class": "input", "name": "contract",
					"value": ido.Get("contract")})),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "Tokens Offered"),
					h("input", M{"class": "input", "name": "tokens_offered",
						"pattern": "[0-9]+",
						"value":   intToString(ido.GetI("tokens_offered"))})),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "Tokens Raising"),
					h("input", M{"class": "input", "name": "tokens_raising",
						"pattern": "[0-9]+",
						"value":   intToString(ido.GetI("tokens_raising"))})),
			),
			divc("field",
				h("label", M{"class": "label"}, "Vesting Terms"),
				h("input", M{"class": "input", "name": "vesting_terms",
					"value": ido.Get("vesting_terms")})),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "IDO Date"),
					h("input", M{"class": "input", "name": "ido_date",
						"value": ido.Get("ido_date")})),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "TGE Date"),
					h("input", M{"class": "input", "name": "tge_date",
						"value": ido.Get("tge_date")})),
			),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "Cover Image (URL)"),
					h("input", M{"class": "input", "name": "cover_image",
						"value": ido.Get("cover_image")})),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "Logo Image (URL)"),
					h("input", M{"class": "input", "name": "logo_image",
						"value": ido.Get("logo_image")})),
			),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "Link Telegram"),
					h("input", M{"class": "input", "name": "link_telegram",
						"value": ido.Get("link_telegram")})),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "Link Discord"),
					h("input", M{"class": "input", "name": "link_discord",
						"value": ido.Get("link_discord")})),
			),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "Link Twitter"),
					h("input", M{"class": "input", "name": "link_twitter",
						"value": ido.Get("link_twitter")})),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "Link Website"),
					h("input", M{"class": "input", "name": "link_website",
						"value": ido.Get("link_website")})),
			),
			divc("flex",
				divc("field flex-auto mr-4",
					h("label", M{"class": "label"}, "Link Medium"),
					h("input", M{"class": "input", "name": "link_medium",
						"value": ido.Get("link_medium")})),
				divc("field flex-auto",
					h("label", M{"class": "label"}, "Link Documentation"),
					h("input", M{"class": "input", "name": "link_documentation",
						"value": ido.Get("link_documentation")})),
			),
			divc("field",
				h("label", M{"class": "label"}, "Short Description"),
				h("textarea", M{"class": "input", "name": "short_description",
					"rows": "4"}, ido.Get("short_description"))),
			divc("field",
				h("label", M{"class": "label"}, "Long Description"),
				h("textarea", M{"class": "input", "name": "long_description",
					"rows": "12"}, ido.Get("long_description"))),
			divc("text-right",
				h("button", M{"class": "button", "type": "submit"}, "Save")),
		)))
})
