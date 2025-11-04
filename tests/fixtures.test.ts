import { describe, it, expect } from 'vitest';
import {
  generateSingleElimFixtures,
  generateDoubleElimFixtures,
  generateRoundRobinFixtures,
} from '../src/lib/fixtures';

describe('Fixtures Generator - Single Elimination', () => {
  it('should throw error for less than 2 participants', () => {
    expect(() => generateSingleElimFixtures([])).toThrow('Need at least 2 participants');
    expect(() => generateSingleElimFixtures(['p1'])).toThrow('Need at least 2 participants');
  });

  it('should generate correct fixtures for 2 participants', () => {
    const result = generateSingleElimFixtures(['p1', 'p2']);

    expect(result.length).toBe(1);
    expect(result[0].round).toBe(1);
    expect(result[0].player1).toBe('p1');
    expect(result[0].player2).toBe('p2');
  });

  it('should generate correct fixtures for 4 participants', () => {
    const result = generateSingleElimFixtures(['p1', 'p2', 'p3', 'p4']);

    // 2 matches in round 1 (semi-finals) + 1 match in round 2 (final) = 3 total
    expect(result.length).toBe(3);

    // Check round 1 matches
    const round1 = result.filter((m) => m.round === 1);
    expect(round1.length).toBe(2);
    expect(round1[0].player1).toBe('p1');
    expect(round1[0].player2).toBe('p2');
    expect(round1[1].player1).toBe('p3');
    expect(round1[1].player2).toBe('p4');

    // Check round 2 (final)
    const round2 = result.filter((m) => m.round === 2);
    expect(round2.length).toBe(1);
  });

  it('should generate correct fixtures for 8 participants', () => {
    const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
    const result = generateSingleElimFixtures(participants);

    // 4 + 2 + 1 = 7 matches
    expect(result.length).toBe(7);

    const round1 = result.filter((m) => m.round === 1);
    const round2 = result.filter((m) => m.round === 2);
    const round3 = result.filter((m) => m.round === 3);

    expect(round1.length).toBe(4);
    expect(round2.length).toBe(2);
    expect(round3.length).toBe(1);
  });

  it('should handle odd number of participants (with byes)', () => {
    const result = generateSingleElimFixtures(['p1', 'p2', 'p3']);

    // Should round up to 4, creating fixtures with some byes
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((m) => m.round === 1)).toBe(true);
  });

  it('should link matches to next round', () => {
    const result = generateSingleElimFixtures(['p1', 'p2', 'p3', 'p4']);

    // First two matches should point to the final
    expect(result[0].nextMatchPos).toBeDefined();
    expect(result[1].nextMatchPos).toBeDefined();
    expect(result[0].nextMatchPos).toBe(result[1].nextMatchPos);

    // Final match should not have next match
    const finalMatch = result.find((m) => m.round === 2);
    expect(finalMatch?.nextMatchPos).toBeUndefined();
  });
});

describe('Fixtures Generator - Double Elimination', () => {
  it('should generate fixtures (stub)', () => {
    const participants = ['p1', 'p2', 'p3', 'p4'];
    const result = generateDoubleElimFixtures(participants);

    // Currently returns single elimination
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Fixtures Generator - Round Robin', () => {
  it('should generate round robin fixtures', () => {
    const participants = ['p1', 'p2', 'p3'];
    const result = generateRoundRobinFixtures(participants);

    // 3 participants = 3 matches (1-2, 1-3, 2-3)
    expect(result.length).toBe(3);
  });

  it('should generate correct number of matches', () => {
    const participants = ['p1', 'p2', 'p3', 'p4'];
    const result = generateRoundRobinFixtures(participants);

    // 4 participants = 6 matches (n*(n-1)/2)
    expect(result.length).toBe(6);
  });
});
