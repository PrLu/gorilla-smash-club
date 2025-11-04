-- Phase 3: Reporting and Analytics
-- Materialized views for fast reporting and analytics

-- Tournament summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_tournament_summary AS
SELECT 
  t.id AS tournament_id,
  t.title,
  t.organizer_id,
  t.status,
  t.start_date,
  t.end_date,
  COUNT(DISTINCT r.id) AS total_registrations,
  COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) AS confirmed_registrations,
  COUNT(DISTINCT CASE WHEN r.payment_status = 'paid' THEN r.id END) AS paid_registrations,
  COUNT(DISTINCT m.id) AS total_matches,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) AS completed_matches,
  COUNT(DISTINCT CASE WHEN m.status = 'pending' THEN m.id END) AS pending_matches,
  COUNT(DISTINCT CASE WHEN m.status = 'in_progress' THEN m.id END) AS in_progress_matches,
  COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN t.entry_fee ELSE 0 END), 0) AS total_revenue,
  t.created_at,
  t.updated_at
FROM public.tournaments t
LEFT JOIN public.registrations r ON r.tournament_id = t.id
LEFT JOIN public.matches m ON m.tournament_id = t.id
GROUP BY t.id, t.title, t.organizer_id, t.status, t.start_date, t.end_date, t.entry_fee, t.created_at, t.updated_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_tournament_summary_id ON public.vw_tournament_summary(tournament_id);

-- Player global statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_player_stats_global AS
SELECT 
  p.id AS player_id,
  p.profile_id,
  p.first_name,
  p.last_name,
  p.player_rating,
  p.gender,
  COUNT(DISTINCT r.tournament_id) AS tournaments_played,
  COUNT(DISTINCT m.id) AS total_matches,
  COUNT(DISTINCT CASE 
    WHEN m.status = 'completed' AND (m.winner_player_id = p.id OR m.winner_team_id IN (
      SELECT id FROM public.teams WHERE player1_id = p.id OR player2_id = p.id
    )) THEN m.id 
  END) AS matches_won,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) AS matches_completed,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) > 0 
    THEN ROUND(
      COUNT(DISTINCT CASE 
        WHEN m.status = 'completed' AND (m.winner_player_id = p.id OR m.winner_team_id IN (
          SELECT id FROM public.teams WHERE player1_id = p.id OR player2_id = p.id
        )) THEN m.id 
      END)::numeric / 
      COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END)::numeric * 100, 
      2
    )
    ELSE 0 
  END AS win_rate_percentage,
  p.created_at,
  MAX(m.updated_at) AS last_match_date
FROM public.players p
LEFT JOIN public.registrations r ON r.player_id = p.id
LEFT JOIN public.matches m ON m.player1_id = p.id OR m.player2_id = p.id OR m.team1_id IN (
  SELECT id FROM public.teams WHERE player1_id = p.id OR player2_id = p.id
) OR m.team2_id IN (
  SELECT id FROM public.teams WHERE player1_id = p.id OR player2_id = p.id
)
GROUP BY p.id, p.profile_id, p.first_name, p.last_name, p.player_rating, p.gender, p.created_at;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_player_stats_player_id ON public.vw_player_stats_global(player_id);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_vw_player_stats_rating ON public.vw_player_stats_global(player_rating);
CREATE INDEX IF NOT EXISTS idx_vw_player_stats_gender ON public.vw_player_stats_global(gender);
CREATE INDEX IF NOT EXISTS idx_vw_player_stats_tournaments ON public.vw_player_stats_global(tournaments_played DESC);
CREATE INDEX IF NOT EXISTS idx_vw_player_stats_winrate ON public.vw_player_stats_global(win_rate_percentage DESC);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_reporting_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_tournament_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_player_stats_global;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to refresh views every hour (requires pg_cron extension)
-- Uncomment if pg_cron is enabled:
-- SELECT cron.schedule(
--   'refresh-reporting-views',
--   '0 * * * *',  -- Every hour
--   $$ SELECT public.refresh_reporting_views(); $$
-- );

-- Grant SELECT on materialized views to authenticated users
GRANT SELECT ON public.vw_tournament_summary TO authenticated;
GRANT SELECT ON public.vw_player_stats_global TO authenticated;

