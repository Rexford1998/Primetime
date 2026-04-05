"use client";

import { cn } from "@/lib/utils";
import type { GotBoardSpace } from "@/lib/give-or-take-utils";
import { PLAYER_COLORS } from "@/lib/give-or-take-utils";

interface GotBoardProps {
  board: GotBoardSpace[];
  onSpaceClick: (spaceNumber: number) => void;
  addTargets?: number[];
  subtractTargets?: number[];
  directTarget?: number | null;
  currentPlayerColor?: string;
  playerPositions?: [number[], number[]]; // All positions for each player
}

export function GotBoard({
  board,
  onSpaceClick,
  addTargets = [],
  subtractTargets = [],
  directTarget = null,
  currentPlayerColor,
  playerPositions = [[], []],
}: GotBoardProps) {
  const rows = [];
  for (let row = 9; row >= 0; row--) {
    const rowSpaces = [];
    for (let col = 0; col < 10; col++) {
      rowSpaces.push(board[row * 10 + col]);
    }
    rows.push(rowSpaces);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-10 gap-0 bg-gray-300 dark:bg-gray-600 p-0 rounded-lg border border-gray-400 dark:border-gray-700">
        {rows.flatMap((row, rowIndex) =>
          row.map((space, colIndex) => {
            const num = space?.number ?? -1;
            const isAdd = addTargets.includes(num);
            const isSub = subtractTargets.includes(num);
            const isDirect = directTarget === num;
            // Check if this space is a recent move for either player
            const isRecentMove = 
              (playerPositions[0].length > 0 && playerPositions[0][playerPositions[0].length - 1] === num) ||
              (playerPositions[1].length > 0 && playerPositions[1][playerPositions[1].length - 1] === num);
            return (
              <GotSpaceCell
                key={num}
                space={space}
                onClick={() => space && onSpaceClick(space.number)}
                isAddTarget={isAdd}
                isSubTarget={isSub}
                isDirectTarget={isDirect}
                currentPlayerColor={currentPlayerColor}
                isRecentMove={isRecentMove}
                playerPositions={playerPositions}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function GotSpaceCell({
  space,
  onClick,
  isAddTarget,
  isSubTarget,
  isDirectTarget,
  currentPlayerColor,
  isRecentMove,
  playerPositions,
}: {
  space: GotBoardSpace | undefined;
  onClick: () => void;
  isAddTarget: boolean;
  isSubTarget: boolean;
  isDirectTarget: boolean;
  currentPlayerColor?: string;
  isRecentMove: boolean;
  playerPositions: [number[], number[]];
}) {
  if (!space) return <div className="aspect-square bg-white dark:bg-zinc-900" />;

  const isClickable = isAddTarget || isSubTarget || isDirectTarget;

  // Logo cell
  if (space.number === 0) {
    return (
      <div className="aspect-square bg-white dark:bg-zinc-900 flex items-center justify-center p-0.5 border border-gray-400 dark:border-gray-600">
        <span
          className="text-[7px] sm:text-[10px] font-black text-center leading-none"
          style={{
            background: "linear-gradient(90deg, #22c55e, #3b82f6, #f59e0b, #ef4444)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Give
          <br />
          Or
          <br />
          Take
        </span>
      </div>
    );
  }

  // Claimed/occupied space - all occupied squares now highlighted consistently
  if (space.owner !== null) {
    const ownerColor = PLAYER_COLORS[space.owner];
    return (
      <div
        className="aspect-square flex items-center justify-center relative bg-white dark:bg-zinc-900 border-4"
        style={{ borderColor: ownerColor }}
      >
        {/* Colored chip dot */}
        <div
          className={cn(
            "absolute top-0.5 right-0.5 rounded-full",
            isRecentMove ? "w-3 h-3 sm:w-4 sm:h-4 animate-pulse" : "w-2 h-2 sm:w-3 sm:h-3"
          )}
          style={{ backgroundColor: ownerColor }}
        />
        {/* Ring highlight on recent move */}
        {isRecentMove && (
          <div
            className="absolute inset-0 rounded-sm ring-3 ring-inset"
            style={{ boxShadow: `inset 0 0 0 3px ${ownerColor}` }}
          />
        )}
        <div
          className={cn(
            "flex items-center justify-center shrink-0 z-10",
            space.isPrime &&
              "w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-red-500 dark:border-red-400"
          )}
        >
          <span
            className={cn(
              "leading-none",
              space.isPrime
                ? "text-xs sm:text-base font-bold text-blue-600 dark:text-blue-400"
                : "text-xs sm:text-sm font-bold text-foreground"
            )}
          >
            {space.number}
          </span>
        </div>
      </div>
    );
  }

  // Clickable target cells - hidden, only the dot shows they're playable
  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "aspect-square transition-all duration-200 relative",
          "flex items-center justify-center p-0.5",
          "focus:outline-none cursor-pointer",
          "bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-400 dark:border-gray-600"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center shrink-0",
            space.isPrime &&
              "w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-red-500 dark:border-red-400"
          )}
        >
          <span
            className={cn(
              "leading-none",
              space.isPrime
                ? "text-xs sm:text-base font-bold text-blue-600 dark:text-blue-400"
                : "text-xs sm:text-sm font-bold text-foreground"
            )}
          >
            {space.number}
          </span>
        </div>
      </button>
    );
  }

  // Unoccupied, not highlighted
  return (
    <div
      className={cn(
        "aspect-square transition-all duration-200 relative",
        "flex items-center justify-center p-0.5",
        "bg-white dark:bg-zinc-900 border border-gray-400 dark:border-gray-600"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center shrink-0",
          space.isPrime &&
            "w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-red-500 dark:border-red-400"
        )}
      >
        <span
          className={cn(
            "leading-none",
            space.isPrime
              ? "text-xs sm:text-base font-bold text-blue-600 dark:text-blue-400"
              : "text-xs sm:text-sm font-bold text-foreground"
          )}
        >
          {space.number}
        </span>
      </div>
    </div>
  );
}
