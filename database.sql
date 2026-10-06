-- WJ Eventos — Schema Postgres (Supabase)
-- Como aplicar: Supabase Dashboard → SQL Editor → New query → cole este
-- arquivo inteiro → Run. Pode rodar de novo sem duplicar (idempotente).

create extension if not exists "uuid-ossp";

-- Eventos
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  date date not null,
  location text not null,
  status text check (status in ('active', 'closed')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Produtos (image = foto em base64, opcional)
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  name text not null,
  price decimal not null,
  color text default '#e5e7eb',
  active boolean default true,
  stock integer,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Operadores (login por PIN)
create table if not exists operators (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  pin text not null,
  role text check (role in ('admin', 'operator', 'supervisor')) default 'operator',
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Vendas
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) not null,
  operator_id uuid references operators(id) not null,
  total decimal not null,
  payment_method text check (payment_method in ('cash', 'pix', 'debit', 'credit', 'courtesy')) not null,
  status text check (status in ('pending', 'synced', 'cancelled', 'refunded')) default 'pending',
  fiche_numbers text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Itens da venda
create table if not exists sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  unit_price decimal not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Fichas
create table if not exists fiches (
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

-- Caixas
create table if not exists cash_registers (
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

-- Fila de sincronização (uso futuro; o app usa fila local no aparelho)
create table if not exists sync_queue (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  action text not null,
  data jsonb not null,
  attempts integer default 0,
  last_attempt timestamp with time zone,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Coluna de foto (para bancos criados com o schema antigo)
alter table products add column if not exists image text;

-- Evento padrão (UUID fixo usado pelo app)
insert into events (id, name, date, location, status)
values ('11111111-1111-1111-1111-111111111111', 'Meu Evento', '2026-12-31', 'Local do evento', 'active')
on conflict (id) do nothing;

-- Produtos iniciais (só se a tabela estiver vazia)
insert into products (event_id, name, price, color, active, stock)
select '11111111-1111-1111-1111-111111111111', name, price, color, true, stock
from (values
  ('Cerveja', 8, '#f59e0b', 200),
  ('Refrigerante', 5, '#ef4444', 150),
  ('Espetinho', 6, '#8b5cf6', 100),
  ('Água', 3, '#3b82f6', null),
  ('Whisky', 15, '#78350f', 50),
  ('Vinho', 12, '#7f1d1d', 5)
) as seed(name, price, color, stock)
where not exists (select 1 from products limit 1);

-- Operadores: 1 admin + 1 supervisor + 4 caixas (um PIN por celular)
insert into operators (name, pin, role)
select s.name, s.pin, s.role
from (values
  ('Wanderley', '0000', 'admin'),
  ('Supervisor', '1234', 'supervisor'),
  ('Caixa 1', '1111', 'operator'),
  ('Caixa 2', '2222', 'operator'),
  ('Caixa 3', '3333', 'operator'),
  ('Caixa 4', '4444', 'operator')
) as s(name, pin, role)
where not exists (select 1 from operators o where o.pin = s.pin);
