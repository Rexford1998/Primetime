"use client";

import { cn } from "@/lib/utils";
import type { Player } from "@/lib/game-utils";
import { PLAYER_COLORS } from "@/lib/game-utils";

interface ScoreboardProps {
  players: Player[];
  currentPlayer: number;
  targetScore: number;
}

export function Scoreboard({ players, currentPlayer, targetScore }: ScoreboardProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Scoreboard</h3>
        <span className="text-xs text-muted-foreground">First to {targetScore} wins</span>
      </div>
      <div className="space-y-2">
        {players.map((player, index) => (
          <div
            key={player.name}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg transition-all",
              currentPlayer === index
                ? "bg-accent ring-2 ring-chart-1"
                : "bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: PLAYER_COLORS[index] }}
              />
              <span className="font-medium">{player.name}</span>
              {currentPlayer === index && (
                <span className="text-xs bg-chart-1 text-white px-2 py-0.5 rounded-full">
                  Playing
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-bold text-lg">{player.score + player.bonusPoints}</div>
                <div className="text-xs text-muted-foreground">
                  {player.score} + {player.bonusPoints} bonus
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
