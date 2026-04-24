alter table public.profiles
  add column if not exists native_language text not null default 'en'
  check (native_language in ('en', 'de'));
