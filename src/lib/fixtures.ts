/**
 * Tournament Fixtures Generator
 * Creates fixture structures for tournaments (single elimination, double elimination, round robin)
 */

export interface FixtureMatch {
  round: number;
  bracket_pos: number;
  player1?: string;
  player2?: string;
  nextMatchPos?: number;
}

/**
 * Generate single elimination fixtures
 * @param participants - Array of participant IDs (player or team IDs)
 * @returns Array of fixture matches with round and position
 */
export function generateSingleElimFixtures(participants: string[]): FixtureMatch[] {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants for fixtures');
  }

  // Round up to nearest power of 2
  const fixtureSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  const totalRounds = Math.log2(fixtureSize);

  // Pad with byes if needed
  const seeded = [...participants];
  while (seeded.length < fixtureSize) {
    seeded.push('BYE');
  }

  const matches: FixtureMatch[] = [];
  let matchPos = 0;

  // Generate first round
  for (let i = 0; i < seeded.length; i += 2) {
    const p1 = seeded[i];
    const p2 = seeded[i + 1];

    // Skip matches with double BYE
    if (p1 === 'BYE' && p2 === 'BYE') continue;

    // Auto-advance single BYE
    if (p2 === 'BYE' || p1 === 'BYE') {
      // Winner auto-advances, create placeholder for next round
      continue;
    }

    matches.push({
      round: 1,
      bracket_pos: matchPos++,
      player1: p1,
      player2: p2,
    });
  }

  // Generate subsequent rounds (empty placeholders)
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round,
        bracket_pos: matchPos++,
      });
    }
  }

  // Link matches to next round (winner destination)
  matches.forEach((match, idx) => {
    if (match.round < totalRounds) {
      // Calculate next match position
      const matchesBeforeThisRound = matches.filter((m) => m.round < match.round).length;
      const positionInRound = match.bracket_pos - matchesBeforeThisRound;
      const nextMatchPositionInNextRound = Math.floor(positionInRound / 2);
      const matchesBeforeNextRound = matches.filter((m) => m.round < match.round + 1).length;
      match.nextMatchPos = matchesBeforeNextRound + nextMatchPositionInNextRound;
    }
  });

  return matches;
}

/**
 * Generate double elimination fixtures (stub for future implementation)
 * @param participants - Array of participant IDs
 * @returns Array of fixture matches
 */
export function generateDoubleElimFixtures(participants: string[]): FixtureMatch[] {
  console.warn('Double elimination fixtures not yet implemented, using single elimination');
  return generateSingleElimFixtures(participants);
}

/**
 * Generate round robin fixtures
 * @param participants - Array of participant IDs
 * @returns Array of fixture matches where everyone plays everyone
 */
export function generateRoundRobinFixtures(participants: string[]): FixtureMatch[] {
  const matches: FixtureMatch[] = [];
  let matchPos = 0;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        round: 1,
        bracket_pos: matchPos++,
        player1: participants[i],
        player2: participants[j],
      });
    }
  }

  return matches;
}
