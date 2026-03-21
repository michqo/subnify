drop policy if exists "calculations_delete_own" on public.calculations;
create policy "calculations_delete_own"
  on public.calculations
  for delete
  using (auth.uid() = user_id);
