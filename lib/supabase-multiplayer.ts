import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateSessionCode(): Promise<string> {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  
  let playerId = localStorage.getItem('game_player_id');
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('game_player_id', playerId);
  }
  return playerId;
}

export interface GameSession {
  id: string;
  game_type: 'multiplication' | 'give-or-take';
  session_code: string;
  player_1_id: string;
  player_2_id: string | null;
  status: 'waiting' | 'active' | 'finished';
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GamePlayer {
  id: string;
  player_id: string;
  player_name: string;
  created_at: string;
}

export interface GameState {
  id: string;
  session_id: string;
  player_id: string;
  game_data: Record<string, any>;
  current_turn: number;
  updated_at: string;
}

export async function createGameSession(
  gameType: 'multiplication' | 'give-or-take',
  playerName: string
): Promise<GameSession | null> {
  const playerId = generatePlayerId();
  const sessionCode = await generateSessionCode();

  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        game_type: gameType,
        session_code: sessionCode,
        player_1_id: playerId,
        player_2_id: null,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) throw error;
    
    // Store player info
    await supabase.from('game_players').insert({
      player_id: playerId,
      player_name: playerName,
    }).select().single();

    return data as GameSession;
  } catch (error) {
    console.error('Error creating game session:', error);
    return null;
  }
}

export async function joinGameSession(
  sessionCode: string,
  playerName: string
): Promise<GameSession | null> {
  const playerId = generatePlayerId();

  try {
    // Find session
    const { data: session, error: findError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single();

    if (findError || !session) {
      console.error('Session not found');
      return null;
    }

    // Update session with second player
    const { data, error: updateError } = await supabase
      .from('game_sessions')
      .update({
        player_2_id: playerId,
        status: 'active',
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Store player info
    await supabase.from('game_players').insert({
      player_id: playerId,
      player_name: playerName,
    }).select().single();

    return data as GameSession;
  } catch (error) {
    console.error('Error joining game session:', error);
    return null;
  }
}

export async function updateGameState(
  sessionId: string,
  playerId: string,
  gameData: Record<string, any>,
  currentTurn: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_states')
      .upsert({
        session_id: sessionId,
        player_id: playerId,
        game_data: gameData,
        current_turn: currentTurn,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id,player_id',
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating game state:', error);
    return false;
  }
}

export async function getGameStates(sessionId: string): Promise<GameState[]> {
  try {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data as GameState[];
  } catch (error) {
    console.error('Error fetching game states:', error);
    return [];
  }
}

export function subscribeToGameState(
  sessionId: string,
  callback: (gameStates: GameState[]) => void
) {
  return supabase
    .from('game_states')
    .on('*', (payload) => {
      if (payload.new && (payload.new as any).session_id === sessionId) {
        getGameStates(sessionId).then(callback);
      }
    })
    .subscribe();
}

export async function getGameSession(sessionCode: string): Promise<GameSession | null> {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single();

    if (error) throw error;
    return data as GameSession;
  } catch (error) {
    console.error('Error fetching game session:', error);
    return null;
  }
}
