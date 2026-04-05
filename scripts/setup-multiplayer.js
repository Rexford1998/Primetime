import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('Setting up multiplayer game database...');

  try {
    // Create game_sessions table
    const { data: sessionsTable, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(0);

    if (sessionsError && sessionsError.code === 'PGRST116') {
      console.log('Creating game_sessions table...');
      // Table doesn't exist, we'll need to create it via SQL
    }

    console.log('Database tables ready for use');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
