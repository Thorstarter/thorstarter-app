package main

import (
	"bytes"
	"crypto/rand"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// {{{{{{ MAIN
//go:embed public/*
var fs embed.FS

var routes = map[string]func(c *C){}

func route(path string, handler func(c *C)) interface{} {
	routes[path] = handler
	return nil
}

func main() {
	godotenv.Load()

	var err error
	db, err := sqlx.Open("postgres", env("DATABASE_URL", "postgres://admin:admin@localhost/ts?sslmode=disable"))
	check(err)
	config := &aws.Config{}
	config.Region = aws.String("us-east-1")
	config.Credentials = credentials.NewStaticCredentials(
		os.Getenv("AWS_ACCESS_KEY"), os.Getenv("AWS_SECRET_KEY"), "")
	s3Session := session.Must(session.NewSession(config))
	s3Client := s3.New(s3Session)
	evmClients := map[string]*rpc.Client{}
	evmClients["ethereum"], err = rpc.DialHTTP(env("ETH_RPC", "https://cloudflare-eth.com"))
	check(err)
	evmClients["fantom"], err = rpc.DialHTTP(env("FANTOM_RPC", "https://rpc.fantom.network"))
	check(err)

	port := env("PORT", "8080")
	http.Handle("/public/", http.FileServer(http.FS(fs)))
	http.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c := &C{}
		c.M = M{}
		c.Req = r
		c.Res = w
		c.db = db
		c.s3Client = s3Client
		c.evmClients = evmClients
		handler(c)
	}))
	log.Println("starting on port", port)
	log.Fatalln(http.ListenAndServe(":"+port, nil))
}

func handler(c *C) {
	fmt.Println("request", c.Req.Method, c.Req.URL.String())
	defer func() {
		if err := recover(); err != nil {
			fmt.Println("error", err)
			c.Res.WriteHeader(500)
			fmt.Fprintf(c.Res, "Server Error: %v", err)
		}
	}()

	c.Method = c.Req.Method
	c.Params = M{}
	for k, v := range c.Req.URL.Query() {
		c.Params[k] = strings.Join(v, ",")
	}
	if c.Req.Method == "POST" {
		if c.Req.Header.Get("Content-Type") == "multipart/form-data" {
			check(c.Req.ParseMultipartForm(16 * 1024 * 1024))
		} else {
			check(c.Req.ParseForm())
		}
		for k, v := range c.Req.Form {
			c.Params[k] = strings.Join(v, ",")
		}
	}

	handler, ok := routes[c.Req.URL.Path]
	if !ok {
		c.Res.WriteHeader(404)
		c.Res.Write([]byte("Page Not Found"))
		return
	}
	handler(c)
}

// }}}}}}
// {{{{{{ CONTEXT

type C struct {
	M
	Req        *http.Request
	Res        http.ResponseWriter
	Method     string
	Params     M
	db         *sqlx.DB
	s3Client   *s3.S3
	evmClients map[string]*rpc.Client
}

func (c *C) GetCookie(name string) string {
	if cookie, err := c.Req.Cookie(name); err == nil {
		return cookie.Value
	}
	return ""
}

func (c *C) SetCookie(name, value string) {
	http.SetCookie(c.Res, &http.Cookie{
		Name:     name,
		Value:    value,
		HttpOnly: true,
		Path:     "/",
		MaxAge:   2147483647,
	})
}

func (c *C) DbSelect(sql string, args ...interface{}) []M {
	results := []M{}
	rows, err := c.db.Queryx(sql, args...)
	check(err)
	for rows.Next() {
		result := make(map[string]interface{})
		check(rows.MapScan(result))
		results = append(results, result)
	}
	return results
}

func (c *C) DbGet(sql string, args ...interface{}) M {
	js := c.DbSelect(sql, args)
	if len(js) == 0 {
		return nil
	}
	return js[0]
}

func (c *C) DbPut(table string, entity M) M {
	cols := []string{}
	args := []interface{}{}

	for k, v := range entity {
		cols = append(cols, k)
		args = append(args, v)
	}

	join := strings.Join
	vars := []string{}
	sets := []string{}
	for i, c := range cols {
		vars = append(vars, "$"+strconv.Itoa(i+1))
		sets = append(sets, c+" = "+vars[i])
	}
	sql := "insert into %s (%s) values (%s) on conflict (id) do update set %s returning *"
	sql = fmt.Sprintf(sql, table, join(cols, ", "), join(vars, ", "), join(sets, ", "))
	return c.DbGet(sql, args...)
}

