-- fetchBoard côté serveur : agrège les points en SQL
-- Évite la limite de 1000 lignes de PostgREST côté client.

create or replace function public.fetch_board()
returns table(id uuid, name text, avatar text, total_points numeric)
language sql
security definer
stable
as $$
  select
    p.id,
    p.name,
    p.avatar,
    coalesce(sum(e.points), 0) as total_points
  from players p
  left join events e on e.player_id = p.id
  group by p.id, p.name, p.avatar
  order by total_points desc;
$$;
