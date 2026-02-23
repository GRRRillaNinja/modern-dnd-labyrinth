import { create } from 'zustand';
import {
  GameStateData,
  GameSettings,
  Position,
  ChamberPath,
  GameEvent,
  GameMode,
  GameState,
  Direction,
  PathType,
  DiscoveredWalls,
  DEFAULT_SETTINGS,
} from '@shared/types';
import { GameEngine } from '../game/GameEngine';
import { MazeGenerator } from '../game/MazeGenerator';
import { AIController } from '../game/AIController';
import { audioService } from '../services/AudioService';
import { supabaseService } from '../services/SupabaseService';

// Dragon turn delay (milliseconds) - time to wait for dragon flying sound and movement animation
const DRAGON_TURN_DELAY = 2500;

// Dragon chime delay (milliseconds) - wait for chime to finish before showing dragon movement
const DRAGON_CHIME_DELAY = 1100;

// Dragon wake delay (milliseconds) - pause to let the dragonWakes sound play before resuming
const DRAGON_WAKE_DELAY = 2500;

/** Time to pause gameplay while the warrior battle scuffle sound plays */
const BATTLE_SCUFFLE_DELAY = 2500;

// Calculate percentage of internal walls discovered
export function calculateWallsDiscoveredPct(
  chamberPaths: ChamberPath[][],
  discoveredWalls: DiscoveredWalls
): number {
  if (chamberPaths.length === 0) return 0;

  // Count total internal walls (East where col<7, South where row<7)
  let totalWalls = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (c < 7 && chamberPaths[r][c][Direction.East] === PathType.Wall) totalWalls++;
      if (r < 7 && chamberPaths[r][c][Direction.South] === PathType.Wall) totalWalls++;
    }
  }

  if (totalWalls === 0) return 0;

  // Count discovered internal walls (canonical East/South entries only)
  let discoveredCount = 0;
  for (const key of Object.keys(discoveredWalls)) {
    const parts = key.split('-');
    const col = parseInt(parts[1], 10);
    const row = parseInt(parts[0], 10);
    const dir = parseInt(parts[2], 10);
    if (dir === Direction.East && col < 7) discoveredCount++;
    if (dir === Direction.South && row < 7) discoveredCount++;
  }

  return Math.round((discoveredCount / totalWalls) * 100);
}

interface GameStore {
  // State
  gameState: GameStateData | null;
  chamberPaths: ChamberPath[][];
  gameEngine: GameEngine | null;
  settings: GameSettings;
  showHelp: boolean;
  helpMessage: string;
  gameWon: boolean; // Track if game was won or lost
  showTreasureFlash: boolean; // Flash effect when treasure found
  showDoorFlash: boolean; // Flash effect when door is locked
  showDeathFlash: boolean; // Flash effect when warrior dies
  showBattleShake: boolean; // Shake effect when warriors battle
  showVictoryFireworks: boolean; // Fireworks effect when winning
  gameStartTime: number | null; // Timestamp when first move was made
  gameEndTime: number | null; // Timestamp when game ended
  isDragonTurn: boolean; // Block player input during dragon's turn
  showPlayerNameModal: boolean; // Show modal to collect player name
  showLeaderboardAfterGame: boolean; // Show leaderboard after score submission
  totalMoves: number; // Total valid actions taken during the game
  totalDeaths: number; // Total dragon attacks (lives lost) during the game
  submissionResult: { rank: number; isTop100: boolean; gameMode: 'solo' | 'multiplayer'; gameResult: 'win' | 'loss' } | null; // Result of score submission
  aiController: AIController | null; // AI controller for CPU mode
  isCPUMode: boolean; // Whether warrior 2 is CPU-controlled
  isAIThinking: boolean; // Whether AI is currently executing its turn

