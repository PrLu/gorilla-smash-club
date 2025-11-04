-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('singles', 'doubles', 'mixed')),
  entry_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled')),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  rating TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Teams table (for doubles)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player1_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (player_id IS NOT NULL AND team_id IS NULL) OR
    (player_id IS NULL AND team_id IS NOT NULL)
  )
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  bracket_pos INTEGER NOT NULL,
  player1_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  team1_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  score1 INTEGER,
  score2 INTEGER,
  winner_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  next_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  court TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table (optional)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tournaments_organizer ON public.tournaments(organizer_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_players_profile ON public.players(profile_id);
CREATE INDEX idx_teams_tournament ON public.teams(tournament_id);
CREATE INDEX idx_registrations_tournament ON public.registrations(tournament_id);
CREATE INDEX idx_registrations_player ON public.registrations(player_id);
CREATE INDEX idx_registrations_team ON public.registrations(team_id);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_payments_registration ON public.payments(registration_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tournaments: public read, organizer write
CREATE POLICY "Anyone can view open tournaments" ON public.tournaments
  FOR SELECT USING (status IN ('open', 'closed', 'in_progress', 'completed') OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their tournaments" ON public.tournaments
  FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their tournaments" ON public.tournaments
  FOR DELETE USING (auth.uid() = organizer_id);

-- Players: public read, owner write
CREATE POLICY "Anyone can view players" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Users can create their player profile" ON public.players
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their player profile" ON public.players
  FOR UPDATE USING (auth.uid() = profile_id);

-- Teams: public read, member write
CREATE POLICY "Anyone can view teams" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Players can create teams" ON public.teams
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.players WHERE id = player1_id AND profile_id = auth.uid())
  );

CREATE POLICY "Team members can update teams" ON public.teams
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.players WHERE (id = player1_id OR id = player2_id) AND profile_id = auth.uid())
  );

-- Registrations: public read, participant write
CREATE POLICY "Anyone can view registrations" ON public.registrations
  FOR SELECT USING (true);

CREATE POLICY "Users can register" ON public.registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their registrations" ON public.registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = registrations.player_id AND p.profile_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.players p ON (p.id = t.player1_id OR p.id = t.player2_id)
      WHERE t.id = registrations.team_id AND p.profile_id = auth.uid()
    )
  );

-- Matches: public read, organizer write
CREATE POLICY "Anyone can view matches" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Organizers can create matches" ON public.matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = matches.tournament_id AND t.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update matches" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = matches.tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- Payments: user read own, system write
CREATE POLICY "Users can view their payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      JOIN public.players p ON p.id = r.player_id
      WHERE r.id = payments.registration_id AND p.profile_id = auth.uid()
    )
  );

-- Enable Realtime (must be done AFTER tables are created)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
