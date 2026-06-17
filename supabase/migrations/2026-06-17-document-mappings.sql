create table if not exists public.document_mappings (
  id          text primary key,
  name        text not null,
  pdf_path    text not null,
  fields      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.document_mappings enable row level security;
-- Brak policy = brak dostępu dla anon/authenticated.
-- Dostęp wyłącznie przez klienta service-role (bypassuje RLS).

-- Seed: obecny mapping z mappings/wniosek-pobyt-czasowy.json
insert into public.document_mappings (id, name, pdf_path, fields)
values (
  'wniosek-pobyt-czasowy',
  'Załącznik nr 1 do wniosku o pobyt czasowy',
  '/forms/wniosek-pobyt-czasowy.pdf',
  '[
    {"page":1,"x":235,"y":125,"dataKey":"Name|uppercase","fontSize":11,"type":"grid","boxWidth":13.8,"maxCharsPerRow":23,"rowHeight":25},
    {"page":2,"x":55,"y":780,"dataKey":"Adres|address_street","fontSize":10,"maxWidth":250},
    {"page":2,"x":320,"y":780,"dataKey":"Adres|address_number","fontSize":10,"maxWidth":100},
    {"page":2,"x":55,"y":750,"dataKey":"Adres|address_zip","fontSize":10,"maxWidth":80},
    {"page":2,"x":150,"y":750,"dataKey":"Adres|address_city","fontSize":10,"maxWidth":200},
    {"page":3,"x":55,"y":720,"dataKey":"CelPobytu","fontSize":10,"maxWidth":480}
  ]'::jsonb
)
on conflict (id) do nothing;
