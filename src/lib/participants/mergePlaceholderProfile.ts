import { createClient } from '@supabase/supabase-js';

/**
 * Merge placeholder profile into real profile
 * Transfers all registrations, player records, and related data from placeholder to real profile
 * 
 * @param placeholderProfileId - UUID of placeholder profile
 * @param realProfileId - UUID of real authenticated profile
 * @returns Success status and merged record counts
 */
export async function mergePlaceholderProfile(
  placeholderProfileId: string,
  realProfileId: string
): Promise<{ success: boolean; merged: { players: number; registrations: number }; error?: string }> {
  
  // Must use service role for this operation
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    // Verify placeholder profile exists and is actually a placeholder
    const { data: placeholderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_placeholder, email')
      .eq('id', placeholderProfileId)
      .single();

    if (profileError || !placeholderProfile) {
      return { success: false, merged: { players: 0, registrations: 0 }, error: 'Placeholder profile not found' };
    }

    if (!placeholderProfile.is_placeholder) {
      return { success: false, merged: { players: 0, registrations: 0 }, error: 'Profile is not a placeholder' };
    }

    // Get or create player record for real profile
    let { data: realPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('profile_id', realProfileId)
      .single();

    // If real profile doesn't have a player record, get one from placeholder
    if (!realPlayer) {
      const { data: placeholderPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('profile_id', placeholderProfileId)
        .single();

      if (placeholderPlayer) {
        // Update placeholder player to point to real profile
        await supabase
          .from('players')
          .update({ profile_id: realProfileId })
          .eq('id', placeholderPlayer.id);

        realPlayer = placeholderPlayer;
      }
    }

    // Transfer all registrations from placeholder player to real player
    const { data: placeholderPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('profile_id', placeholderProfileId);

    let registrationsUpdated = 0;

    if (placeholderPlayers && placeholderPlayers.length > 0 && realPlayer) {
      for (const pp of placeholderPlayers) {
        const { error: regError } = await supabase
          .from('registrations')
          .update({ player_id: realPlayer.id })
          .eq('player_id', pp.id);

        if (!regError) registrationsUpdated++;
      }
    }

    // Delete old placeholder player records (except the one we transferred)
    await supabase
      .from('players')
      .delete()
      .eq('profile_id', placeholderProfileId)
      .neq('id', realPlayer?.id || '');

    // Delete placeholder profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', placeholderProfileId);

    return {
      success: true,
      merged: {
        players: placeholderPlayers?.length || 0,
        registrations: registrationsUpdated,
      },
    };
  } catch (error: any) {
    console.error('Merge error:', error);
    return {
      success: false,
      merged: { players: 0, registrations: 0 },
      error: error.message || 'Failed to merge profiles',
    };
  }
}

