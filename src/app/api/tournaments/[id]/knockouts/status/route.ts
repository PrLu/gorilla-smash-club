import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/tournaments/[id]/knockouts/status
 * Check pool completion status and knockout generation status for each category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Get all pools for this tournament
    const { data: pools, error: poolsError } = await supabaseAdmin
      .from('pools')
      .select('id, name, category, advance_count, status')
      .eq('tournament_id', tournamentId);

    if (poolsError) throw poolsError;

    if (!pools || pools.length === 0) {
      return NextResponse.json({ 
        categoryStatus: [],
        message: 'No pools found for this tournament'
      });
    }

    // Group pools by category
    const poolsByCategory: { [key: string]: any[] } = {};
    pools.forEach(pool => {
      const category = pool.category || 'SINGLES';
      if (!poolsByCategory[category]) {
        poolsByCategory[category] = [];
      }
      poolsByCategory[category].push(pool);
    });

    // Check status for each category
    const categoryStatus = await Promise.all(
      Object.entries(poolsByCategory).map(async ([category, categoryPools]) => {
        // Check if all pools in this category are complete
        const allPoolsComplete = categoryPools.every(pool => pool.status === 'completed');
        
        // If not all marked as completed, check if all matches are done
        let poolsComplete = allPoolsComplete;
        if (!allPoolsComplete) {
          // Check if all pool matches for this category are completed
          const poolIds = categoryPools.map(p => p.id);
          const { data: poolMatches } = await supabaseAdmin
            .from('matches')
            .select('id, status')
            .eq('match_type', 'pool')
            .in('pool_id', poolIds);

          if (poolMatches && poolMatches.length > 0) {
            poolsComplete = poolMatches.every(m => m.status === 'completed');
          }
        }

        // Count total qualifiers (sum of advance_count from all pools)
        const qualifierCount = categoryPools.reduce((sum, pool) => sum + (pool.advance_count || 0), 0);

        // Check if knockout fixtures already exist for this category
        const { data: knockoutMatches } = await supabaseAdmin
          .from('matches')
          .select('id')
          .eq('tournament_id', tournamentId)
          .eq('match_type', 'knockout')
          .ilike('court', `${category}%`)
          .limit(1);

        const knockoutsGenerated = (knockoutMatches && knockoutMatches.length > 0) || false;

        return {
          category,
          poolsComplete,
          knockoutsGenerated,
          qualifierCount,
          totalPools: categoryPools.length,
        };
      })
    );

    return NextResponse.json({ 
      categoryStatus,
      totalCategories: Object.keys(poolsByCategory).length
    });

  } catch (error: any) {
    console.error('Knockout status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get knockout status' },
      { status: 500 }
    );
  }
}




