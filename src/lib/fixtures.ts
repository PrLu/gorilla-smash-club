/**
 * Tournament Fixtures Generator
 * Deterministic single-elimination bracket generation with bye handling
 */

export interface FixtureMatch {
  tournament_id: string;
  round: number;
  bracket_pos: number;
  player1_id?: string | null;
  player2_id?: string | null;
  team1_id?: string | null;
  team2_id?: string | null;
  next_match_pos?: number;
  status: 'pending' | 'in_progress' | 'completed';
  winner_player_id?: string | null;
  winner_team_id?: string | null;
}

export interface GenerateFixturesOptions {
  seed?: 'registered' | 'random';
}

/**
 * Generate single elimination fixtures
 * Pads participants to nearest power of 2 and creates complete bracket structure
 * 
 * @param participants - Array of player or team IDs
 * @param tournamentId - Tournament UUID
 * @param options - Generation options (seeding strategy)
 * @returns Array of fixture matches ready for DB insertion
 */
export function generateSingleElimFixtures(
  participants: string[],
  tournamentId: string,
  options: GenerateFixturesOptions = {}
): FixtureMatch[] {
  if (participants.length < 2) {
    throw new Error('At least 2 participants required to generate fixtures');
  }

  // Apply seeding
  let seededParticipants = [...participants];
  if (options.seed === 'random') {
    seededParticipants = shuffleArray(seededParticipants);
  }

  // Calculate bracket size (nearest power of 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  const totalRounds = Math.log2(bracketSize);
  const byesNeeded = bracketSize - participants.length;

  // Pad with null for byes
  const paddedParticipants: (string | null)[] = [...seededParticipants];
  for (let i = 0; i < byesNeeded; i++) {
    paddedParticipants.push(null);
  }

  const matches: FixtureMatch[] = [];
  let globalMatchPos = 0;

  // Generate Round 1
  const round1Matches: FixtureMatch[] = [];
  for (let i = 0; i < paddedParticipants.length; i += 2) {
    const p1 = paddedParticipants[i];
    const p2 = paddedParticipants[i + 1];

    // Skip if both are byes (shouldn't happen with proper padding)
    if (p1 === null && p2 === null) continue;

    round1Matches.push({
      tournament_id: tournamentId,
      round: 1,
      bracket_pos: globalMatchPos++,
      player1_id: p1,
      player2_id: p2,
      status: p1 === null || p2 === null ? 'completed' : 'pending',
      // If one is null (bye), set winner immediately
      winner_player_id: p1 === null ? p2 : p2 === null ? p1 : null,
    });
  }

  matches.push(...round1Matches);

  // Generate subsequent rounds (placeholder matches)
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round);
    
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        tournament_id: tournamentId,
        round,
        bracket_pos: globalMatchPos++,
        player1_id: null,
        player2_id: null,
        status: 'pending',
      });
    }
  }

  // Link matches to next round (calculate next_match_pos)
  matches.forEach((match, idx) => {
    if (match.round < totalRounds) {
      // Calculate which match in the next round this winner advances to
      const matchesBeforeThisRound = matches.filter((m) => m.round < match.round).length;
      const positionInRound = match.bracket_pos - matchesBeforeThisRound;
      const nextRoundMatchIndex = Math.floor(positionInRound / 2);
      const matchesBeforeNextRound = matches.filter((m) => m.round < match.round + 1).length;
      match.next_match_pos = matchesBeforeNextRound + nextRoundMatchIndex;
    }
  });

  return matches;
}

/**
 * Determine which slot (player1 or player2) the winner should fill in next match
 * @param currentMatchIndex - Index of current match in round
 * @returns 'player1' or 'player2'
 */
export function getNextMatchSlot(currentMatchIndex: number): 'player1' | 'player2' {
  // First match of each pair goes to player1, second to player2
  return currentMatchIndex % 2 === 0 ? 'player1' : 'player2';
}

/**
 * Map match position to next round slot
 * @param matches - Array of all fixtures
 * @param currentMatchPos - Current match bracket_pos
 * @returns Object with next match position and slot
 */
export function mapPlayerToNextMatch(
  matches: FixtureMatch[],
  currentMatchPos: number
): { nextMatchPos: number; slot: 'player1' | 'player2' } | null {
  const currentMatch = matches.find((m) => m.bracket_pos === currentMatchPos);
  
  if (!currentMatch || currentMatch.next_match_pos === undefined) {
    return null;
  }

  // Determine slot based on position in round
  const matchesInSameRound = matches.filter((m) => m.round === currentMatch.round);
  const indexInRound = matchesInSameRound.findIndex((m) => m.bracket_pos === currentMatchPos);
  const slot = getNextMatchSlot(indexInRound);

  return {
    nextMatchPos: currentMatch.next_match_pos,
    slot,
  };
}

/**
 * Fisher-Yates shuffle for random seeding
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate fixture structure
 * Ensures all matches are properly linked and no orphans exist
 */
export function validateFixtures(matches: FixtureMatch[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check all matches have tournament_id
  if (matches.some((m) => !m.tournament_id)) {
    errors.push('All matches must have tournament_id');
  }

  // Check round numbers are sequential starting from 1
  const rounds = [...new Set(matches.map((m) => m.round))].sort();
  if (rounds[0] !== 1 || rounds.some((r, i) => r !== i + 1)) {
    errors.push('Rounds must be sequential starting from 1');
  }

  // Check bracket positions are unique
  const positions = matches.map((m) => m.bracket_pos);
  if (new Set(positions).size !== positions.length) {
    errors.push('Bracket positions must be unique');
  }

  // Check next_match_pos references are valid
  matches.forEach((match) => {
    if (match.next_match_pos !== undefined) {
      const nextMatch = matches.find((m) => m.bracket_pos === match.next_match_pos);
      if (!nextMatch) {
        errors.push(`Match ${match.bracket_pos} references invalid next match ${match.next_match_pos}`);
      }
      if (nextMatch && nextMatch.round !== match.round + 1) {
        errors.push(`Match ${match.bracket_pos} next match must be in round ${match.round + 1}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
