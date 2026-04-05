import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-multiplayer';

/**
 * POST /api/validate-turn
 * Validates that the current player can make a move
 * Returns success if valid turn, error otherwise
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, playerId, timestamp } = await request.json();

    if (!sessionId || !playerId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or playerId' },
        { status: 400 }
      );
    }

    // Fetch the current game session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate that it's this player's turn
    if (session.current_turn_player_id !== playerId) {
      return NextResponse.json(
        { success: false, error: 'Not your turn', currentTurnPlayer: session.current_turn_player_id },
        { status: 403 }
      );
    }

    // Check if too much time has passed since last move (prevent stale moves)
    if (session.last_move_at) {
      const lastMoveTime = new Date(session.last_move_at).getTime();
      const moveTime = timestamp ? new Date(timestamp).getTime() : Date.now();
      const timeSinceLastMove = moveTime - lastMoveTime;

      // Allow moves within 30 seconds of last move (reasonable for network latency)
      if (timeSinceLastMove > 30000) {
        console.warn(
          `Move rejected: too old. Last move: ${lastMoveTime}, Move time: ${moveTime}, Diff: ${timeSinceLastMove}ms`
        );
        return NextResponse.json(
          { success: false, error: 'Move is too old, game state may have changed' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Turn validated',
      sessionId,
      playerId,
    });
  } catch (error) {
    console.error('Turn validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