  // Actions
  initGame: (mode: GameMode, numberOfWarriors: number, level: number) => void;
  setWarriorRoom: (warriorNumber: number, position: Position) => void;
  skipWarriorTwo: () => void;
  moveWarrior: (warriorNumber: number, position: Position) => void;
  finishTurn: (warriorNumber: number) => void;
  toggleLevel: () => void;
  resetGame: () => void;
  toggleHelp: () => void;
  setHelpMessage: (message: string, temporary?: boolean) => void;
  handleGameEvent: (event: GameEvent) => void;
  submitScore: (playerName: string) => Promise<void>;
  skipScoreSubmission: () => void;
  closeLeaderboard: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  chamberPaths: [],
  gameEngine: null,
  settings: DEFAULT_SETTINGS,
  showHelp: true,
  helpMessage: '',
  gameWon: false,
  showTreasureFlash: false,
  showDoorFlash: false,
  showDeathFlash: false,
  showBattleShake: false,
  showVictoryFireworks: false,
  gameStartTime: null,
  gameEndTime: null,
  isDragonTurn: false,
  showPlayerNameModal: false,
  showLeaderboardAfterGame: false,
  totalMoves: 0,
  totalDeaths: 0,
  submissionResult: null,
  aiController: null,
  isCPUMode: false,
  isAIThinking: false,

  // Initialize game
  initGame: (mode: GameMode, numberOfWarriors: number, level: number) => {
    // Abort any running AI turn from a previous game
    const prevAI = get().aiController;
    if (prevAI) prevAI.abort();

    const { settings } = get();

    // Create game engine
    const engine = new GameEngine(settings);

    // Generate maze
    const mazeGen = new MazeGenerator(settings);
    const maze = mazeGen.generate();

    // Start game
    engine.startGame(numberOfWarriors);

    // Set the level and mode BEFORE setting the maze (so door initialization works correctly)
    const state = engine.getState();
    state.level = level;
    state.mode = mode;

    // Now set the maze (this will initialize locked doors for level 2)
    engine.setMaze(maze.chamberPaths);

    // Subscribe to events
    engine.on((event) => get().handleGameEvent(event));

    // Create AI controller for CPU mode
    const isCPU = mode === GameMode.VsCPU;
    let ai: AIController | null = null;
    if (isCPU) {
      ai = new AIController();
    }

    set({
      gameEngine: engine,
      gameState: engine.getState(),
      chamberPaths: maze.chamberPaths,
      helpMessage: numberOfWarriors === 1
        ? 'Pick a Waystone location for warrior one'
        : isCPU
          ? 'Pick a Waystone location for warrior one'
          : 'Player 1: Pick a Waystone location for warrior one',
      gameWon: false, // Reset game result
      gameStartTime: null, // Reset timer
      gameEndTime: null,
      showPlayerNameModal: false,
      showLeaderboardAfterGame: false,
      totalMoves: 0,
      totalDeaths: 0,
      submissionResult: null,
      aiController: ai,
      isCPUMode: isCPU,
      isAIThinking: false,
    });

    audioService.announceWarrior(0);
  },

  // Set warrior secret room
  setWarriorRoom: (warriorNumber: number, position: Position) => {
    const { gameEngine, isCPUMode, aiController } = get();
    if (!gameEngine) return;

    const success = gameEngine.setWarriorSecretRoom(warriorNumber, position);

    if (success) {
      const state = gameEngine.getState();
      let message = '';

      if (state.state === 2) { // WarriorTwoSelectRoom (value is 2)
        if (isCPUMode && aiController) {
          // AI auto-selects its room
          message = 'CPU is choosing its Waystone...';
          set({ gameState: state, helpMessage: message, isAIThinking: true });
          setTimeout(() => {
            const aiRoom = aiController.selectRoom(gameEngine.getState());
            get().setWarriorRoom(1, aiRoom);
            set({ isAIThinking: false });
          }, 800);
          return;
        }
        message = 'Player 2: Pick a Waystone location for warrior two';
        // Play announcement and update state
        audioService.announceWarrior(1);
      } else if (state.state === 3 || state.state === 4) { // Warrior turns
        const currentWarrior = state.state === 3 ? 0 : 1;

        // Only mention moves if tracking them (multiplayer or solo with dragon awake)
        const shouldTrackMoves = state.numberOfWarriors === 2 || state.dragon.state === 1; // 1 = Awake
        const warriorLabel = currentWarrior === 0 ? 'Warrior one' : (isCPUMode ? 'CPU' : 'Warrior two');

        if (shouldTrackMoves) {
          message = `${warriorLabel}'s turn with ${state.warriors[currentWarrior].moves} moves`;
        } else {
          message = `${warriorLabel}'s turn. Explore and find the dragon!`;
        }

        audioService.announceWarrior(currentWarrior);
      }

      set({
        gameState: { ...state },
        helpMessage: message,
      });
    }
  },

