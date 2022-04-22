package main

import (
	"bytes"
	"io"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
)

var _ = route("/admin", func(c *C) {
	if c.Req.Method == "POST" && c.Params.Get("action") == "ido" {
		id := uuid()
		c.DbPut("idos", M{
			"id":              id,
			"status":          "Hidden",
			"name":            "New",
			"chain":           "Ethereum",
			"symbol_currency": "USDC",
		})
		c.Redirect("/admin-ido?id=" + id)
		return
	}
	if c.Req.Method == "POST" && c.Params.Get("action") == "file" {
		id := uuid()
		f := c.Req.MultipartForm.File["file"][0]
		fh, err := f.Open()
		check(err)
		defer fh.Close()
		bs, err := io.ReadAll(fh)
		check(err)
		typ := strings.Split(http.DetectContentType(bs), ";")[0]
		if strings.HasSuffix(f.Filename, ".svg") {
			typ = "image/svg+xml"
		}
		_, err = c.s3Client.PutObject(&s3.PutObjectInput{
			//ACL:                aws.String("public-read"),
			Bucket:             aws.String(env("AWS_BUCKET", "thorstarter-files")),
			Key:                aws.String(id[0:3] + "/" + id),
			Body:               bytes.NewReader(bs),
			ContentType:        aws.String(typ),
			ContentLength:      aws.Int64(int64(len(bs))),
			ContentDisposition: aws.String("attachment;filename=" + f.Filename),
		})
		check(err)
		c.DbPut("files", M{
			"id":   id,
			"name": f.Filename,
			"size": len(bs),
		})
	}

	idos := c.DbSelect("select * from idos order by created_at desc")
	files := c.DbSelect("select * from files order by created_at desc")

	c.Html(200, layoutApp(c, "Admin",
		divc("container",
			h("h1", M{"class": "title"}, "Admin"),

			h("h2", M{"class": "flex items-center"},
				divc("flex-auto", "IDOs"),
				h("form", M{"method": "post"},
					h("button", M{"type": "submit", "name": "action", "value": "ido", "class": "button"}, "New"))),
			h("table", M{"class": "table"},
				h("tr", nil, h("th", nil, "Name"), h("th", nil, "Date"), h("th", nil, "Status"), h("th", nil, "Chain")),
				hmapj(idos, func(x M) string {
					return h("tr", nil,
						h("td", nil, h("a", M{"href": "/admin-ido?id=" + x.Get("id")}, x.Get("name"))),
						h("td", nil, x.Get("ido_date")),
						h("td", nil, x.Get("status")),
						h("td", nil, x.Get("chain")))
				})),

			h("h2", M{"class": "flex items-center"},
				divc("flex-auto", "Files"),
				h("form", M{"method": "post", "enctype": "multipart/form-data"},
					h("input", M{"type": "file", "name": "file"}),
					h("button", M{"type": "submit", "name": "action", "value": "file", "class": "button"}, "Upload"))),
			h("table", M{"class": "table"},
				h("tr", nil, h("th", nil, "Name"), h("th", nil, "URL")),
				hmapj(files, func(x M) string {
					return h("tr", nil,
						h("td", nil, x.Get("name")),
						h("td", nil, h("a", M{"href": s3Url(x.Get("id"))}, s3Url(x.Get("id")))))
				})),
		)))
})
