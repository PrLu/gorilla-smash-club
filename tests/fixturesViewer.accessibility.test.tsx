import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FixturesViewer } from '@/components/FixturesViewer';

/**
 * Accessibility tests for FixturesViewer component
 * Tests keyboard navigation, ARIA attributes, and screen reader compatibility
 */

const mockMatches = [
  {
    id: '1',
    tournament_id: 'tournament-1',
    round: 1,
    bracket_pos: 0,
    player1_id: 'p1',
    player2_id: 'p2',
    team1_id: null,
    team2_id: null,
    score1: 11,
    score2: 9,
    winner_player_id: 'p1',
    winner_team_id: null,
    status: 'completed' as const,
    next_match_id: null,
    scheduled_at: new Date().toISOString(),
    court: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    tournament_id: 'tournament-1',
    round: 1,
    bracket_pos: 1,
    player1_id: 'p3',
    player2_id: 'p4',
    team1_id: null,
    team2_id: null,
    score1: null,
    score2: null,
    winner_player_id: null,
    winner_team_id: null,
    status: 'pending' as const,
    next_match_id: null,
    scheduled_at: new Date().toISOString(),
    court: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('FixturesViewer - Accessibility', () => {
  it('renders without accessibility violations (basic)', () => {
    const { container } = render(<FixturesViewer matches={mockMatches} />);
    
    // Check for proper role attributes
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('has accessible match cards with aria-labels', () => {
    render(<FixturesViewer matches={mockMatches} />);
    
    const matchCard = screen.getByRole('button', { name: /Match 1/ });
    expect(matchCard).toBeInTheDocument();
    expect(matchCard).toHaveAttribute('aria-label');
  });

  it('shows empty state with descriptive text', () => {
    render(<FixturesViewer matches={[]} />);
    
    expect(screen.getByText(/No fixtures generated yet/i)).toBeInTheDocument();
  });

  it('match cards are keyboard accessible', () => {
    render(<FixturesViewer matches={mockMatches} />);
    
    const matchCards = screen.getAllByRole('button');
    matchCards.forEach(card => {
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  it('uses semantic HTML structure', () => {
    const { container } = render(<FixturesViewer matches={mockMatches} />);
    
    // Should not have divs as interactive elements
    const divButtons = container.querySelectorAll('div[role="button"]');
    expect(divButtons.length).toBe(0); // All buttons should be <button> elements
  });

  it('provides clear status indicators', () => {
    render(<FixturesViewer matches={mockMatches} />);
    
    // Completed match should show "Final"
    expect(screen.getByText(/Final/i)).toBeInTheDocument();
  });
});

/**
 * TODO: For full accessibility testing, install jest-axe:
 * 
 * import { axe, toHaveNoViolations } from 'jest-axe';
 * expect.extend(toHaveNoViolations);
 * 
 * it('should not have accessibility violations', async () => {
 *   const { container } = render(<FixturesViewer matches={mockMatches} />);
 *   const results = await axe(container);
 *   expect(results).toHaveNoViolations();
 * });
 */

