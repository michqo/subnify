alter table public.calculations
  alter column total_required_hosts type bigint using total_required_hosts::bigint,
  alter column total_usable_hosts type bigint using total_usable_hosts::bigint;
