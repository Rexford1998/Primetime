"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { GotBoard } from "./got-board";
import {
  PointAnimations,
  getRandomEmoji,
  createFireworkBurst,
  type FloatingEmoji,
  type FireworkParticle,
} from "./point-animations";
import {
  generateGotBoard,
  rollOneDie,
  getReachableSpaces,
  type GotGameState,
  type DiceSize,
  PLAYER_COLORS,
  COLOR_PALETTE,
} from "@/lib/give-or-take-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getBotDiceSizeForGiveOrTake,
  getBotPlacementForGiveOrTake,
  type BotDifficulty,
} from "@/lib/bot-utils";
import { GiveOrTakeTutorial } from "./give-or-take-tutorial";
import { MultiplayerModeDialog } from "./multiplayer-mode-dialog";
import { WaitingRoomDialog } from "./waiting-room-dialog";
import { GameSetupForm } from "./game-setup-dialog";
import { GameLobby } from "./game-lobby";
import { 
  createGameLobby, 
  joinGameLobby, 
  cancelGameLobby, 
  getGameSession, 
  getGameSessionById, 
  getGameStates, 
  subscribeToSession, 
  subscribeToGameState, 
  updateGameState, 
  generatePlayerId, 
  sendHeartbeat, 
  validateTurn, 
  updateCurrentTurn 
} from "@/lib/supabase-multiplayer";
import { usePlayerProfile } from "@/hooks/use-player-profile";

const BOT_DIFFICULTIES: { label: string; value: BotDifficulty; description: string }[] = [
  { label: "Easy", value: "easy", description: "Makes mistakes" },
  { label: "Medium", value: "medium", description: "Balanced" },
  { label: "Hard", value: "hard", description: "Smart player" },
];

const TIMER_OPTIONS = [
  { label: "No Timer", value: null },
  { label: "30 sec", value: 30 },
  { label: "60 sec", value: 60 },
  { label: "90 sec", value: 90 },
];

const DEFAULT_TARGET_SCORE = 13;

function createInitialState(
  playerNames: [string, string],
  playerColors: [string, string]
): GotGameState {
  const board = generateGotBoard();
  return {
    board,
    players: [
      { name: playerNames[0], color: playerColors[0], position: [], score: 0 },
      { name: playerNames[1], color: playerColors[1], position: [], score: 0 },
    ],
    currentPlayer: 0,
    diceSize: 9,
    phase: "playing",
    gameStartTime: Date.now(),
    moves: [],
    turnStartTime: Date.now(),
    gameId: "",
    targetScore: DEFAULT_TARGET_SCORE,
  };
}

