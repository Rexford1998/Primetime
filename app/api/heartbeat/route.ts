import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-multiplayer';

/**
 * POST /api/heartbeat
 * Updates player's last seen timestamp and online status
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, isOnline } = await request.json();

    if (!userId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or sessionId' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update game session with player heartbeat
    const { data: session, error: fetchError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Determine which player this is and update their heartbeat
    let updateData: any = { updated_at: now };

    if (session.player_1_id === userId) {
      updateData.player_1_last_heartbeat = now;
      updateData.player_1_connected = isOnline !== false;
    } else if (session.player_2_id === userId) {
      updateData.player_2_last_heartbeat = now;
      updateData.player_2_connected = isOnline !== false;
    }

    const { error: updateError } = await supabase
      .from('game_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating heartbeat:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update heartbeat' },
        { status: 500 }
      );
    }

    // Also update player profile last_seen
    const { error: playerError } = await supabase
      .from('game_players')
      .update({ last_seen_at: now })
      .eq('player_id', userId);

    if (playerError) {
      console.warn('Could not update player last_seen:', playerError);
      // Don't fail the request for this
    }

    return NextResponse.json({
      success: true,
      message: 'Heartbeat received',
      timestamp: now,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
