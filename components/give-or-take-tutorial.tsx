"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GiveOrTakeTutorial({ open, onOpenChange }: TutorialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How to Play: Give or Take</DialogTitle>
          <DialogDescription>A unique version of the multiplication game</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Objective */}
          <div>
            <h3 className="font-bold text-lg mb-2">Objective</h3>
            <p className="text-sm text-muted-foreground">
              Land on prime numbers more than your opponent to win (default: first to 13 prime numbers).
            </p>
          </div>

          {/* Game Setup */}
          <div>
            <h3 className="font-bold text-lg mb-2">Game Setup</h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
              <li>Choose your player names and colors (6 color options available)</li>
              <li>Choose your target score (default: first to 13 prime numbers)</li>
              <li>Optionally enable a bot opponent and select difficulty</li>
              <li>Set up a timer for speed play (optional)</li>
              <li>Click "Start Game" to begin</li>
            </ul>
          </div>

          {/* Turn Structure */}
          <div>
            <h3 className="font-bold text-lg mb-2">Each Turn</h3>
            <ol className="text-sm space-y-3 text-muted-foreground list-decimal list-inside">
              <li>
                <span className="font-semibold">Choose Dice:</span> Pick your die size (becomes default for the game):
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li><span className="font-semibold">1-9:</span> Safe, small jumps</li>
                  <li><span className="font-semibold">1-19:</span> Medium risk, medium reward</li>
                  <li><span className="font-semibold">1-99:</span> High risk, big potential jumps</li>
                </ul>
                <p className="text-xs mt-1 italic">You can change the dice anytime during the game before rolling</p>
              </li>
              <li>
                <span className="font-semibold">Roll:</span> Click the roll button to see your number.
              </li>
              <li>
                <span className="font-semibold">Place Your Chip:</span> You can place on:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li><span className="font-semibold">The exact die value</span> (if unoccupied)</li>
                  <li><span className="font-semibold">Add</span> the die value to ANY of your previous positions</li>
                  <li><span className="font-semibold">Subtract</span> the die value from ANY of your previous positions</li>
                </ul>
              </li>
              <li>
                <span className="font-semibold">Claim Space:</span> Click where you want to move. The space must be empty.
              </li>
              <li>
                <span className="font-semibold">Score:</span> If you land on a prime number, you get 1 point!
              </li>
            </ol>
          </div>

          {/* Position Tracking */}
          <div>
            <h3 className="font-bold text-lg mb-2">Position Tracking</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Your captured squares are highlighted with your color:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li><span className="font-semibold">Recent move:</span> Has a pulsing dot and ring highlight</li>
              <li><span className="font-semibold">Previous moves:</span> Still highlighted with your color</li>
              <li>You can add or subtract from ANY of your captured squares!</li>
            </ul>
          </div>

          {/* Strategy */}
          <div>
            <h3 className="font-bold text-lg mb-2">Strategy Tips</h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
              <li>Smaller dice (1-9) are safer but move you slowly</li>
              <li>Bigger dice (1-99) can reach further but risks going off the board</li>
              <li>Plan ahead: which previous positions give you access to more primes?</li>
              <li>Use subtraction strategically to "undo" bad positions and reach primes</li>
              <li>You can always add or subtract from your entire history of positions!</li>
              <li>The bot gets smarter at higher difficulties - adapt your strategy!</li>
            </ul>
          </div>

          {/* Valid Moves */}
          <div>
            <h3 className="font-bold text-lg mb-2">No Valid Moves</h3>
            <p className="text-sm text-muted-foreground">
              If your die roll gives you no valid destinations, you automatically roll again. Keep rolling until you find a valid move!
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Got it! Let's Play
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