export function GiveOrTakeGame() {
  const [gameState, setGameState] = useState<GotGameState>(createInitialState(["Player 1", "Player 2"], [PLAYER_COLORS[0], PLAYER_COLORS[1]]));
  const [showSetup, setShowSetup] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [displayDie, setDisplayDie] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Setup options
  const [setupTimer, setSetupTimer] = useState<number | null>(null);
  const [setupPlayerNames, setSetupPlayerNames] = useState<[string, string]>(["Player 1", "Player 2"]);
  const [setupPlayerColors, setSetupPlayerColors] = useState<[string, string]>([PLAYER_COLORS[0], PLAYER_COLORS[1]]);
  const [selectedDiceSize, setSelectedDiceSize] = useState<DiceSize | null>(null);
  const [botEnabled, setBotEnabled] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
  const [showLobby, setShowLobby] = useState(false);
  const [showGameSetup, setShowGameSetup] = useState(false);

  // Authentication and session recovery
  const { user: authUser, isAuthenticated } = usePlayerProfile();
  const [userId, setUserId] = useState<string | null>(null);
  const [showActiveGames, setShowActiveGames] = useState(false);
  const [hasResumableGames, setHasResumableGames] = useState(false);

  // Multiplayer state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerMode, setMultiplayerMode] = useState<"create" | "join" | "lobby" | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionPlayer1Id, setSessionPlayer1Id] = useState<string | null>(null);
  const [sessionPlayer2Id, setSessionPlayer2Id] = useState<string | null>(null);
  const [sessionLocalPlayerId, setSessionLocalPlayerId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentPlayerId, setOpponentPlayerId] = useState<string | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentHasJoined, setOpponentHasJoined] = useState(false);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);
  const [lobbyLoading, setLobbyLoading] = useState(false);

  // Exit confirmation dialog
  const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
  const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null);

  // Track all positions per player (not just last) [player0 positions, player1 positions]
  const [playerPositions, setPlayerPositions] = useState<[number[], number[]]>([[], []]);

  // Turn timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);

  // Auto-update Player 2 name when bot is enabled/disabled
  useEffect(() => {
    if (botEnabled && setupPlayerNames[1] === "Player 2") {
      const BOT_NAMES = ["Bot", "AI Rival", "Robot", "Bot Master"];
      const randomBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const newNames: [string, string] = [...setupPlayerNames];
      newNames[1] = randomBot;
      setSetupPlayerNames(newNames);
    }
  }, [botEnabled]);

  // Local player id
  useEffect(() => {
    const id = generatePlayerId();
    setPlayerId(id || null);
  }, []);

  // Set userId from auth user
  useEffect(() => {
    if (authUser?.id) {
      setUserId(authUser.id);
      setPlayerId(authUser.id);
    }
  }, [authUser]);

  useEffect(() => {
    if (!sessionId) {
      if (sessionLocalPlayerId !== null) {
        setSessionLocalPlayerId(null);
      }
      return;
    }

    const matchedIdentity = [userId, playerId].find(
      (candidate): candidate is string =>
        Boolean(candidate) &&
        (candidate === sessionPlayer1Id || candidate === sessionPlayer2Id)
    );

    if (matchedIdentity && matchedIdentity !== sessionLocalPlayerId) {
      setSessionLocalPlayerId(matchedIdentity);
      return;
    }

    if (!sessionLocalPlayerId) {
      if (multiplayerMode === "create" && sessionPlayer1Id) {
        setSessionLocalPlayerId(sessionPlayer1Id);
      } else if (multiplayerMode === "join" && sessionPlayer2Id) {
        setSessionLocalPlayerId(sessionPlayer2Id);
      }
    }
  }, [
    multiplayerMode,
    playerId,
    sessionId,
    sessionLocalPlayerId,
    sessionPlayer1Id,
    sessionPlayer2Id,
    userId,
  ]);

  useEffect(() => {
    if (!userId) {
      setHasResumableGames(false);
      return;
    }

    let cancelled = false;

    const checkActiveGames = async () => {
      try {
        const response = await fetch(`/api/active-games?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!cancelled) {
          setHasResumableGames(Boolean(data.success && (data.count || 0) > 0));
        }
      } catch (error) {
        console.warn("Could not determine active game count", error);
      }
    };

    checkActiveGames();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Setup heartbeat for multiplayer
  useEffect(() => {
    if (isMultiplayer && sessionId && sessionLocalPlayerId) {
      // Send initial heartbeat
      sendHeartbeat(sessionLocalPlayerId, sessionId, true);

      // Setup periodic heartbeat every 10 seconds
      const interval = setInterval(() => {
        sendHeartbeat(sessionLocalPlayerId, sessionId, true);
      }, 10000);

      setHeartbeatInterval(interval);

      return () => {
        clearInterval(interval);
        // Mark player as offline when leaving
        sendHeartbeat(sessionLocalPlayerId, sessionId, false);
      };
    }
  }, [isMultiplayer, sessionId, sessionLocalPlayerId]);

  // Subscribe to game state updates
  useEffect(() => {
    if (!isMultiplayer || !sessionId) return;

    const channel = subscribeToGameState(sessionId, (states) => {
      const latestState = states[states.length - 1];
      if (latestState?.game_state) {
        try {
          const newState = JSON.parse(latestState.game_state);
          setGameState(newState);
        } catch (error) {
          console.error("Failed to parse game state:", error);
        }
      }
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [isMultiplayer, sessionId]);

  // Subscribe to session updates for opponent joining/leaving
  useEffect(() => {
    if (!isMultiplayer || !sessionCode) return;

    const channel = subscribeToSession(sessionCode, (session) => {
      if (!session) return;

      setSessionId(session.id);
      setSessionPlayer1Id(session.player_1_id);
      setSessionPlayer2Id(session.player_2_id);

      // Check if opponent has joined
      const opponentId = sessionLocalPlayerId === session.player_1_id ? session.player_2_id : session.player_1_id;
      const opponentJoined = opponentId !== null;
      
      if (opponentJoined && !opponentHasJoined) {
        setOpponentHasJoined(true);
        if (session.player_1_id === sessionLocalPlayerId) {
          setOpponentName(session.player_2_name || "Player 2");
        } else {
          setOpponentName(session.player_1_name || "Player 1");
        }
      }
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [isMultiplayer, sessionCode, sessionLocalPlayerId, opponentHasJoined]);

  const spawnPointAnimation = useCallback((x: number, y: number, points: number, isBonus: boolean) => {
    const emoji = getRandomEmoji();
    const newAnimation: FloatingEmoji = {
      id: Math.random(),
      x,
      y,
      emoji,
      points,
      duration: 1.5,
      createdAt: Date.now(),
      isBonus,
    };
    setFloatingEmojis((prev) => [...prev, newAnimation]);
  }, []);

  const handleAnimationComplete = useCallback((id: number) => {
    setFloatingEmojis((prev) => prev.filter((anim) => anim.id !== id));
  }, []);

  const handleModeSelect = useCallback((mode: "bot" | "local" | "create") => {
    // Force auth for multiplayer flows
    if (mode === "create" && !authUser?.id) {
      setShowAuth(true);
      return;
    }

    if (mode === "bot") {
      setBotEnabled(true);
      setIsMultiplayer(false);
      setShowSetup(true);
      setShowModeSelect(false);
      return;
    }

    if (mode === "local") {
      setBotEnabled(false);
      setIsMultiplayer(false);
      setShowSetup(true);
      setShowModeSelect(false);
      return;
    }

    // Show lobby to find/create multiplayer game
    if (mode === "create") {
      setShowLobby(true);
      setMultiplayerMode("lobby");
      setShowModeSelect(false);
    }
  }, [authUser?.id]);

  const handleGameSetupSubmit = useCallback(
    async (settings: {
      playerName: string;
      targetScore?: number;
      botDifficulty?: string;
    }) => {
      setLobbyLoading(true);
      try {
        // Use the authenticated user ID if available, otherwise let createGameLobby generate one
        const playerIdToUse = authUser?.id || userId;
        
        const session = await createGameLobby(
          "give-or-take",
          settings.playerName,
          {
            targetScore: settings.targetScore,
            botDifficulty: settings.botDifficulty,
          },
          playerIdToUse
        );

        if (session) {
          setSessionId(session.id);
          setSessionCode(session.session_code);
          setSessionPlayer1Id(session.player_1_id);
          setSessionPlayer2Id(session.player_2_id);
          setSessionLocalPlayerId(session.player_1_id);
          setPlayerId(session.player_1_id);
          setIsMultiplayer(true);
          setMultiplayerMode("create");
          setShowGameSetup(false);
          setShowLobby(false);
          setWaitingForOpponent(true);
          setSetupPlayerNames([settings.playerName, "Waiting for opponent..."]);
        }
      } catch (error) {
        console.error("Error creating game lobby:", error);
      } finally {
        setLobbyLoading(false);
      }
    },
    [authUser?.id, userId]
  );

  // Show lobby if browsing for games
  if (showLobby) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(37,99,235,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowLobby(false);
                setShowModeSelect(true);
              }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
            >
              ← Back to modes
            </button>
            <GameLobby
              gameType="give-or-take"
              onSelectLobby={(lobbyId) => {
                // TODO: Handle joining a lobby
                console.log("[v0] Joining lobby:", lobbyId);
              }}
              onCreateNew={() => {
                setShowGameSetup(true);
                setShowLobby(false);
              }}
              isOpen={showLobby}
              onChangeGameType={() => {
                // Give or Take is fixed for this component
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show game setup form
  if (showGameSetup) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(37,99,235,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowGameSetup(false);
                setShowLobby(true);
              }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
            >
              ← Back to lobby
            </button>
            <GameSetupForm
              gameType="give-or-take"
              defaultPlayerName={setupPlayerNames[0] || ""}
              onCreateLobby={handleGameSetupSubmit}
              onCancel={() => {
                setShowGameSetup(false);
                setShowLobby(true);
              }}
              isLoading={lobbyLoading}
              isMultiplayer={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show waiting room for multiplayer
  if (isMultiplayer && waitingForOpponent) {
    return (
      <WaitingRoomDialog
        sessionCode={sessionCode ?? ""}
        playerName={setupPlayerNames[0]}
        gameType="give-or-take"
        onCancel={() => {
          if (sessionCode) {
            void cancelGameLobby(sessionCode);
          }
          setIsMultiplayer(false);
          setWaitingForOpponent(false);
          setSessionCode(null);
          setSessionId(null);
          setSessionPlayer1Id(null);
          setSessionPlayer2Id(null);
          setSessionLocalPlayerId(null);
          setShowModeSelect(true);
        }}
        onOpponentJoined={() => {
          setWaitingForOpponent(false);
          setOpponentHasJoined(false);
          setShowSetup(false);
          setShowModeSelect(false);
          // Game is now live, continue to main game view
        }}
        onJoinLobby={(lobbyId) => {
          // TODO: Handle joining a different lobby
          console.log("[v0] Joining lobby:", lobbyId);
        }}
        onCreateNew={() => {
          setShowModeSelect(true);
          setWaitingForOpponent(false);
        }}
        opponentHasJoined={opponentHasJoined}
        isOpen
      />
    );
  }

  // Show setup if single player modes
  if (showSetup && !isMultiplayer) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Setup Dialog */}
          <GiveOrTakeTutorial open={showTutorial} onOpenChange={setShowTutorial} />
          
          {/* Multiplayer / Bot Mode Selector */}
          <MultiplayerModeDialog
            open={showModeSelect}
            onOpenChange={setShowModeSelect}
            onModeSelect={handleModeSelect}
            gameName="Give or Take"
          />
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayer];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Setup Dialog */}
        <GiveOrTakeTutorial open={showTutorial} onOpenChange={setShowTutorial} />
        
        {/* Multiplayer / Bot Mode Selector */}
        <MultiplayerModeDialog
          open={showModeSelect}
          onOpenChange={setShowModeSelect}
          onModeSelect={handleModeSelect}
          gameName="Give or Take"
        />
      </div>
    </div>
  );
}
