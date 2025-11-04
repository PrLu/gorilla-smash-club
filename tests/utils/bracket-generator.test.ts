import { describe, it, expect } from 'vitest';
import {
  generateSingleEliminationBracket,
  generateDoubleEliminationBracket,
  generateRoundRobinBracket,
  scheduleMatches,
} from '@/lib/utils/bracket-generator';

describe('Bracket Generator', () => {
  describe('generateSingleEliminationBracket', () => {
    it('should generate bracket for 2 participants', () => {
      const participants = ['player1', 'player2'];
      const result = generateSingleEliminationBracket(participants);

      expect(result.matches.length).toBe(1);
      expect(result.rounds).toBe(1);
      expect(result.matches[0].round).toBe(1);
      expect(result.matches[0].matchNumber).toBe(1);
    });

    it('should generate bracket for 4 participants', () => {
      const participants = ['player1', 'player2', 'player3', 'player4'];
      const result = generateSingleEliminationBracket(participants);

      expect(result.matches.length).toBe(3); // 2 semi-finals + 1 final
      expect(result.rounds).toBe(2);
    });

    it('should generate bracket for odd number of participants', () => {
      const participants = ['player1', 'player2', 'player3'];
      const result = generateSingleEliminationBracket(participants);

      // Should round up to 4 (power of 2)
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should throw error for less than 2 participants', () => {
      expect(() => generateSingleEliminationBracket(['player1'])).toThrow();
      expect(() => generateSingleEliminationBracket([])).toThrow();
    });
  });

  describe('generateDoubleEliminationBracket', () => {
    it('should generate bracket (stub)', () => {
      const participants = ['player1', 'player2', 'player3', 'player4'];
      const result = generateDoubleEliminationBracket(participants);

      // Currently returns single elimination
      expect(result.matches.length).toBeGreaterThan(0);
    });
  });

  describe('generateRoundRobinBracket', () => {
    it('should generate round robin bracket', () => {
      const participants = ['player1', 'player2', 'player3'];
      const result = generateRoundRobinBracket(participants);

      // 3 participants = 3 matches (1-2, 1-3, 2-3)
      expect(result.matches.length).toBe(3);
      expect(result.rounds).toBe(1);
    });

    it('should generate correct number of matches for n participants', () => {
      const participants = ['p1', 'p2', 'p3', 'p4'];
      const result = generateRoundRobinBracket(participants);

      // 4 participants = 6 matches (n*(n-1)/2)
      expect(result.matches.length).toBe(6);
    });
  });

  describe('scheduleMatches', () => {
    it('should schedule matches across courts', () => {
      const matches = [
        { round: 1, matchNumber: 1, status: 'scheduled' as const },
        { round: 1, matchNumber: 2, status: 'scheduled' as const },
        { round: 2, matchNumber: 1, status: 'scheduled' as const },
      ];

      const startDate = new Date('2024-01-01T09:00:00');
      const endDate = new Date('2024-01-01T18:00:00');
      const courts = ['Court 1', 'Court 2'];

      const scheduled = scheduleMatches(matches, startDate, endDate, courts, 60);

      expect(scheduled.length).toBe(matches.length);
      expect(scheduled[0].scheduled_at).toBeDefined();
      expect(scheduled[0].court).toBeDefined();
    });

    it('should throw error if no courts provided', () => {
      const matches = [{ round: 1, matchNumber: 1, status: 'scheduled' as const }];
      const startDate = new Date('2024-01-01T09:00:00');
      const endDate = new Date('2024-01-01T18:00:00');

      expect(() => scheduleMatches(matches, startDate, endDate, [])).toThrow();
    });
  });
});


