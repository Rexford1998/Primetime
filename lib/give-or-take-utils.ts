// Give or Take game utilities
// Leap frog dice game - roll a die, add or subtract to reach spaces

export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

export function isPrime(n: number): boolean {
  return PRIMES.includes(n);
}

export type DiceSize = 9 | 19 | 99;

// Roll a single die: values 1 to diceSize
export function rollOneDie(diceSize: DiceSize = 9): number {
  return Math.floor(Math.random() * diceSize) + 1;
}

export interface GotBoardSpace {
  number: number;
  isPrime: boolean;
  owner: number | null;
  claimed: boolean;
}

// Generate the board (0-99)
export function generateGotBoard(): GotBoardSpace[] {
  const board: GotBoardSpace[] = [];

  // Logo space (position 0)
  board.push({
    number: 0,
    isPrime: false,
    owner: null,
    claimed: false,
  });

  for (let i = 1; i <= 99; i++) {
    board.push({
      number: i,
      isPrime: isPrime(i),
      owner: null,
      claimed: false,
    });
  }

  return board;
}

// Calculate reachable spaces from a die roll
// On first turn: the die value itself is the only option
// On subsequent turns: can place on exact die value OR any previous roll +/- current die
export function getReachableSpaces(
  board: GotBoardSpace[],
  dieValue: number,
  playerPositions: number[], // All spaces owned by the player
  isFirstMove: boolean
): { addTargets: number[]; subtractTargets: number[]; directTarget: number | null } {
  const addTargets: Set<number> = new Set();
  const subtractTargets: Set<number> = new Set();
  let directTarget: number | null = null;

  if (isFirstMove || playerPositions.length === 0) {
    // First move: can place on the die value directly
    if (dieValue >= 1 && dieValue <= 99 && board[dieValue].owner === null) {
      directTarget = dieValue;
    }
    return { addTargets: Array.from(addTargets), subtractTargets: Array.from(subtractTargets), directTarget };
  }

  // Can also place directly on the die value if unoccupied
  if (dieValue >= 1 && dieValue <= 99 && board[dieValue].owner === null) {
    directTarget = dieValue;
  }

  // Calculate from ALL previous positions
  for (const position of playerPositions) {
    const addResult = position + dieValue;
    const subResult = position - dieValue;

    if (addResult >= 1 && addResult <= 99 && board[addResult].owner === null) {
      addTargets.add(addResult);
    }
    if (subResult >= 1 && subResult <= 99 && board[subResult].owner === null) {
      subtractTargets.add(subResult);
    }
  }

  return { addTargets: Array.from(addTargets), subtractTargets: Array.from(subtractTargets), directTarget };
}

export interface GotPlayer {
  name: string;
  color: string;
  score: number;
}

export interface GotGameState {
  board: GotBoardSpace[];
  players: GotPlayer[];
  currentPlayer: number;
  phase: "setup" | "chooseDice" | "rolling" | "rolled" | "placing" | "gameOver";
  message: string;
  targetScore: number;
  dieValue: number | null;
  diceSize: DiceSize | null; // null = not chosen yet
  timerSeconds: number | null; // null = no timer
}

// 6 color palette options
export const COLOR_PALETTE = [
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Pink", value: "#EC4899" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Orange", value: "#F97316" },
];

export const PLAYER_COLORS = ["#3B82F6", "#EC4899"];
