alter table public.calculations
  add column if not exists source_type text not null default 'manual';

alter table public.calculations
  add column if not exists ai_prompt text;

alter table public.calculations
  add column if not exists ai_rationale text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calculations_source_type_check'
  ) then
    alter table public.calculations
      add constraint calculations_source_type_check
      check (source_type in ('manual', 'ai_design'));
  end if;
end $$;
