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
  status text not null default '',
  name text not null default '',
  symbol text not null default '',
  symbol_currency text not null default '',
  chain text not null default '',
  contract text not null default '',
  tokens_offered int not null default 0,
  tokens_raising int not null default 0,
  vesting_terms text not null default '',
  ido_date text not null default '',
  tge_date text not null default '',
  cover_image text not null default '',
  logo_image text not null default '',
  link_telegram text not null default '',
  link_discord text not null default '',
  link_twitter text not null default '',
  link_website text not null default '',
  link_medium text not null default '',
  link_documentation text not null default '',
  short_description text not null default '',
  long_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
