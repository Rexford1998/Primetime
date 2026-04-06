import { supabase } from './supabase-multiplayer';

export interface AuthUser {
  id: string;
  email: string;
  playerName: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  playerName: string
): Promise<AuthResponse> {
  try {
    if (!email || !password || !playerName) {
      return {
        success: false,
        error: 'Email, password, and player name are required',
      };
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('game_players')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
    }

    if (existingUser) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          player_name: playerName,
        },
      },
    });

    if (authError) {
      console.error('Auth sign up error:', authError);
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user',
      };
    }

    // Create player profile
    const { error: profileError } = await supabase
      .from('game_players')
      .upsert({
        player_id: authData.user.id,
        player_name: playerName,
        email: email.toLowerCase(),
        auth_user_id: authData.user.id,
      });

    if (profileError) {
      console.error('Error creating player profile:', profileError);
      // Auth user was created, but profile failed. This is okay.
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        playerName,
      },
    };
  } catch (error) {
    console.error('Unexpected sign up error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required',
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError) {
      console.error('Auth sign in error:', authError);
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to sign in',
      };
    }

    // Get player profile
    const { data: playerData, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (playerError) {
      console.error('Error fetching player profile:', playerError);
    }

    const playerName = playerData?.player_name || authData.user.user_metadata?.player_name || '';

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        playerName,
      },
    };
  } catch (error) {
    console.error('Unexpected sign in error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return null;
    }

    const user = sessionData.session.user;

    // Get player profile
    const { data: playerData, error: playerError } = await supabase
      .from('game_players')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (playerError) {
      console.error('Error fetching player profile:', playerError);
    }

    // If no profile, create one on the fly
    let playerName = playerData?.player_name || user.user_metadata?.player_name || '';
    if (!playerData) {
      const fallbackName = playerName || (user.email ? user.email.split('@')[0] : 'Player');
      const { error: upsertError } = await supabase.from('game_players').upsert({
        player_id: user.id,
        auth_user_id: user.id,
        email: user.email?.toLowerCase() || null,
        player_name: fallbackName,
      });
      if (upsertError) {
        console.error('Error creating player profile:', upsertError);
      } else {
        playerName = fallbackName;
      }
    }

    if (!playerName && user.email) {
      playerName = user.email.split('@')[0];
    }

    return {
      id: user.id,
      email: user.email || '',
      playerName,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Update player profile stats
 */
export async function updatePlayerStats(
  userId: string,
  stats: {
    games_played?: number;
    wins?: number;
    losses?: number;
    win_streak?: number;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_players')
      .update({
        stats,
      })
      .eq('auth_user_id', userId);

    if (error) {
      console.error('Error updating player stats:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error updating stats:', error);
    return false;
  }
}

/**
 * Check if email is available
 */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('game_players')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email:', error);
      return false;
    }

    return !data;
  } catch (error) {
    console.error('Unexpected error checking email:', error);
    return false;
  }
}
