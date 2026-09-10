create table reading_sync (
  user_id uuid references auth.users not null,
  comic_id text not null,
  current_page int default 0,
  is_favorite boolean default false,
  updated_at timestamptz default now(),
  primary key (user_id, comic_id)
);

-- RLS: Seguridad por fila para aislar datos de cada usuario
alter table reading_sync enable row level security;

create policy "Users can manage their sync data" 
  on reading_sync for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);