  // Skip warrior two (single player)
  skipWarriorTwo: () => {
    const { gameEngine } = get();
    if (!gameEngine) return;

    gameEngine.skipWarriorTwo();
    const state = gameEngine.getState();

    // Solo mode, dragon not awake yet
    const message = `Warrior one's turn. Explore and find the dragon!`;

    set({
      gameState: { ...state },
      helpMessage: message,
    });

    audioService.announceWarrior(0);
  },

  // Move warrior
  moveWarrior: (warriorNumber: number, position: Position) => {
    const { gameEngine, gameState, gameStartTime, isDragonTurn } = get();
    if (!gameEngine) return;
    
    // Block movement during dragon's turn
    if (isDragonTurn) return;
    
    // Don't allow moves if warrior is dead or game is over
    if (!gameState || gameState.warriors[warriorNumber].lives <= 0) return;
    if (gameState.state === 5) return; // GameState.GameOver

    // Start timer on first move away from Waystone
    if (!gameStartTime) {
      const warrior = gameState.warriors[warriorNumber];
      const isMovingFromWaystone = warrior.position && warrior.secretRoom &&
        warrior.position[0] === warrior.secretRoom[0] && 
        warrior.position[1] === warrior.secretRoom[1];
      
      if (isMovingFromWaystone) {
        set({ gameStartTime: Date.now() });
      }
    }

    // Store moves before the move to detect turn changes
    const movesBefore = [
      gameState.warriors[0].moves,
      gameState.warriors[1].moves
    ];
    const dragonWasAwake = gameState.dragon.state === 1; // 1 = Awake
    const treasureHeldBefore = gameState.treasure.warrior; // -1 if no one has it

    gameEngine.moveWarrior(warriorNumber, position);
    const newState = gameEngine.getState();

    // The engine captures a snapshot AFTER warrior actions but BEFORE dragon movement.
    // Use this for the dragon chime display so warrior moves are visible immediately.
    const preDragonSS = gameEngine.getPreDragonState();

    // Treasure just found — moves were reset to movesWithTreasure, NOT a turn change.
    // The engine returns early on treasure found (no finishWarriorTurn, no dragon move).
    // Skip all turn transition logic to avoid false-positive dragon animation.
    const treasureJustFound = treasureHeldBefore < 0 && newState.treasure.warrior >= 0;
    if (treasureJustFound) {
      set({ gameState: { ...newState } });
      triggerAITurnIfNeeded();
      return;
    }

    // Warrior battle — treasure changed hands in a fight.
    // isDragonTurn was already set to true by the WARRIOR_BATTLE event handler.
    // Pause gameplay while the scuffle sound plays.
    const battleJustHappened = treasureHeldBefore >= 0
      && newState.treasure.warrior >= 0
      && newState.treasure.warrior !== treasureHeldBefore;

    if (battleJustHappened) {
      set({ gameState: { ...newState } });
      audioService.play('scuffle');
      setTimeout(() => {
        set({ isDragonTurn: false });
        triggerAITurnIfNeeded();
      }, BATTLE_SCUFFLE_DELAY);
      return;
    }

    // Dragon just woke up — pause for the dragonWakes sound before resuming.
    // isDragonTurn was already set to true by the DRAGON_AWAKE event handler.
    const dragonJustWoke = !dragonWasAwake && newState.dragon.state === 1;

    if (dragonJustWoke) {
      // Update state immediately so the dragon is visible on the board
      set({ gameState: { ...newState } });
      // Debug log removed for production
      audioService.play('dragonWakes');
      setTimeout(() => {
        // Debug log removed for production
        set({ isDragonTurn: false });
        triggerAITurnIfNeeded();
      }, DRAGON_WAKE_DELAY);
      return;
    }

    // Check if any warrior's moves increased (indicating turn reset)
    const movesAfter = [
      newState.warriors[0].moves,
      newState.warriors[1].moves
    ];

    // Find which warrior had their moves reset
    let turnResetWarrior = -1;
    for (let i = 0; i < 2; i++) {
      if (movesAfter[i] > movesBefore[i]) {
        turnResetWarrior = i;
        break;
      }
    }

    // Handle turn transitions
    // Always announce warrior when turn resets, but only block for dragon if dragon moved
    if (turnResetWarrior >= 0) {
      const isMultiplayer = newState.numberOfWarriors === 2;
      const justResetToPlayer1 = turnResetWarrior === 0;

      // In multiplayer, check if dragon actually moved
      // Dragon only moves after Player 2 (not after Player 1)
      const dragonMovedThisTurn = dragonWasAwake && (!isMultiplayer || justResetToPlayer1);

      if (dragonMovedThisTurn) {
        // Show the pre-dragon snapshot during the chime so dragon movement is
        // hidden, but warrior moves are already visible (CPU position is correct)
        set({ isDragonTurn: true, gameState: preDragonSS ?? JSON.parse(JSON.stringify(gameEngine.getState())) });

        // Debug log removed for production
        audioService.play('dragonChime');
        setTimeout(() => {
          // Debug log removed for production
          // Now reveal the actual post-move state (dragon position, warrior respawns, etc.)
          set({ gameState: JSON.parse(JSON.stringify(gameEngine.getState())) });
          audioService.play('dragonFlying');
          // Debug log removed for production
          setTimeout(() => {
            audioService.announceWarrior(turnResetWarrior);
            setTimeout(() => {
              // Debug log removed for production
              set({ isDragonTurn: false });
              triggerAITurnIfNeeded();
            }, 1000);
          }, DRAGON_TURN_DELAY);
        }, DRAGON_CHIME_DELAY);
        return; // gameState update handled above
      } else {
        // Dragon didn't move - just play warrior announcement
        // Brief delay to ensure sound starts playing before enabling input
        audioService.announceWarrior(turnResetWarrior);
        setTimeout(() => {
          set({ isDragonTurn: false });
        }, 100);
      }
    }

    set({ gameState: { ...newState } });

    // Trigger AI turn if CPU mode and it's now warrior 2's turn
    triggerAITurnIfNeeded();
  },

