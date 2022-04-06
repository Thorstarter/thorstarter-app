package main

import (
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
	c := J{}
	w.Header().Set("Content-Type", "text/html")
	path := stringOr(r.URL.Path[1:], "index") + ".html"
	err := t.ExecuteTemplate(w, path, c)
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "Error: %s", err.Error())
	}
}

type J map[string]interface{}

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
