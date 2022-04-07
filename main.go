package main

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
)

//go:embed app/*
var fs embed.FS

//go:embed public/*
var publicFs embed.FS

var t *template.Template

var funcs = template.FuncMap{
	"env": env,
}

func main() {
	t = template.New("")
	t.Funcs(funcs)
	t.ParseFS(fs, "app/*.html")
	port := env("PORT", "8080")
	http.Handle("/public/", http.FileServer(http.FS(publicFs)))
	http.Handle("/", http.HandlerFunc(handler))
	log.Println("starting on port", port)
	log.Fatalln(http.ListenAndServe(":"+port, nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
	c := C{M{}}
	w.Header().Set("Content-Type", "text/html")
	path := stringOr(r.URL.Path[1:], "index") + ".html"
	if t.Lookup(path) == nil {
		path = "404.html"
	}
	b := bytes.NewBuffer([]byte{})
	err := t.ExecuteTemplate(b, path, c)
	if err != nil {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(500)
		fmt.Fprintf(w, "Error: %s", err.Error())
		return
	}
	w.Write(b.Bytes())
}

type L []interface{}
type M map[string]interface{}

type C struct {
	M
}

func (v M) Set(k string, value interface{}) interface{} {
	v[k] = value
	return nil
}

func (v M) GetS(k string) string {
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
