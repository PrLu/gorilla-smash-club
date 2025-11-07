-- Migration: Match Scoring System
-- Adds comprehensive scoring support with history and auto-winner determination

-- =============================================================================
-- UPDATE MATCHES TABLE - Add Scoring Fields
-- =============================================================================

DO $$ 
BEGIN
  -- Match format (single set or best of 3)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'match_format'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN match_format TEXT DEFAULT 'single_set' CHECK (match_format IN ('single_set', 'best_of_3', 'best_of_5'));
  END IF;

  -- Set scores (JSONB array of set data)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'set_scores'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN set_scores JSONB DEFAULT '[]';
  END IF;

  -- Score summary (human-readable, e.g., "11-8,9-11,11-7")
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'score_summary'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN score_summary TEXT;
  END IF;

  -- Completed timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- Who entered the score last
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'entered_by'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN entered_by UUID REFERENCES public.profiles(id);
  END IF;

  -- Score history (audit trail)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'score_history'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN score_history JSONB DEFAULT '[]';
  END IF;

  -- Scoring rule (golden point or deuce)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'scoring_rule'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN scoring_rule TEXT DEFAULT 'golden_point' CHECK (scoring_rule IN ('golden_point', 'deuce'));
  END IF;
END $$;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_completed_at ON public.matches(completed_at);
CREATE INDEX IF NOT EXISTS idx_matches_entered_by ON public.matches(entered_by);

-- =============================================================================
-- FUNCTION: Determine Winner from Set Scores
-- =============================================================================

CREATE OR REPLACE FUNCTION public.determine_match_winner(
  set_scores_json JSONB,
  match_format_type TEXT,
  player1_id_val UUID,
  player2_id_val UUID,
  team1_id_val UUID,
  team2_id_val UUID
)
RETURNS UUID AS $$
DECLARE
  sets_won_player1 INTEGER := 0;
  sets_won_player2 INTEGER := 0;
  set_record JSONB;
BEGIN
  -- Count sets won by each player/team
  FOR set_record IN SELECT * FROM jsonb_array_elements(set_scores_json)
  LOOP
    IF (set_record->>'score1')::INTEGER > (set_record->>'score2')::INTEGER THEN
      sets_won_player1 := sets_won_player1 + 1;
    ELSIF (set_record->>'score2')::INTEGER > (set_record->>'score1')::INTEGER THEN
      sets_won_player2 := sets_won_player2 + 1;
    END IF;
  END LOOP;

  -- Determine winner based on format
  IF match_format_type = 'single_set' THEN
    -- Single set: whoever won the one set
    IF sets_won_player1 > sets_won_player2 THEN
      RETURN COALESCE(player1_id_val, team1_id_val);
    ELSE
      RETURN COALESCE(player2_id_val, team2_id_val);
    END IF;
  ELSIF match_format_type IN ('best_of_3', 'best_of_5') THEN
    -- Best of N: whoever won more sets
    IF sets_won_player1 > sets_won_player2 THEN
      RETURN COALESCE(player1_id_val, team1_id_val);
    ELSIF sets_won_player2 > sets_won_player1 THEN
      RETURN COALESCE(player2_id_val, team2_id_val);
    ELSE
      -- Tie - shouldn't happen with proper validation
      RETURN NULL;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- FUNCTION: Auto-Advance Winner to Next Match
-- =============================================================================

CREATE OR REPLACE FUNCTION public.advance_winner_to_next_match()
RETURNS TRIGGER AS $$
DECLARE
  next_match_record RECORD;
  winner_id UUID;
BEGIN
  -- Only proceed if match was just completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get the winner ID (player or team)
    winner_id := COALESCE(NEW.winner_player_id, NEW.winner_team_id);

    -- If there's a next match, update it with the winner
    IF NEW.next_match_id IS NOT NULL AND winner_id IS NOT NULL THEN
      
      -- Find the next match
      SELECT * INTO next_match_record
      FROM public.matches
      WHERE id = NEW.next_match_id;

      -- Determine which slot to fill (player1 or player2)
      -- Logic: if player1 is null, fill it; otherwise fill player2
      IF next_match_record.player1_id IS NULL AND next_match_record.team1_id IS NULL THEN
        -- Fill player1 slot
        IF NEW.winner_player_id IS NOT NULL THEN
          UPDATE public.matches
          SET player1_id = NEW.winner_player_id, updated_at = NOW()
          WHERE id = NEW.next_match_id;
        ELSIF NEW.winner_team_id IS NOT NULL THEN
          UPDATE public.matches
          SET team1_id = NEW.winner_team_id, updated_at = NOW()
          WHERE id = NEW.next_match_id;
        END IF;
      ELSIF next_match_record.player2_id IS NULL AND next_match_record.team2_id IS NULL THEN
        -- Fill player2 slot
        IF NEW.winner_player_id IS NOT NULL THEN
          UPDATE public.matches
          SET player2_id = NEW.winner_player_id, updated_at = NOW()
          WHERE id = NEW.next_match_id;
        ELSIF NEW.winner_team_id IS NOT NULL THEN
          UPDATE public.matches
          SET team2_id = NEW.winner_team_id, updated_at = NOW()
          WHERE id = NEW.next_match_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_advance_winner ON public.matches;
CREATE TRIGGER trigger_advance_winner
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.advance_winner_to_next_match();

-- =============================================================================
-- FUNCTION: Generate Score Summary String
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_score_summary(set_scores_json JSONB)
RETURNS TEXT AS $$
DECLARE
  summary TEXT := '';
  set_record JSONB;
  first BOOLEAN := true;
BEGIN
  FOR set_record IN SELECT * FROM jsonb_array_elements(set_scores_json)
  LOOP
    IF NOT first THEN
      summary := summary || ',';
    END IF;
    summary := summary || (set_record->>'score1') || '-' || (set_record->>'score2');
    first := false;
  END LOOP;
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.matches.match_format IS 'Match format: single_set, best_of_3, or best_of_5';
COMMENT ON COLUMN public.matches.set_scores IS 'Array of set scores: [{set: 1, score1: 11, score2: 8}, ...]';
COMMENT ON COLUMN public.matches.score_summary IS 'Human-readable score like "11-8,9-11,11-7"';
COMMENT ON COLUMN public.matches.completed_at IS 'Timestamp when match was marked completed';
COMMENT ON COLUMN public.matches.entered_by IS 'Profile ID of user who last entered/updated the score';
COMMENT ON COLUMN public.matches.score_history IS 'Audit trail of all score changes with timestamps and editors';
COMMENT ON COLUMN public.matches.scoring_rule IS 'Scoring rule: golden_point (win by 1 at 10-10+) or deuce (win by 2)';

COMMENT ON FUNCTION public.determine_match_winner IS 'Calculates winner from set scores based on match format';
COMMENT ON FUNCTION public.advance_winner_to_next_match IS 'Automatically advances winner to next round match';
COMMENT ON FUNCTION public.generate_score_summary IS 'Creates human-readable score summary from set scores JSON';

