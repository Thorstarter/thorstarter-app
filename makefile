dev:
	@which reflex>/dev/null || go install github.com/cespare/reflex@latest
	reflex -s -d none -- make run

run:
	go run main.go

build:
	go build -o app .

db:
	psql ts

dbuser:
	psql -c "create role admin with login superuser password 'admin';"

dbcreate:
	psql -c "create database ts with owner admin;"
	psql ts < db.sql

dbreset:
	psql -c "drop database ts;"
	psql -c "create database ts with owner admin;"
	psql ts < db.sql
