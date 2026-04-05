# Quick Start: New Multiplayer Features

## User Authentication

### Sign Up
```typescript
import { signUp } from '@/lib/auth';

const result = await signUp('user@example.com', 'password123', 'PlayerName');
if (result.success) {
  console.log('User created:', result.user);
}
```

### Sign In
```typescript
import { signIn } from '@/lib/auth';

const result = await signIn('user@example.com', 'password123');
if (result.success) {
  console.log('Signed in as:', result.user);
}
```

### Get Current User
```typescript
import { getCurrentUser } from '@/lib/auth';

const user = await getCurrentUser();
if (user) {
  console.log('Player name:', user.playerName);
}
```

## Session Recovery

### Check for Active Games
```typescript
// Automatically handled by ActiveGamesDialog component
// Shows up in multiplayer mode selector when authenticated
```

### Resume a Game
```typescript
import { getGameSession } from '@/lib/supabase-multiplayer';

const session = await getGameSession(sessionId);
// Session now loaded and ready to play
```

## Multiplayer Features

### Turn Validation
```typescript
import { validateTurn } from '@/lib/supabase-multiplayer';

const { valid, error } = await validateTurn(sessionId, playerId);
if (!valid) {
  console.log('Not your turn:', error);
}
```

### Send Heartbeat
```typescript
import { sendHeartbeat } from '@/lib/supabase-multiplayer';

// Automatically sent every 10 seconds in multiplayer mode
// But can be sent manually:
await sendHeartbeat(userId, sessionId, true); // true = online
```

### Update Turn
```typescript
import { updateCurrentTurn } from '@/lib/supabase-multiplayer';

await updateCurrentTurn(sessionId, nextPlayerId);
```

## React Hooks

### usePlayerProfile Hook
```typescript
import { usePlayerProfile } from '@/hooks/use-player-profile';

function MyComponent() {
  const { user, loading, isAuthenticated, updatePlayerName } = usePlayerProfile();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not signed in</div>;
  
  return <div>Welcome, {user?.playerName}</div>;
}
```

## Components

### AuthDialog
```tsx
<AuthDialog
  open={showAuth}
  onOpenChange={setShowAuth}
  onAuthed={(name, email, userId) => {
    console.log('Authenticated:', { name, email, userId });
  }}
/>
```

### ActiveGamesDialog
```tsx
<ActiveGamesDialog
  open={showActiveGames}
  onOpenChange={setShowActiveGames}
  userId={userId}
  onResumeGame={(sessionId) => {
    console.log('Resuming game:', sessionId);
  }}
/>
```

## API Routes

### POST /api/validate-turn
Validates if current player can make a move
```json
Request: { "sessionId": "...", "playerId": "..." }
Response: { "success": true, "message": "Turn validated" }
```

### GET /api/active-games?userId=...
Fetches all active games for a user
```json
Response: {
  "success": true,
  "games": [ ... ],
  "count": 2
}
```

### POST /api/heartbeat
Updates player presence
```json
Request: { "userId": "...", "sessionId": "...", "isOnline": true }
Response: { "success": true, "timestamp": "2026-04-05T..." }
```

## Database Schema

New columns added to support features:

**game_sessions**:
- `current_turn_player_id` - UUID of player whose turn it is
- `last_move_at` - Timestamp of last move (for stale move detection)
- `player_1_connected` - Boolean, true if player 1 is online
- `player_2_connected` - Boolean, true if player 2 is online
- `player_1_last_heartbeat` - Last heartbeat time from player 1
- `player_2_last_heartbeat` - Last heartbeat time from player 2

**game_players**:
- `auth_user_id` - Reference to auth.users(id)
- `email` - Player's email
- `stats` - JSONB with games_played, wins, losses, win_streak
- `last_seen_at` - Last activity timestamp

## Configuration

### Heartbeat Interval
Currently set to 10 seconds. Modify in `prime-factor-game.tsx`:
```typescript
const interval = setInterval(() => {
  sendHeartbeat(userId, sessionId, true);
}, 10000); // 10 seconds
```

### Session Timeout
Currently set to 15 minutes. Modify in `session-management.ts`:
```typescript
export async function cleanupStalePlayerSessions(timeoutMinutes: number = 15)
```

### Move Staleness
Currently set to 30 seconds. Modify in `/app/api/validate-turn/route.ts`:
```typescript
if (timeSinceLastMove > 30000) { // 30 seconds
```

## Troubleshooting

### User can't sign up
- Check if email already exists
- Ensure password is at least 6 characters
- Check browser console for auth errors

### Active games not showing
- Must be authenticated (not guest mode)
- Check if userId is being passed to API
- Verify game_sessions table has player IDs

### Heartbeat not working
- Check network tab in browser dev tools
- Verify /api/heartbeat endpoint is accessible
- Check server logs for errors

### Turn validation failing
- Ensure current_turn_player_id is set on game_sessions
- Check that validateTurn is being called before player moves
- Verify turn order is being updated after each move
