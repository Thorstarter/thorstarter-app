create table kyc (
  id text primary key,
  address text not null,
  session_id text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table users (
  id text primary key,
  kyc_verified boolean not null default false,
  address_ethereum text not null,
  address_terra text not null,
  address_fantom text not null,
  address_polygon text not null,
  amount_ethereum int not null,
  amount_terra int not null,
  amount_fantom int not null,
  amount_polygon int not null,
  amount_tclp int not null,
  amount_forge int not null,
  iphash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users_addresses (
  id text primary key,
  user_id text not null,
  network text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table users_ips (
  id text primary key,
  user_id text not null,
  iphash text not null,
  created_at timestamptz not null default now()
);

create table users_registrations (
  id text primary key,
  ido text not null,
  user_id text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table files (
  id text primary key,
  name text not null,
  size bigint not null,
  created_at timestamptz not null default now()
);

create table idos (
  id text primary key,
  name text not null,
  symbol text not null,
  symbol_currency text not null,
  chain text not null,
  contract text not null,
  tokens_offered int not null,
  tokens_raising int not null,
  vesting_terms text not null,
  ido_date text not null,
  tge_date text not null,
  cover_image text not null,
  logo_image text not null,
  link_telegram text not null,
  link_discord text not null,
  link_twitter text not null,
  link_website text not null,
  link_medium text not null,
  link_documentation text not null,
  short_description text not null,
  long_description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
