drop policy if exists "calculations_update_own" on public.calculations;
create policy "calculations_update_own"
  on public.calculations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