  // Finish turn
  finishTurn: (warriorNumber: number) => {
    const { gameEngine, gameState, isDragonTurn } = get();
    if (!gameEngine) return;
    
    // Block if dragon is taking its turn
    if (isDragonTurn) return;
    
    // Don't allow turn finish if warrior is dead or game is over
    if (!gameState || gameState.warriors[warriorNumber].lives <= 0) return;
    if (gameState.state === 5) return; // GameState.GameOver

    // Count "Next Turn" click as a valid move
    set({ totalMoves: get().totalMoves + 1 });

    // Deep-copy the entire game state BEFORE engine call — the engine mutates
    // its state in-place, so without this snapshot the UI would immediately show
    // dragon movement, warrior respawns, etc. before the chime delay finishes.
    const preFinishSS = JSON.parse(JSON.stringify(gameState)) as GameStateData;

    gameEngine.finishWarriorTurn(warriorNumber);
    const state = gameEngine.getState();

    const currentWarrior = state.state === 3 ? 0 : 1;

    // Check if a dragon attack message was set during finishWarriorTurn
    const messageAfterFinish = get().helpMessage;
    const dragonAttackOccurred = messageAfterFinish.includes('Dragon attacks') ||
                                  messageAfterFinish.includes('Dragon defeats');

    // Build the help message for the next turn
    let turnMessage: string | null = null;
    if (!dragonAttackOccurred) {
      const shouldTrackMoves = state.numberOfWarriors === 2 || state.dragon.state === 1;
      const { isCPUMode: cpuMode } = get();
      const warriorLabel = currentWarrior === 0 ? 'Warrior one' : (cpuMode ? 'CPU' : 'Warrior two');

      if (cpuMode && currentWarrior === 1) {
        turnMessage = `CPU's turn...`;
      } else if (shouldTrackMoves) {
        turnMessage = `${warriorLabel}'s turn with ${state.warriors[currentWarrior].moves} moves`;
      } else {
        turnMessage = `${warriorLabel}'s turn. Explore and find the dragon!`;
      }
    }

    // Determine if dragon moved
    const isMultiplayer = state.numberOfWarriors === 2;
    const isDragonAwake = state.dragon.state === 1;
    const justFinishedPlayer1 = warriorNumber === 0;
    const justFinishedPlayer2 = warriorNumber === 1;

    // Dragon only moves:
    // - In solo mode: after player's turn (if awake)
    // - In multiplayer: after BOTH players' turns (player 2 finishes)
    const dragonActuallyMoved = isDragonAwake && (!isMultiplayer || justFinishedPlayer2);

    if (dragonActuallyMoved) {
      // Show the pre-finish snapshot during the chime so warrior respawns,
      // dragon movement, life changes, etc. are all hidden until delay finishes
      set({ isDragonTurn: true, gameState: preFinishSS });
      if (turnMessage) set({ helpMessage: turnMessage });

      // Debug log removed for production
      audioService.play('dragonChime');
      setTimeout(() => {
        console.log(`%c[Store] dragon revealed`, 'color:#ff6b6b;font-weight:bold');
        // Now reveal the actual post-finish state (dragon position, warrior respawns, etc.)
        set({ gameState: JSON.parse(JSON.stringify(gameEngine.getState())) });
        audioService.play('dragonFlying');
        console.log(`%c[Store] dragon flying`, 'color:#ff6b6b;font-weight:bold');
        setTimeout(() => {
          audioService.announceWarrior(currentWarrior);
          setTimeout(() => {
            console.log(`%c[Store] dragon turn done isDragonTurn=false`, 'color:#ff6b6b;font-weight:bold');
            set({ isDragonTurn: false });
            triggerAITurnIfNeeded();
          }, 1000);
        }, DRAGON_TURN_DELAY);
      }, DRAGON_CHIME_DELAY);

      return; // gameState update deferred above
    } else if (isMultiplayer && justFinishedPlayer1) {
      // Two-player mode: Player 1 just finished, Player 2 is next
      // Play warrior announcement, then enable input after brief delay
      audioService.announceWarrior(1);
      // Brief delay to ensure sound starts playing before enabling input
      setTimeout(() => {
        set({ isDragonTurn: false });
        triggerAITurnIfNeeded();
      }, 100);
    } else {
      // Dragon is asleep - just announce next warrior
      audioService.announceWarrior(currentWarrior);
    }

    // Update state and message immediately (dragon didn't move)
    if (turnMessage) {
      set({ gameState: { ...state }, helpMessage: turnMessage });
    } else {
      set({ gameState: { ...state } });
    }

    // Trigger AI turn if CPU mode and it's now warrior 2's turn
    triggerAITurnIfNeeded();
  },