// }}}}}}
// {{{{{{ UTILS

type L []interface{}
type M map[string]interface{}

func (v M) Set(k string, value interface{}) interface{} {
	v[k] = value
	return nil
}

func (v M) Get(k string) string {
	if s, ok := v[k].(string); ok {
		return s
	}
	return ""
}

func (v M) GetM(k string) M {
	if m, ok := v[k].(map[string]interface{}); ok {
		return M(m)
	}
	return nil
}

func (v M) GetL(k string) L {
	if l, ok := v[k].([]interface{}); ok {
		return L(l)
	}
	return nil
}

func check(err error) {
	if err != nil {
		panic(err)
	}
}

func env(name, alt string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return alt
}

func stringOr(ss ...string) string {
	for _, s := range ss {
		if s != "" {
			return s
		}
	}
	return ""
}

func uuid() string {
	u := [16]byte{}
	_, err := rand.Read(u[:16])
	if err != nil {
		panic(err)
	}
	return fmt.Sprintf("%x", u)
}

func reqBody(r *http.Request, v interface{}) {
	bs, err := io.ReadAll(r.Body)
	check(err)
	r.Body.Close()
	check(json.Unmarshal(bs, &v))
}

func httpGet(url string) (interface{}, error) {
	log.Println("httpGet:", url)
	res, err := http.DefaultClient.Get(url)
	if err != nil {
		return nil, err
	}
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("httpGet: error: %d: %s", res.StatusCode, string(body))
	}
	var v interface{}
	err = json.Unmarshal(body, &v)
	return v, err
}

func formatJson(v interface{}) string {
	bs, err := json.Marshal(v)
	check(err)
	return string(bs)
}

// }}}}}}
// {{{{{{ HTML

func html(c *C, code int, html string) {
	c.Res.Header().Set("Content-Type", "text/html")
	c.Res.WriteHeader(code)
	c.Res.Write([]byte("<!doctype html>" + html))
}

func h(tag string, attrs M, children ...string) string {
	attrString := ""
	if attrs != nil {
		for k, v := range attrs {
			attrString += fmt.Sprintf(" %s=\"%v\"", k, v)
		}
	}
	if tag == "br" || tag == "input" || tag == "meta" || tag == "link" {
		return "<" + tag + attrString + " />"
	}
	return "<" + tag + attrString + ">" + strings.Join(children, "") + "</" + tag + ">"
}

func hc(tag string, class string, children ...string) string {
	return h(tag, M{"class": class}, children...)
}

func divc(class string, children ...string) string {
	return h("div", M{"class": class}, children...)
}

func layoutHead(title string) string {
	if title != "" {
		title += " - Thorstarter"
	} else {
		title = "Thorstarter"
	}
	return h("head", nil,
		h("meta", M{"charset": "utf-8"}),
		h("meta", M{"name": "viewport", "content": "width=device-width, initial-scale=1"}),
		h("meta", M{"name": "theme-color", "content": "#28DBD1"}),
		h("title", nil, title),
		h("link", M{"rel": "icon", "href": "/public/favicon.png"}),
		h("link", M{"rel": "stylesheet", "href": "/public/app.css"}),
		h("meta", M{"property": "og:image", "content": "/public/og-image.png"}),
		h("meta", M{"name": "twitter:image", "content": "/public/og-image.png"}),
		h("script", M{
			"type":  "text/javascript",
			"async": "true",
			"src":   "https://www.googletagmanager.com/gtag/js?id=G-09DERZHQB2",
		}),
		h("script", M{"type": "text/javascript"}, `
			  window.dataLayer = window.dataLayer || [];
				function gtag(){dataLayer.push(arguments);}
				gtag('js', new Date());
				gtag('config', 'G-09DERZHQB2');`))
}

