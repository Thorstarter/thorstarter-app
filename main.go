package main

import (
	"bytes"
	"crypto/rand"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/yuin/goldmark"
)

// {{{{{{ MAIN
//go:embed public/*
var fs embed.FS

var start = time.Now()
var contracts = map[string]map[string]string{
	"Ethereum": map[string]string{
		"xrune": "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c",
	},
	"Fantom": map[string]string{
		"xrune": "0xe1e6b01ae86ad82b1f1b4eb413b219ac32e17bf6",
		"forge": "0x2D23039c1bA153C6afcF7CaB9ad4570bCbF80F56",
	},
	"Terra": map[string]string{
		"xrune": "terra1td743l5k5cmfy7tqq202g7vkmdvq35q48u2jfm",
	},
}

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
	evmClients["Ethereum"], err = rpc.DialHTTP(env("ETH_RPC", "https://cloudflare-eth.com"))
	check(err)
	evmClients["Fantom"], err = rpc.DialHTTP(env("FANTOM_RPC", "https://rpc2.fantom.network"))
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
		if strings.HasPrefix(c.Req.Header.Get("Content-Type"), "multipart/form-data") {
			check(c.Req.ParseMultipartForm(16 * 1024 * 1024))
			for k, v := range c.Req.MultipartForm.Value {
				c.Params[k] = strings.Join(v, ",")
			}
		} else {
			check(c.Req.ParseForm())
			for k, v := range c.Req.Form {
				c.Params[k] = strings.Join(v, ",")
			}
		}
	}

	path := c.Req.URL.Path
	if strings.HasPrefix(path, "/ido/") {
		c.Params.Set("ido", strings.Split(path, "/")[2])
		path = "/ido"
	}
	handler, ok := routes[path]
	if !ok {
		renderNotFound(c)
		return
	}
	handler(c)
}

