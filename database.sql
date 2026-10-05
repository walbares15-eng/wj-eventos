-- Database Schema for Venda de Fichas

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events
create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  date date not null,
  location text not null,
  status text check (status in ('active', 'closed')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Products
create table products (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  name text not null,
  price decimal not null,
  color text default '#e5e7eb',
  active boolean default true,
  stock integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Operators
create table operators (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  pin text not null,
  role text check (role in ('admin', 'operator', 'supervisor')) default 'operator',
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sales
create table sales (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  operator_id uuid references operators(id) not null,
  total decimal not null,
  payment_method text check (payment_method in ('cash', 'pix', 'debit', 'credit', 'courtesy')) not null,
  status text check (status in ('pending', 'synced', 'cancelled', 'refunded')) default 'pending',
  fiche_numbers text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sale Items
create table sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  unit_price decimal not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Fiches
create table fiches (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) not null,
  number text not null,
  event_id uuid references events(id) not null,
  product_id uuid references products(id) not null,
  operator_id uuid references operators(id) not null,
  status text check (status in ('issued', 'redeemed', 'cancelled')) default 'issued',
  qr_data text not null,
  issued_at timestamp with time zone default timezone('utc'::text, now()),
  redeemed_at timestamp with time zone,
  cancelled_at timestamp with time zone
);

-- Cash Registers
create table cash_registers (
  id uuid primary key default uuid_generate_v4(),
  operator_id uuid references operators(id) not null,
  event_id uuid references events(id) not null,
  expected_cash decimal not null,
  received_cash decimal,
  difference decimal,
  opened_at timestamp with time zone default timezone('utc'::text, now()),
  closed_at timestamp with time zone,
  status text check (status in ('open', 'closed')) default 'open'
);

-- Sync Queue (for offline support)
create table sync_queue (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- 'sale', 'fiche', 'cash_register'
  action text not null, -- 'create', 'update'
  data jsonb not null,
  attempts integer default 0,
  last_attempt timestamp with time zone,
  status text default 'pending', -- 'pending', 'synced', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed data for testing
insert into events (id, name, date, location) values ('evento-teste', 'Festa Junina 2026', '2026-06-12', 'Salão Comunitário');
insert into products (event_id, name, price, color) values 
('evento-teste', 'Cerveja', 8, '#f59e0b'),
('evento-teste', 'Refrigerante', 5, '#ef4444'),
('evento-teste', 'Espetinho', 6, '#8b5cf6');
insert into operators (name, pin, role) values ('Wanderley', '0000', 'admin');