-- Migration: Pools and Pool Players for Pool-Based Tournaments
-- Supports pool/group stage tournaments with round-robin within pools

-- =============================================================================
-- POOLS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Pool A, Pool B, etc.
  category TEXT, -- Category this pool belongs to (e.g., "singles_<3.2_male")
  size INTEGER NOT NULL DEFAULT 0, -- Number of players in this pool
  advance_count INTEGER NOT NULL DEFAULT 1, -- How many players advance from this pool
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  metadata JSONB DEFAULT '{}', -- Additional pool settings
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- POOL_PLAYERS TABLE (Junction)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pool_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Position/seed within the pool
  points INTEGER DEFAULT 0, -- Points earned in pool play
  wins INTEGER DEFAULT 0, -- Wins in pool
  losses INTEGER DEFAULT 0, -- Losses in pool
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Either player_id OR team_id must be set, not both
  CHECK (
    (player_id IS NOT NULL AND team_id IS NULL) OR
    (player_id IS NULL AND team_id IS NOT NULL)
  ),
  -- Unique: one player/team can only be in one pool per tournament
  UNIQUE(pool_id, player_id),
  UNIQUE(pool_id, team_id)
);

-- =============================================================================
-- UPDATE MATCHES TABLE
-- =============================================================================

-- Add pool_id column to matches for pool-stage matches
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'pool_id'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN pool_id UUID REFERENCES public.pools(id) ON DELETE SET NULL;
  END IF;

  -- Add match_type to distinguish pool matches from knockout matches
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'match_type'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN match_type TEXT DEFAULT 'knockout' CHECK (match_type IN ('pool', 'knockout'));
  END IF;
END $$;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_pools_tournament ON public.pools(tournament_id);
CREATE INDEX IF NOT EXISTS idx_pools_category ON public.pools(category);
CREATE INDEX IF NOT EXISTS idx_pool_players_pool ON public.pool_players(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_players_player ON public.pool_players(player_id);
CREATE INDEX IF NOT EXISTS idx_pool_players_team ON public.pool_players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_pool ON public.matches(pool_id);
CREATE INDEX IF NOT EXISTS idx_matches_type ON public.matches(match_type);

-- =============================================================================
-- AUTO-UPDATE TRIGGERS
-- =============================================================================

-- Trigger to update pool size when players are added/removed
CREATE OR REPLACE FUNCTION public.update_pool_size()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pools 
    SET size = size + 1, updated_at = NOW()
    WHERE id = NEW.pool_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pools 
    SET size = size - 1, updated_at = NOW()
    WHERE id = OLD.pool_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pool_size ON public.pool_players;
CREATE TRIGGER trigger_update_pool_size
  AFTER INSERT OR DELETE ON public.pool_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pool_size();

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS pools_updated_at ON public.pools;
CREATE TRIGGER pools_updated_at
  BEFORE UPDATE ON public.pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS pool_players_updated_at ON public.pool_players;
CREATE TRIGGER pool_players_updated_at
  BEFORE UPDATE ON public.pool_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_players ENABLE ROW LEVEL SECURITY;

-- Anyone can view pools
DROP POLICY IF EXISTS "pools_select_public" ON public.pools;
CREATE POLICY "pools_select_public"
  ON public.pools
  FOR SELECT
  USING (true);

-- Admin/Root can manage pools
DROP POLICY IF EXISTS "pools_manage_admin_root" ON public.pools;
CREATE POLICY "pools_manage_admin_root"
  ON public.pools
  FOR ALL
  USING (
    public.is_root(auth.uid())
    OR public.is_admin(auth.uid(), tournament_id)
  );

-- Anyone can view pool players
DROP POLICY IF EXISTS "pool_players_select_public" ON public.pool_players;
CREATE POLICY "pool_players_select_public"
  ON public.pool_players
  FOR SELECT
  USING (true);

-- Admin/Root can manage pool players
DROP POLICY IF EXISTS "pool_players_manage_admin_root" ON public.pool_players;
CREATE POLICY "pool_players_manage_admin_root"
  ON public.pool_players
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = pool_id
      AND (
        public.is_root(auth.uid())
        OR public.is_admin(auth.uid(), p.tournament_id)
      )
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.pools IS 'Tournament pools/groups for round-robin play before knockout rounds';
COMMENT ON TABLE public.pool_players IS 'Junction table mapping players/teams to pools with standings';
COMMENT ON COLUMN public.matches.pool_id IS 'References pool for pool-stage matches (NULL for knockout matches)';
COMMENT ON COLUMN public.matches.match_type IS 'Distinguishes pool matches from knockout matches';