func renderNotFound(c *C) {
	c.Html(404, layoutApp(c, "",
		divc("container",
			h("h1", M{"class": "title text-center", "style": "margin:20vh 0;"}, "Page Not Found"),
		)))
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

func (c *C) Html(code int, html string) {
	c.Res.Header().Set("Content-Type", "text/html")
	c.Res.WriteHeader(code)
	c.Res.Write([]byte("<!doctype html>" + html))
}

func (c *C) Redirect(path string) {
	c.Res.Header().Set("Location", path)
	c.Res.WriteHeader(http.StatusFound)
	c.Res.Write([]byte("Redirecting..."))
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
	js := c.DbSelect(sql, args...)
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

func (v M) GetI(k string) int64 {
	if x, ok := v[k].(int64); ok {
		return x
	}
	return 0
}

func (v M) GetB(k string) bool {
	if x, ok := v[k].(bool); ok {
		return x
	}
	return false
}

func (v M) GetBN(k string) *BN {
	if x, ok := v[k].(*BN); ok {
		return x
	}
	return BNZero
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

type BN struct {
	big.Int
}

var BNZero = &BN{big.Int{}}

func NewBN(n string, d int) *BN {
	bn := &BN{big.Int{}}
	_, ok := bn.Int.SetString(n, 10)
	if !ok {
		panic("NewBN: Invalid number: " + n)
	}
	p := (&big.Int{}).Exp(big.NewInt(10), big.NewInt(int64(d)), nil)
	bn.Int.Mul(&bn.Int, p)
	return bn
}

func (b *BN) Add(x *BN) *BN {
	bn := &BN{big.Int{}}
	bn.Int.Add(&b.Int, &x.Int)
	return bn
}

func (b *BN) Format(d int, p int) string {
	s := b.Int.String()
	ss := ""
	for i := 0; i < d; i++ {
		if i < d-p {
			continue
		}
		if i >= len(s) {
			ss = "0" + ss
		} else {
			ss = string(s[len(s)-1-i]) + ss
		}
	}
	if ss != "" {
		ss = "." + ss
	}
	if len(s) > d {
		ss = formatIntString(s[0:len(s)-d]) + ss
	} else {
		ss = "0" + ss
	}
	return ss
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

func tern(c bool, t string, f string) string {
	if c {
		return t
	} else {
		return f
	}
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

func intToString(x int64) string {
	return strconv.FormatInt(x, 10)
}

func stringToInt(x string) int64 {
	y, err := strconv.ParseInt(x, 10, 64)
	if err != nil {
		panic(err)
	}
	return y
}

func markdownToHTML(x string) string {
	var y bytes.Buffer
	check(goldmark.Convert([]byte(x), &y))
	return y.String()
}

func formatAddress(x string) string {
	if x == "" {
		return ""
	}
	return x[0:6] + "…" + x[len(x)-4:]
}

func formatInt(x int64) string {
	return formatIntString(intToString(x))
}

func formatIntString(y string) string {
	z := ""
	for i := 0; i < len(y); i++ {
		if (len(y)-i)%3 == 0 && i > 0 {
			z += ","
		}
		z += string(y[i])
	}
	return z
}

func formatJson(x interface{}) string {
	bs, err := json.Marshal(x)
	check(err)
	return string(bs)
}

func s3Url(key string) string {
	return fmt.Sprintf("http://%s.s3-website-us-east-1.amazonaws.com/%s/%s",
		env("AWS_BUCKET", "thorstarter-files"),
		key[0:3], key)
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

// }}}}}}
// {{{{{{ HTML

func h(tag string, attrs M, children ...string) string {
	attrString := ""
	if attrs != nil {
		for k, v := range attrs {
			if x, ok := v.(bool); ok && !x {
				continue
			}
			attrString += fmt.Sprintf(" %s=\"%v\"", k, v)
		}
	}
	if tag == "br" || tag == "hr" || tag == "img" || tag == "input" || tag == "meta" || tag == "link" {
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

func hmapj(s []M, fn func(M) string) string {
	ss := ""
	for _, v := range s {
		ss += fn(v)
	}
	return ss
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
		h("link", M{"rel": "shortcut icon", "href": "/public/favicon.png"}),
		h("link", M{"rel": "stylesheet", "href": "/public/app.css?v=" + start.Format("20060102150405")}),
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
	walletChain := c.GetCookie("walletChain")
	walletAddress := c.GetCookie("walletAddress")
	// https://chart.apis.google.com/chart?chs=300x300&cht=qr&choe=UTF-8&chl=asd
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
						tern(walletChain != "", walletChain, "Ethereum"),
						h("a", M{"class": "button ml-4", "onclick": "javascript:walletConnect();"},
							tern(walletAddress != "", formatAddress(walletAddress), "Connect Wallet"))))),
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
				h("div", M{"style": "color:rgba(255,255,255,0.15);"}, "© 2021 Thorstarter. All Rights Reserved")),

			h("div", M{"id": "walletConnectModal", "class": "modal hide", "onclick": "toggle('#walletConnectModal')"},
				h("div", M{"class": "modal-content", "style": "width:320px", "onclick": "event.stopPropagation()"},
					h("h2", M{"class": "text-lg"}, "Ethereum"),
					h("a", M{"class": "wallet-option", "onclick": "walletConnectMetamask()"},
						h("img", M{"src": "/public/wallets/metamask.png"}), "Metamask"),
					h("h2", M{"class": "text-lg", "style": "margin-top:32px"}, "Terra"),
					h("a", M{"class": "wallet-option", "onclick": "walletConnectTerra()"},
						h("img", M{"src": "/public/wallets/terrastation.png"}), "Terra Station"),
				)),
			h("div", M{"id": "txPendingModal", "class": "modal hide"},
				h("div", M{"class": "modal-content"},
					h("div", M{"class": "text-center text-lg"}, "Transaction pending..."))),
			h("div", M{"id": "txErrorModal", "class": "modal hide", "onclick": "toggle('#txErrorModal')"},
				h("div", M{"class": "modal-content"},
					h("div", M{"class": "text-center text-lg text-red", "id": "txErrorModalText"}, ""))),
			h("div", M{"id": "txSuccessModal", "class": "modal hide", "onclick": "window.location.href='?nocache=1'"},
				h("div", M{"class": "modal-content", "style": "width:600px", "onclick": "event.stopPropagation()"},
					h("div", M{"class": "text-center"}, "Transaction sent! View in explorer: ",
						h("a", M{"id": "txSuccessModalLink", "class": "text-primary5", "target": "_blank"}, ""),
						h("div", nil, h("a", M{"class": "button mt-4", "onclick": "window.location.href='?nocache=1'"}, "Close"))))),

			h("div", M{"id": "walletChain", "style": "display:none"}, walletChain),
			h("div", M{"id": "walletAddress", "style": "display:none"}, walletAddress),
			h("script", M{"src": "/public/app.js?v=" + start.Format("20060102150405")}),
		))
}

var iconTwitter = `<svg fill="white" width="18" height="18" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M40 7.5975C38.5125 8.25 36.9275 8.6825 35.275 8.8925C36.975 7.8775 38.2725 6.2825 38.8825 4.36C37.2975 5.305 35.5475 5.9725 33.6825 6.345C32.1775 4.7425 30.0325 3.75 27.6925 3.75C23.1525 3.75 19.4975 7.435 19.4975 11.9525C19.4975 12.6025 19.5525 13.2275 19.6875 13.8225C12.87 13.49 6.8375 10.2225 2.785 5.245C2.0775 6.4725 1.6625 7.8775 1.6625 9.39C1.6625 12.23 3.125 14.7475 5.305 16.205C3.9875 16.18 2.695 15.7975 1.6 15.195C1.6 15.22 1.6 15.2525 1.6 15.285C1.6 19.27 4.4425 22.58 8.17 23.3425C7.5025 23.525 6.775 23.6125 6.02 23.6125C5.495 23.6125 4.965 23.5825 4.4675 23.4725C5.53 26.72 8.545 29.1075 12.13 29.185C9.34 31.3675 5.7975 32.6825 1.9625 32.6825C1.29 32.6825 0.645 32.6525 0 32.57C3.6325 34.9125 7.9375 36.25 12.58 36.25C27.67 36.25 35.92 23.75 35.92 12.915C35.92 12.5525 35.9075 12.2025 35.89 11.855C37.5175 10.7 38.885 9.2575 40 7.5975Z"></path></svg>`

var iconTelegram = `<svg fill="white" width="18" height="18" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M15.6953 25.3018L15.0336 34.6084C15.9803 34.6084 16.3903 34.2018 16.882 33.7134L21.3203 29.4718L30.517 36.2068C32.2036 37.1468 33.392 36.6518 33.847 34.6551L39.8836 6.36844L39.8853 6.36677C40.4203 3.87344 38.9836 2.89844 37.3403 3.51011L1.85696 17.0951C-0.564703 18.0351 -0.528037 19.3851 1.4453 19.9968L10.517 22.8184L31.5886 9.63344C32.5803 8.97677 33.482 9.34011 32.7403 9.99677L15.6953 25.3018Z"></path></svg>`

var iconDiscord = `<svg width="18" height="18" viewBox="0 0 40 40" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M16.7926 16C15.7909 16 15 16.9009 15 18C15 19.0991 15.8084 20 16.7926 20C17.7944 20 18.5852 19.0991 18.5852 18C18.6028 16.9009 17.7944 16 16.7926 16ZM23.2074 16C22.2056 16 21.4148 16.9009 21.4148 18C21.4148 19.0991 22.2232 20 23.2074 20C24.2091 20 25 19.0991 25 18C25 16.9009 24.2091 16 23.2074 16Z"></path><path d="M33.7829 0H6.21714C3.89257 0 2 1.84 2 4.12V31.16C2 33.44 3.89257 35.28 6.21714 35.28H29.5451L28.4549 31.58L31.088 33.96L33.5771 36.2L38 40V4.12C38 1.84 36.1074 0 33.7829 0ZM25.8423 26.12C25.8423 26.12 25.1017 25.26 24.4846 24.5C27.1794 23.76 28.208 22.12 28.208 22.12C27.3646 22.66 26.5623 23.04 25.8423 23.3C24.8137 23.72 23.8263 24 22.8594 24.16C20.8846 24.52 19.0743 24.42 17.5314 24.14C16.3589 23.92 15.3509 23.6 14.5074 23.28C14.0343 23.1 13.52 22.88 13.0057 22.6C12.944 22.56 12.8823 22.54 12.8206 22.5C12.7794 22.48 12.7589 22.46 12.7383 22.44C12.368 22.24 12.1623 22.1 12.1623 22.1C12.1623 22.1 13.1497 23.7 15.7623 24.46C15.1451 25.22 14.384 26.12 14.384 26.12C9.83771 25.98 8.10971 23.08 8.10971 23.08C8.10971 16.64 11.072 11.42 11.072 11.42C14.0343 9.26 16.8526 9.32 16.8526 9.32L17.0583 9.56C13.3554 10.6 11.648 12.18 11.648 12.18C11.648 12.18 12.1006 11.94 12.8617 11.6C15.0629 10.66 16.8114 10.4 17.5314 10.34C17.6549 10.32 17.7577 10.3 17.8811 10.3C19.136 10.14 20.5554 10.1 22.0366 10.26C23.9909 10.48 26.0891 11.04 28.2286 12.18C28.2286 12.18 26.6034 10.68 23.1063 9.64L23.3943 9.32C23.3943 9.32 26.2126 9.26 29.1749 11.42C29.1749 11.42 32.1371 16.64 32.1371 23.08C32.1371 23.08 30.3886 25.98 25.8423 26.12Z"></path></svg>`

var iconMedium = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M8.997 19.3639C8.997 19.9128 8.60625 20.1395 8.1735 19.9128L3.5025 17.4539C3.3615 17.3836 3.243 17.266 3.14625 17.1009C3.0495 16.9358 3 16.7715 3 16.6096V4.58214C3 4.13349 3.25575 3.93049 3.834 4.23381L8.967 6.93518C9.04125 7.01338 8.9865 6.47626 8.997 19.3639ZM9.63975 8.05285L15.0037 17.1901L9.63975 14.3837V8.05285ZM21 8.24321V19.3639C21 19.54 20.9535 19.6822 20.859 19.7912C20.7653 19.9002 20.6377 19.9547 20.4772 19.9547C20.3167 19.9547 20.1593 19.9089 20.0055 19.8172L15.576 17.4958L21 8.24321ZM20.97 6.97704C20.97 6.99837 20.1112 8.47385 18.3937 11.4027C16.6762 14.3316 15.6698 16.0472 15.375 16.5464L11.4578 9.85693L14.712 4.297C14.889 3.99053 15.252 3.93681 15.4957 4.06477L20.9303 6.91385C20.9565 6.92728 20.97 6.94861 20.97 6.97704Z"></path></svg>`

var iconExternal = `<svg fill="white" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.1969 11.9442H17.9256C17.6623 11.9442 17.4489 12.1577 17.4489 12.421V18.2171C17.4489 18.5248 17.1985 18.7751 16.8908 18.7751H5.78253C5.47494 18.7751 5.22475 18.5248 5.22475 18.2171V7.10901C5.22475 6.8013 5.47494 6.55092 5.78253 6.55092H11.8755C12.1388 6.55092 12.3522 6.33747 12.3522 6.07419V4.8029C12.3522 4.53962 12.1388 4.32617 11.8755 4.32617H5.78253C4.24821 4.32617 3 5.57457 3 7.10901V18.2172C3 19.7516 4.24828 20.9999 5.78253 20.9999H16.8908C18.4252 20.9999 19.6735 19.7516 19.6735 18.2172V12.421C19.6736 12.1577 19.4602 11.9442 19.1969 11.9442Z"></path><path d="M20.523 3H15.4662C15.2029 3 14.9895 3.21345 14.9895 3.47673V4.74802C14.9895 5.0113 15.2029 5.22475 15.4662 5.22475H17.2018L10.6709 11.7555C10.4847 11.9417 10.4847 12.2435 10.6709 12.4298L11.5698 13.3287C11.6592 13.4182 11.7805 13.4684 11.907 13.4684C12.0334 13.4684 12.1547 13.4182 12.244 13.3287L18.7749 6.79784V8.53333C18.7749 8.79662 18.9884 9.01006 19.2517 9.01006H20.523C20.7862 9.01006 20.9997 8.79662 20.9997 8.53333V3.47673C20.9997 3.21345 20.7862 3 20.523 3Z"></path></svg>`

var iconDocumentation = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M7.09902 3.00391L4.86523 5.23769H7.09902V3.00391Z"></path><path d="M16.4946 3H8.15333V6.292H4.86133V18.3569H16.4947V3H16.4946ZM14.3223 13.1901H7.03366V12.1353H14.3223V13.1901ZM14.3223 10.9493H7.03366V9.89459H14.3223V10.9493ZM14.3223 8.70854H7.03366V7.65381H14.3223V8.70854Z"></path><path d="M17.55 5.64355V19.4112H7.50586V21.0004H19.1392V5.64355H17.55Z"></path></svg>`

// }}}}}}
// {{{{{{ CACHE
var cache = map[string]M{}
var cacheTtl = map[string]time.Time{}
var cacheLock = sync.Mutex{}

func (c *C) CacheGet(k string) M {
	if c.Req.URL.Query().Get("nocache") == "1" {
		return nil
	}
	cacheLock.Lock()
	defer cacheLock.Unlock()
	if t, ok := cacheTtl[k]; ok && time.Now().After(t) {
		delete(cache, k)
		delete(cacheTtl, k)
		return nil
	}
	return cache[k]
}

func (c *C) CacheSet(k string, ttl int, v M) {
	cacheLock.Lock()
	defer cacheLock.Unlock()
	cache[k] = v
	cacheTtl[k] = time.Now().Add(time.Duration(ttl) * time.Second)
}

func (c *C) CacheGetf(k string, ttl int, fn func() M) M {
	v := c.CacheGet(k)
	if v == nil {
		v = fn()
		c.CacheSet(k, ttl, v)
	}
	return v
}

// }}}}}}