  // Toggle level
  toggleLevel: () => {
    const { gameEngine } = get();
    if (!gameEngine) return;

    gameEngine.toggleLevel();
    const state = gameEngine.getState();
    const message = `Switched to level ${state.level === 1 ? 'one (no doors)' : 'two (with doors)'}`;

    set({
      gameState: state,
      helpMessage: message,
    });

    audioService.announceLevel(state.level);
  },

  // Reset game
  resetGame: () => {
    const { gameState, aiController, isCPUMode } = get();
    // Abort any running AI turn
    if (aiController) aiController.abort();
    if (gameState) {
      const mode = isCPUMode ? GameMode.VsCPU : gameState.mode;
      get().initGame(mode, gameState.numberOfWarriors, gameState.level);
    }
  },

  // Toggle help
  toggleHelp: () => {
    set((state) => ({ showHelp: !state.showHelp }));
  },

  // Set help message
  setHelpMessage: (message: string, _temporary: boolean = false) => {
    // Always set the message and keep it visible
    // Messages only disappear when replaced by another message
    set({ helpMessage: message });
  },

  // Handle game events
  handleGameEvent: (event: GameEvent) => {
    const { gameState } = get();
    if (!gameState) return;

    let message = '';

    switch (event.type) {
      case 'WARRIOR_MOVED':
        set({ totalMoves: get().totalMoves + 1 });
        const moves = gameState.warriors[event.warriorNumber].moves;
        const warriorName = event.warriorNumber === 0 ? 'one' : 'two';
        
        // Only mention moves if tracking them (multiplayer or solo with dragon awake)
        const shouldTrackMoves = gameState.numberOfWarriors === 2 || gameState.dragon.state === 1; // 1 = Awake
        
        if (shouldTrackMoves) {
          if (moves > 0) {
            message = `✓ Warrior ${warriorName} moved successfully. ${moves} move${moves === 1 ? '' : 's'} remaining this turn.`;
          } else {
            message = `Warrior ${warriorName} has used all moves. Click "Next Turn" to continue.`;
          }
        } else {
          // Solo mode, dragon asleep - no mention of moves
          message = `✓ Warrior ${warriorName} moved successfully. Keep exploring!`;
        }
        break;

      case 'DRAGON_AWAKE':
        // Block input immediately — the dragonWakes sound needs to play fully
        // before the player can continue. The moveWarrior method handles the
        // timed unblock after the sound finishes.
        set({ isDragonTurn: true });
        if (gameState.numberOfWarriors === 1) {
          const moves = gameState.warriors[0].moves;
          message = `🐉 DRAGON SPOTTED! You can see the dragon now. It's hunting you! You have ${moves} moves this turn.`;
        } else {
          message = '🐉 THE DRAGON AWAKENS! It has sensed your presence and is now hunting you!';
        }
        break;

      case 'DRAGON_MOVED':
        // Message and sound are deferred — they play after the dragon chime delay
        // (see dragonChime setTimeout blocks in moveWarrior/finishTurn/doorClosed)
        break;

      case 'DRAGON_ATTACK':
        // Only count human player deaths (skip CPU deaths in vs CPU mode)
        if (!(get().isCPUMode && event.warriorNumber === 1)) {
          set({ totalDeaths: get().totalDeaths + 1 });
        }
        const lives = gameState.warriors[event.warriorNumber].lives;
        const attackedWarrior = event.warriorNumber === 0 ? 'one' : 'two';
        
        // Trigger death flash effect
        set({ showDeathFlash: true });
        setTimeout(() => set({ showDeathFlash: false }), 1000);
        
        if (lives > 0) {
          message = `💥 Dragon attacks warrior ${attackedWarrior}! Respawned. ${lives} ${lives === 1 ? 'life' : 'lives'} remaining.`;
        } else {
          message = `💀 Dragon defeats warrior ${attackedWarrior}! They have fallen in battle.`;
        }
        break;

      case 'TREASURE_FOUND':
        // Combined message - treasure found AND dragon will chase
        if (gameState.numberOfWarriors === 1) {
          message = `🏆 TREASURE FOUND! Warrior ${event.warriorNumber === 0 ? 'one' : 'two'} has the treasure! 🐉 The dragon is now chasing you! Return to The Waystone to win!`;
        } else {
          message = `🏆 TREASURE FOUND! Warrior ${event.warriorNumber === 0 ? 'one' : 'two'} has the treasure! Return it to The Waystone to win!`;
        }
        // Trigger flash effect
        set({ showTreasureFlash: true });
        setTimeout(() => set({ showTreasureFlash: false }), 1000);
        break;

      case 'WARRIOR_BATTLE':
        const winnerName = event.winner === 0 ? 'one' : 'two';
        const loserName = event.loser === 0 ? 'one' : 'two';
        message = `⚔️ WARRIORS CLASH! Warrior ${winnerName} wins the battle and takes the treasure from warrior ${loserName}!`;

        // Block input immediately while scuffle plays
        set({ isDragonTurn: true });

        // Trigger battle shake effect
        set({ showBattleShake: true });
        setTimeout(() => set({ showBattleShake: false }), 600);
        
        // Keep message visible for 3 seconds to ensure it's read
        setTimeout(() => {
          // Only clear if this battle message is still showing
          if (get().helpMessage.includes('WARRIORS CLASH')) {
            const state = get().gameState;
            if (state) {
              const currentWarrior = state.state === 3 ? 0 : 1;
              const moves = state.warriors[currentWarrior].moves;
              get().setHelpMessage(`Warrior ${currentWarrior === 0 ? 'one' : 'two'}'s turn with ${moves} moves`);
            }
          }
        }, 3000);
        break;

      case 'WARRIOR_KILLED':
        message = `💀 Warrior ${event.warriorNumber === 0 ? 'one' : 'two'} has been slain by the dragon!`;
        break;

      case 'GAME_WON': {
        const winnerName = event.warriorNumber === 0 ? 'one' : 'two';
        const { isCPUMode: cpuGameWon } = get();
        const cpuWon = cpuGameWon && event.warriorNumber === 1;

        if (cpuWon) {
          // CPU returned treasure to waystone — this is a loss for the player
          message = `💀 DEFEAT! The CPU has returned the treasure to its Waystone. You lose!`;
          set({ gameWon: false, gameEndTime: Date.now() });
          if (supabaseService.isEnabled()) {
            setTimeout(() => set({ showPlayerNameModal: true }), 2000);
          }
        } else {
          message = `🏆 VICTORY! Warrior ${winnerName} has returned the treasure to The Waystone!`;
          // Trigger victory fireworks
          set({ showVictoryFireworks: true, gameWon: true, gameEndTime: Date.now() });
          setTimeout(() => {
            set({ showVictoryFireworks: false });
            if (supabaseService.isEnabled()) {
              setTimeout(() => set({ showPlayerNameModal: true }), 500);
            }
          }, 5000);
        }
        break;
      }

      case 'GAME_LOST':
        message = '💀 GAME OVER! All warriors have fallen to the dragon. The treasure remains lost forever...';
        set({ gameWon: false, gameEndTime: Date.now() });
        if (supabaseService.isEnabled()) {
          setTimeout(() => set({ showPlayerNameModal: true }), 2000);
        }
        break;

      case 'WALL_HIT':
        set({ totalMoves: get().totalMoves + 1 });
        const wallWarriorName = event.warriorNumber === 0 ? 'one' : 'two';
        const movesLeft = gameState.warriors[event.warriorNumber].moves;
        
        // Only mention moves if tracking them (multiplayer or solo with dragon awake)
        const trackingMoves = gameState.numberOfWarriors === 2 || gameState.dragon.state === 1; // 1 = Awake
        
        if (trackingMoves) {
          if (movesLeft > 0) {
            message = `🧱 WALL DISCOVERED! Warrior ${wallWarriorName} found a wall. ${movesLeft} move${movesLeft === 1 ? '' : 's'} remaining.`;
          } else {
            message = `🧱 WALL DISCOVERED! Warrior ${wallWarriorName} found a wall. No moves remaining - turn ended.`;
          }
        } else {
          // Solo mode, dragon asleep - no mention of moves
          message = `🧱 WALL DISCOVERED! Warrior ${wallWarriorName} found a wall.`;
        }
        break;

      case 'DOOR_CLOSED':
        set({ totalMoves: get().totalMoves + 1 });
        // Trigger door flash effect
        set({ showDoorFlash: true });
        setTimeout(() => set({ showDoorFlash: false }), 800);

        // Block input immediately (prevents AI/human from moving during door animation)
        set({ isDragonTurn: true });

        const doorWarriorName = event.warriorNumber === 0 ? 'one' : 'two';
        message = `🚪 DOOR LOCKED! Warrior ${doorWarriorName} found a closed door. Turn ended.`;

        // Play door sound, then finish turn
        audioService.play('door').then(() => {
          // After door sound finishes, finish the warrior's turn
          const { gameEngine, gameState } = get();
          if (gameEngine && gameState) {
            const isSolo = gameState.numberOfWarriors === 1;
            const isMultiplayer = gameState.numberOfWarriors === 2;
            const dragonIsAwake = gameState.dragon.state === 1;

            // Deep-copy the entire game state BEFORE engine call — the engine mutates
            // its state in-place, so without this snapshot the UI would immediately show
            // dragon movement, warrior respawns, etc. before the chime delay finishes.
            const preDoorSS = JSON.parse(JSON.stringify(gameState)) as GameStateData;

            gameEngine.finishWarriorTurn(event.warriorNumber);
            const newState = gameEngine.getState();
            const currentWarrior = newState.state === 3 ? 0 : 1;

            // In solo mode with dragon asleep, no pause needed
            if (isSolo && !dragonIsAwake) {
              // Just re-enable input immediately, no announcement needed
              set({ gameState: { ...newState }, isDragonTurn: false });
              return;
            }

            // Check if we need to wait for dragon
            // Dragon only moves in multiplayer after Player 2, not after Player 1
            const justFinishedPlayer1 = event.warriorNumber === 0;
            const dragonWillMove = dragonIsAwake && (!isMultiplayer || !justFinishedPlayer1);

            if (dragonWillMove) {
              // Show the pre-door snapshot during the chime so warrior respawns,
              // dragon movement, life changes, etc. are all hidden until delay finishes
              set({ gameState: preDoorSS });

              // Debug log removed for production
              audioService.play('dragonChime');
              setTimeout(() => {
                // Debug log removed for production
                // Now reveal the actual post-door state (dragon position, warrior respawns, etc.)
                set({ gameState: JSON.parse(JSON.stringify(gameEngine.getState())) });
                audioService.play('dragonFlying');
                // Debug log removed for production
                setTimeout(() => {
                  audioService.announceWarrior(currentWarrior);
                  setTimeout(() => {
                    // Debug log removed for production
                    set({ isDragonTurn: false });
                    triggerAITurnIfNeeded();
                  }, 1000); // Re-enable after warrior announcement completes
                }, DRAGON_TURN_DELAY);
              }, DRAGON_CHIME_DELAY);
            } else if (isMultiplayer && justFinishedPlayer1) {
              // Multiplayer, Player 1 hit door, transition to Player 2
              set({ gameState: { ...newState } });
              audioService.announceWarrior(1);
              setTimeout(() => {
                set({ isDragonTurn: false });
                triggerAITurnIfNeeded();
              }, 100);
            } else {
              // Solo mode with dragon awake - announce and re-enable after 1 second
              set({ gameState: { ...newState } });
              audioService.announceWarrior(currentWarrior);
              setTimeout(() => {
                set({ isDragonTurn: false });
              }, 1000);
            }
          }
        });
        break;

      case 'ILLEGAL_MOVE':
        message = '⚠️ Illegal move! You can only move to adjacent chambers (one space at a time).';
        break;
    }

    if (message) {
      get().setHelpMessage(message, true);
    }

    // Play sound for event
    // DOOR_CLOSED: handled manually (plays door sound, then finishes turn)
    // DRAGON_MOVED: deferred — chime plays first, then dragon flying sound plays after delay
    // DRAGON_AWAKE: handled manually in moveWarrior (blocks input while sound plays)
    if (event.type !== 'DOOR_CLOSED' && event.type !== 'DRAGON_MOVED' && event.type !== 'DRAGON_AWAKE' && event.type !== 'WARRIOR_BATTLE') {
      audioService.playForEvent(event);
    }
  },

