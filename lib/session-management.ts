import { supabase } from './supabase-multiplayer';

export interface PlayerSession {
  id: string;
  userId: string;
  playerName: string;
  sessionId: string;
  joinedAt: string;
  lastHeartbeat: string;
  isOnline: boolean;
}

/**
 * Create or update a player's active session
 */
export async function createPlayerSession(
  userId: string,
  playerName: string,
  sessionId: string
): Promise<PlayerSession | null> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('player_game_sessions')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        joined_at: now,
        last_heartbeat: now,
        is_online: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating player session:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      playerName,
      sessionId: data.session_id,
      joinedAt: data.joined_at,
      lastHeartbeat: data.last_heartbeat,
      isOnline: data.is_online,
    };
  } catch (error) {
    console.error('Unexpected error creating player session:', error);
    return null;
  }
}

/**
 * Update player heartbeat to track online status
 */
export async function updatePlayerHeartbeat(userId: string, sessionId: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('player_game_sessions')
      .update({
        last_heartbeat: now,
        is_online: true,
      })
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating heartbeat:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating heartbeat:', error);
    return false;
  }
}

/**
 * Get active games for a player
 */
export async function getPlayerActiveGames(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('active_player_sessions')
      .select('*')
      .or(`player_1_auth_id.eq.${userId},player_2_auth_id.eq.${userId}`)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching active games:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching active games:', error);
    return [];
  }
}

/**
 * Mark player as offline
 */
export async function markPlayerOffline(userId: string, sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('player_game_sessions')
      .update({
        is_online: false,
      })
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error marking player offline:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error marking player offline:', error);
    return false;
  }
}

/**
 * Check if a player session is still valid
 */
export async function isPlayerSessionValid(userId: string, sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('player_game_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error checking player session:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking player session:', error);
    return false;
  }
}

/**
 * Get player's joined games for resumption
 */
export async function getPlayerJoinedGames(userId: string): Promise<any[]> {
  try {
    // Query sessions where this player is player_2 and status is 'waiting' or 'active'
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        player_1:game_players!player_1_id(player_name),
        player_2:game_players!player_2_id(player_name)
      `)
      .or(`player_1_id.eq.${userId},player_2_id.eq.${userId}`)
      .in('status', ['waiting', 'active'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching player games:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching player games:', error);
    return [];
  }
}

/**
 * Check for stale sessions and mark as inactive
 */
export async function cleanupStalePlayerSessions(timeoutMinutes: number = 15): Promise<number> {
  try {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60000).toISOString();

    const { data: staleSessions, error: fetchError } = await supabase
      .from('player_game_sessions')
      .select('*')
      .lt('last_heartbeat', cutoffTime)
      .eq('is_online', true);

    if (fetchError) {
      console.error('Error fetching stale sessions:', fetchError);
      return 0;
    }

    if (!staleSessions || staleSessions.length === 0) {
      return 0;
    }

    const { error: updateError } = await supabase
      .from('player_game_sessions')
      .update({ is_online: false })
      .lt('last_heartbeat', cutoffTime)
      .eq('is_online', true);

    if (updateError) {
      console.error('Error marking sessions offline:', updateError);
      return 0;
    }

    return staleSessions.length;
  } catch (error) {
    console.error('Unexpected error cleaning stale sessions:', error);
    return 0;
  }
}
