import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MultiplayerModeProps {
  gameType: 'multiplication' | 'give-or-take';
  onSinglePlayer: () => void;
  onCreateMultiplayer: (playerName: string) => void;
  onJoinMultiplayer: (sessionCode: string, playerName: string) => void;
  isOpen: boolean;
}

export function MultiplayerModeDialog({
  gameType,
  onSinglePlayer,
  onCreateMultiplayer,
  onJoinMultiplayer,
  isOpen,
}: MultiplayerModeProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [playerName, setPlayerName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) return;
    setLoading(true);
    onCreateMultiplayer(playerName);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim() || !sessionCode.trim()) return;
    setLoading(true);
    onJoinMultiplayer(sessionCode.toUpperCase(), playerName);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent>
        {mode === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle>Play {gameType === 'multiplication' ? 'Multiplication' : 'Give or Take'}</DialogTitle>
              <DialogDescription>Choose how you want to play</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button
                onClick={onSinglePlayer}
                variant="default"
                size="lg"
                className="w-full"
              >
                Single Player
              </Button>
              <Button
                onClick={() => setMode('create')}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Create Multiplayer Game
              </Button>
              <Button
                onClick={() => setMode('join')}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Join Multiplayer Game
              </Button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <>
            <DialogHeader>
              <DialogTitle>Create Multiplayer Game</DialogTitle>
              <DialogDescription>Enter your name to create a new game</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Your name (anonymous)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMode('select');
                    setPlayerName('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!playerName.trim() || loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Game'}
                </Button>
              </div>
            </div>
          </>
        )}

        {mode === 'join' && (
          <>
            <DialogHeader>
              <DialogTitle>Join Multiplayer Game</DialogTitle>
              <DialogDescription>Enter the session code and your name</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Session code (6 letters)"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Input
                placeholder="Your name (anonymous)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMode('select');
                    setPlayerName('');
                    setSessionCode('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={!playerName.trim() || !sessionCode.trim() || loading}
                  className="flex-1"
                >
                  {loading ? 'Joining...' : 'Join Game'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