  // Submit score to leaderboard
  submitScore: async (playerName: string) => {
    const { gameState, gameStartTime, gameEndTime, gameWon, chamberPaths, totalMoves, totalDeaths } = get();

    if (!gameState || !gameStartTime || !gameEndTime) {
      console.error('Cannot submit score: missing game data');
      return;
    }

    const gameTime = gameEndTime - gameStartTime;
    const gameMode = gameState.numberOfWarriors === 1 ? 'solo' : 'multiplayer';
    const gameResult = gameWon ? 'win' : 'loss';
    const difficultyLevel = gameState.level as 1 | 2;
    const wallsDiscoveredPct = calculateWallsDiscoveredPct(chamberPaths, gameState.discoveredWalls);
    const vsCpu = gameState.mode === GameMode.VsCPU;

    const success = await supabaseService.submitScore(
      gameTime,
      gameResult,
      gameMode,
      difficultyLevel,
      playerName,
      totalMoves,
      totalDeaths,
      wallsDiscoveredPct,
      vsCpu
    );

    if (success) {
      // Get the rank of the submitted score
      // For wins, we use 'fastest' category; for losses, we also use 'fastest' (fastest loss)
      const category = 'fastest';
      const rankResult = await supabaseService.getScoreRank(gameTime, gameResult, gameMode, category);

      // Store submission result and show leaderboard
      set({
        showPlayerNameModal: false,
        showLeaderboardAfterGame: true,
        submissionResult: rankResult ? { ...rankResult, gameMode, gameResult } : null,
      });
    } else {
      // If submission failed, just close the modal
      set({ showPlayerNameModal: false, submissionResult: null });
      console.error('Failed to submit score to leaderboard');
    }
  },

