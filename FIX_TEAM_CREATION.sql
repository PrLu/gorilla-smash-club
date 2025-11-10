-- Create teams for doubles registrations (FIXED VERSION)
-- Handles the constraint: registrations must have EITHER player_id OR team_id, not both

DO $$
DECLARE
  v_reg RECORD;
  v_partner_player_id UUID;
  v_team_id UUID;
  v_team_name TEXT;
  v_partner_name TEXT;
BEGIN
  -- Loop through doubles registrations without teams
  FOR v_reg IN
    SELECT 
      r.id as reg_id,
      r.player_id,
      r.metadata,
      p.first_name,
      p.last_name,
      p.first_name || ' ' || p.last_name as player_name
    FROM registrations r
    JOIN players p ON r.player_id = p.id
    WHERE r.tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
      AND r.metadata->>'category' = 'doubles'
      AND r.team_id IS NULL
      AND r.status = 'confirmed'
    ORDER BY r.created_at
  LOOP
    -- Find partner by email
    v_partner_player_id := NULL;
    v_partner_name := v_reg.metadata->>'partner_display_name';
    
    IF v_reg.metadata->>'partner_email' IS NOT NULL THEN
      -- Try to find partner by email
      SELECT pl.id INTO v_partner_player_id
      FROM players pl
      JOIN profiles pf ON pl.profile_id = pf.id
      WHERE LOWER(pf.email) = LOWER(v_reg.metadata->>'partner_email')
      LIMIT 1;
      
      -- If found, get actual name
      IF v_partner_player_id IS NOT NULL THEN
        SELECT first_name || ' ' || last_name INTO v_partner_name
        FROM players WHERE id = v_partner_player_id;
      END IF;
    END IF;

    -- Create team name
    v_team_name := v_reg.player_name || ' & ';
    IF v_partner_player_id IS NOT NULL THEN
      v_team_name := v_team_name || v_partner_name;
    ELSE
      v_team_name := v_team_name || COALESCE(v_partner_name, 'Partner');
    END IF;

    -- Check if team already exists
    SELECT id INTO v_team_id
    FROM teams
    WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
      AND (
        (player1_id = v_reg.player_id AND player2_id = v_partner_player_id)
        OR
        (player1_id = v_partner_player_id AND player2_id = v_reg.player_id)
      );

    IF v_team_id IS NULL THEN
      -- Create new team
      INSERT INTO teams (
        tournament_id,
        name,
        player1_id,
        player2_id
      ) VALUES (
        'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'::uuid,
        v_team_name,
        v_reg.player_id,
        v_partner_player_id
      )
      RETURNING id INTO v_team_id;
      
      RAISE NOTICE 'Created team: % (ID: %)', v_team_name, v_team_id;
    END IF;

    -- Update registration: set team_id AND clear player_id (constraint requirement)
    UPDATE registrations 
    SET team_id = v_team_id,
        player_id = NULL  -- CRITICAL: Must clear player_id when setting team_id
    WHERE id = v_reg.reg_id;
    
    RAISE NOTICE 'Updated registration % to use team %', v_reg.reg_id, v_team_id;

    -- Also update partner's registration if found
    IF v_partner_player_id IS NOT NULL THEN
      UPDATE registrations
      SET team_id = v_team_id,
          player_id = NULL  -- CRITICAL: Must clear player_id
      WHERE tournament_id = 'b2012f68-a1ad-4d0c-9208-bbdb1e3cd852'
        AND player_id = v_partner_player_id
        AND metadata->>'category' = 'doubles'
        AND team_id IS NULL;
      
      RAISE NOTICE 'Updated partner registration to use team %', v_team_id;
    END IF;

  END LOOP;
  
  RAISE NOTICE '✅ Team creation complete!';
END $$;