func layoutSite(title string, children ...string) string {
	return h("html", M{"lang": "en"},
		layoutHead(title),
		h("body", nil,
			divc("container flex items-center pt-4 mb-4",
				divc("flex-auto",
					h("a", M{"href": "/"}, h("img", M{"src": "/public/logo.svg"}))),
				divc("",
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/about"}, "Learn More"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/faq"}, "FAQ"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/apply"}, "Apply for IDO"),
					h("a", M{"class": "button ml-4", "href": "/idos"}, "App"))),
			strings.Join(children, ""),
			divc("container mt-16 pb-16 text-center",
				divc("mb-4",
					h("a", M{"class": "text-white-50 text-lg", "href": "/docs"}, "Docs"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/faq"}, "FAQ"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/brand-kit"}, "Brand Kit"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/jobs"}, "Jobs"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "mailto:team@thorstarter.org"}, "Contact")),
				h("div", M{"class": "mb-4", "style": "color:rgba(255,255,255,0.35);"},
					h("a", M{"class": "", "href": "https://twitter.com/thorstarter"}, "Twitter"),
					h("a", M{"class": "ml-4", "href": "https://discord.gg/kBDpARByAx"}, "Discord"),
					h("a", M{"class": "ml-4", "href": "https://t.me/thorstarter"}, "Telegram"),
					h("a", M{"class": "ml-4", "href": "https://medium.com/@thorstarter"}, "Medium")),
				h("div", M{"style": "color:rgba(255,255,255,0.15);"}, "© 2021 Thorstarter. All Rights Reserved"))))
}

func layoutApp(c *C, title string, children ...string) string {
	return h("html", M{"lang": "en"},
		layoutHead(title),
		h("body", nil,
			divc("container flex items-center pt-4 mb-4",
				divc("hide-phone",
					h("a", M{"href": "/"}, h("img", M{"src": "/public/logo.svg", "width": "220"}))),
				divc("flex-auto text-center",
					h("a", M{"class": "text-white-50 text-lg", "href": "/idos"}, "IDOs"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/tiers"}, "Tiers"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/forge"}, "Forge"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/docs"}, "Docs")),
				divc("",
					h("span", M{"style": "display:inline-block;padding:4px 4px 4px 16px;margin-left:16px;background:var(--gray3);border-radius:var(--border-radius);"},
						"Ethereum",
						h("a", M{"class": "button ml-4", "onclick": "javascript:walletConnect();"}, "Connect Wallet")))),
			strings.Join(children, ""),
			divc("container mt-16 pb-16 text-center",
				divc("mb-4",
					h("a", M{"class": "text-white-50 text-lg", "href": "/docs"}, "Docs"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/faq"}, "FAQ"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/brand-kit"}, "Brand Kit"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "/jobs"}, "Jobs"),
					h("a", M{"class": "text-white-50 text-lg ml-4", "href": "mailto:team@thorstarter.org"}, "Contact")),
				h("div", M{"class": "mb-4", "style": "color:rgba(255,255,255,0.35);"},
					h("a", M{"class": "", "href": "https://twitter.com/thorstarter"}, "Twitter"),
					h("a", M{"class": "ml-4", "href": "https://discord.gg/kBDpARByAx"}, "Discord"),
					h("a", M{"class": "ml-4", "href": "https://t.me/thorstarter"}, "Telegram"),
					h("a", M{"class": "ml-4", "href": "https://medium.com/@thorstarter"}, "Medium")),
				h("div", M{"style": "color:rgba(255,255,255,0.15);"}, "© 2021 Thorstarter. All Rights Reserved"))))
}

// }}}}}}
// {{{{{{ ROUTES

var _ = route("/admin", func(c *C) {
	if c.Req.Method == "POST" && c.Params.Get("action") == "file" {
		id := uuid()
		f := c.Req.MultipartForm.File["file"][0]
		fh, err := f.Open()
		check(err)
		defer fh.Close()
		bs, err := io.ReadAll(fh)
		check(err)
		typ := http.DetectContentType(bs)
		_, err = c.s3Client.PutObject(&s3.PutObjectInput{
			ACL:                aws.String("public"),
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
	files := c.DbSelect("select * from files order by created_at desc")

	html(c, 200, layoutApp(c, "Admin",
		divc("container",
			h("h1", M{"class": "title"}, "Admin"),
			h("h2", nil, "IDOs"),
			"Soon..",
			h("h2", nil, "Files"),
			h("form", M{"class": "box mb-4", "method": "post", "enctype": "multipart/form-data"},
				h("input", M{"type": "file", "name": "file"}),
				h("button", M{"type": "submit", "name": "action", "value": "file", "class": "button"}, "Upload")),
			formatJson(files),
		)))
})

// }}}}}}
