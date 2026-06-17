create table if not exists public.document_field_definitions (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  data_key    text not null,
  category    text,
  description text,
  transform   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists document_field_definitions_data_key_transform_key
  on public.document_field_definitions (data_key, coalesce(transform, ''));

create index if not exists document_field_definitions_category_label_idx
  on public.document_field_definitions (category, label);

alter table public.document_field_definitions enable row level security;
grant select, insert, update, delete on public.document_field_definitions to service_role;

insert into public.document_field_definitions (label, data_key, category, description, transform)
values
  ('Imię i nazwisko', 'Name', 'Dane osobowe', 'Pełna nazwa klienta', null),
  ('Imię i nazwisko wielkimi literami', 'Name', 'Dane osobowe', 'Pełna nazwa klienta w formacie uppercase', 'uppercase'),
  ('Data urodzenia', 'Birthday', 'Dane osobowe', 'Data urodzenia klienta', null),
  ('Kraj pochodzenia', 'KrajPoch', 'Dane osobowe', 'Kraj pochodzenia klienta', null),
  ('Numer sprawy', 'NumerSprawy', 'Sprawa', 'Wewnętrzny numer sprawy', null),
  ('Adres', 'Adres', 'Adres', 'Pełny adres klienta', null),
  ('Ulica', 'Adres', 'Adres', 'Ulica wyciągnięta z pełnego adresu', 'address_street'),
  ('Numer budynku/lokalu', 'Adres', 'Adres', 'Numer wyciągnięty z pełnego adresu', 'address_number'),
  ('Kod pocztowy', 'Adres', 'Adres', 'Kod pocztowy wyciągnięty z pełnego adresu', 'address_zip'),
  ('Miasto', 'Adres', 'Adres', 'Miasto wyciągnięte z pełnego adresu', 'address_city'),
  ('Cel pobytu', 'CelPobytu', 'Sprawa', 'Deklarowany cel pobytu', null),
  ('Email', 'Email', 'Kontakt', 'Adres email klienta', null),
  ('Telefon', 'Phone', 'Kontakt', 'Numer telefonu klienta', null),
  ('Kraj pochodzenia z tabeli krajów', 'country_name', 'Dane osobowe', 'Nazwa kraju z relacji countries', null),
  ('Status klienta', 'Status', 'Sprawa', 'Aktualny status klienta', null),
  ('Podstawa legalnego pobytu', 'PodLegPob', 'Sprawa', 'Podstawa legalnego pobytu klienta', null),
  ('Status płatności', 'StatusPla', 'Finanse', 'Status płatności klienta', null),
  ('Suma wydatków', 'TotalSpend', 'Finanse', 'Łączna kwota wydatków klienta', null),
  ('Inspektor', 'Inspektor', 'Sprawa', 'Inspektor prowadzący sprawę', null),
  ('Firma', 'Firma', 'Praca', 'Firma lub pracodawca klienta', null),
  ('Dokument', 'Doc', 'Dokumenty', 'Pole dokumentu klienta', null),
  ('Notatki', 'Notes', 'Sprawa', 'Notatki do sprawy klienta', null),
  ('Twórca rekordu', 'Creator', 'System', 'Użytkownik lub źródło utworzenia rekordu', null),
  ('Data utworzenia', 'CreatedDate', 'System', 'Data utworzenia rekordu klienta', null),
  ('Data złożenia wniosku', 'DataZloWnio', 'Terminy', 'Data złożenia wniosku', null),
  ('Data wydania wniosku', 'DataWydWni', 'Terminy', 'Data wydania wniosku', null),
  ('Data odbioru karty pobytu', 'DataOdbKartyPob', 'Terminy', 'Data odbioru karty pobytu', null),
  ('Data odbioru decyzji', 'DataOdbDecyzji', 'Terminy', 'Data odbioru decyzji', null),
  ('Data zakończenia legalnego pobytu', 'DataZakLegPob', 'Terminy', 'Data zakończenia legalnego pobytu', null),
  ('Formularz wniosku', 'FormWni', 'Dokumenty', 'Czy formularz wniosku jest dostępny', null),
  ('Załącznik nr 1', 'ZalNrJed', 'Dokumenty', 'Czy załącznik nr 1 jest dostępny', null),
  ('Kopia paszportu', 'KopiaPasz', 'Dokumenty', 'Czy kopia paszportu jest dostępna', null),
  ('Załącznik Blue Card', 'ZalBlue', 'Dokumenty', 'Czy załącznik Blue Card jest dostępny', null),
  ('Cztery zdjęcia', 'CzteZdjecia', 'Dokumenty', 'Czy zdjęcia są dostępne', null),
  ('Pełnomocnictwo', 'Pelnomocnictwo', 'Dokumenty', 'Czy pełnomocnictwo jest dostępne', null)
on conflict do nothing;
