/**
 * TEST COMPONENT - Add this temporarily to your tournament page to debug
 * 
 * Usage:
 * 1. Import this in src/app/tournament/[id]/page.tsx
 * 2. Add <TeamDisplayTest matches={matches || []} /> below your existing content
 * 3. Check browser console for output
 * 4. Check page for rendered output
 */

'use client';

import { Match, getParticipantName } from '@/lib/hooks/useMatches';

interface TeamDisplayTestProps {
  matches: Match[];
}

export function TeamDisplayTest({ matches }: TeamDisplayTestProps) {
  // Filter to only doubles/mixed matches (those with teams)
  const teamMatches = matches.filter(m => m.team1_id || m.team2_id);

  console.log('=== TEAM DISPLAY DEBUG ===');
  console.log('Total matches:', matches.length);
  console.log('Team matches:', teamMatches.length);

  if (teamMatches.length > 0) {
    const firstTeamMatch = teamMatches[0];
    console.log('First team match:', firstTeamMatch);
    console.log('Team 1 data:', firstTeamMatch.team1);
    console.log('Team 2 data:', firstTeamMatch.team2);
    
    // Test the helper function
    const team1Name = getParticipantName(firstTeamMatch, 1);
    const team2Name = getParticipantName(firstTeamMatch, 2);
    console.log('Team 1 formatted:', team1Name);
    console.log('Team 2 formatted:', team2Name);
  }

  return (
    <div className="mt-8 p-6 border-4 border-red-500 bg-yellow-50 rounded-lg">
      <h2 className="text-2xl font-bold text-red-600 mb-4">🔍 DEBUG: Team Display Test</h2>
      
      <div className="space-y-4">
        <div>
          <strong>Total Matches:</strong> {matches.length}
        </div>
        
        <div>
          <strong>Team Matches:</strong> {teamMatches.length}
        </div>

        {teamMatches.length > 0 && (
          <>
            <div className="border-t pt-4 mt-4">
              <h3 className="font-bold mb-2">First Team Match Test:</h3>
              
              <div className="space-y-2 bg-white p-4 rounded">
                <div>
                  <strong>Match ID:</strong> {teamMatches[0].id}
                </div>
                
                <div>
                  <strong>Team 1 ID:</strong> {teamMatches[0].team1_id || 'None'}
                </div>
                
                <div>
                  <strong>Team 1 Data:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(teamMatches[0].team1, null, 2)}
                  </pre>
                </div>

                <div>
                  <strong>Team 1 Formatted Name:</strong>
                  <div className="text-lg font-bold text-green-600">
                    {getParticipantName(teamMatches[0], 1)}
                  </div>
                </div>

                <div className="border-t pt-2 mt-2">
                  <strong>Team 2 ID:</strong> {teamMatches[0].team2_id || 'None'}
                </div>
                
                <div>
                  <strong>Team 2 Data:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(teamMatches[0].team2, null, 2)}
                  </pre>
                </div>

                <div>
                  <strong>Team 2 Formatted Name:</strong>
                  <div className="text-lg font-bold text-green-600">
                    {getParticipantName(teamMatches[0], 2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-bold mb-2">All Team Matches:</h3>
              <div className="space-y-2">
                {teamMatches.slice(0, 5).map((match) => (
                  <div key={match.id} className="bg-white p-3 rounded border">
                    <div className="font-semibold">
                      {getParticipantName(match, 1)}
                    </div>
                    <div className="text-gray-600 text-sm">vs</div>
                    <div className="font-semibold">
                      {getParticipantName(match, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {teamMatches.length === 0 && (
          <div className="text-orange-600 font-bold">
            ⚠️ No team matches found. This might be a singles-only tournament.
          </div>
        )}

        <div className="border-t pt-4 mt-4 text-sm text-gray-600">
          <p>✅ Check browser console (F12) for detailed logs</p>
          <p>✅ If you see "Partner & Partner" or single names, the team data is missing</p>
          <p>✅ Expected format: "Player1 & Player2"</p>
        </div>
      </div>
    </div>
  );
}