  // Skip score submission
  skipScoreSubmission: () => {
    set({ showPlayerNameModal: false });
  },

  // Close leaderboard
  closeLeaderboard: () => {
    set({ showLeaderboardAfterGame: false });
  },
}));

/**
 * Trigger AI turn when it's warrior 2's turn in CPU mode.
 * Called after state transitions; the AI waits for dragon animations internally.
 * Uses function declaration (hoisted) so it's available inside store actions above.
 */
function triggerAITurnIfNeeded(): void {
  const state = useGameStore.getState();
  const { aiController, isCPUMode, gameEngine } = state;
  if (!isCPUMode || !aiController || !gameEngine) return;

  const gs = gameEngine.getState();
  if (gs.state !== GameState.WarriorTwoTurn) return;

  // Don't trigger if AI is already executing
  if (aiController.isExecuting) return;

  useGameStore.setState({ isAIThinking: true });

  aiController.executeTurn(
    () => useGameStore.getState().gameEngine?.getState() ?? null,
    (wn: number, pos: Position) => useGameStore.getState().moveWarrior(wn, pos),
    (wn: number) => useGameStore.getState().finishTurn(wn),
    () => useGameStore.getState().isDragonTurn,
  ).finally(() => {
    useGameStore.setState({ isAIThinking: false });
  });
}
