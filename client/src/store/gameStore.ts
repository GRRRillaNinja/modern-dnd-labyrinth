import { create } from 'zustand';
import {
  GameStateData,
  GameSettings,
  Position,
  ChamberPath,
  GameEvent,
  GameMode,
  DEFAULT_SETTINGS,
  DiscoveredWalls,
} from '@shared/types';
import { GameEngine } from '../game/GameEngine';
import { MazeGenerator } from '../game/MazeGenerator';
import { audioService } from '../services/AudioService';

// Dragon turn delay (milliseconds) - time to wait for dragon flying sound and movement animation
const DRAGON_TURN_DELAY = 2500;

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

  // Initialize game
  initGame: (mode: GameMode, numberOfWarriors: number, level: number) => {
    const { settings } = get();
    
    // Create game engine
    const engine = new GameEngine(settings);
    
    // Generate maze
    const mazeGen = new MazeGenerator(settings);
    const maze = mazeGen.generate();
    
    // Start game
    engine.startGame(numberOfWarriors);
    
    // Set the level BEFORE setting the maze (so door initialization works correctly)
    const state = engine.getState();
    state.level = level;
    
    // Now set the maze (this will initialize locked doors for level 2)
    engine.setMaze(maze.chamberPaths);
    
    // Subscribe to events
    engine.on((event) => get().handleGameEvent(event));
    
    set({
      gameEngine: engine,
      gameState: engine.getState(),
      chamberPaths: maze.chamberPaths,
      helpMessage: numberOfWarriors === 1 
        ? 'Pick a Waystone location for warrior one'
        : 'Player 1: Pick a Waystone location for warrior one',
      gameWon: false, // Reset game result
      gameStartTime: null, // Reset timer
      gameEndTime: null,
    });

    audioService.announceWarrior(0);
  },

  // Set warrior secret room
  setWarriorRoom: (warriorNumber: number, position: Position) => {
    const { gameEngine } = get();
    if (!gameEngine) return;

    const success = gameEngine.setWarriorSecretRoom(warriorNumber, position);
    
    if (success) {
      const state = gameEngine.getState();
      let message = '';

      if (state.state === 2) { // WarriorTwoSelectRoom (value is 2)
        message = 'Player 2: Pick a Waystone location for warrior two';
        // Play announcement and update state
        audioService.announceWarrior(1);
      } else if (state.state === 3 || state.state === 4) { // Warrior turns
        const currentWarrior = state.state === 3 ? 0 : 1;
        
        // Only mention moves if tracking them (multiplayer or solo with dragon awake)
        const shouldTrackMoves = state.numberOfWarriors === 2 || state.dragon.state === 1; // 1 = Awake
        
        if (shouldTrackMoves) {
          message = `Warrior ${currentWarrior === 0 ? 'one' : 'two'}'s turn with ${state.warriors[currentWarrior].moves} moves`;
        } else {
          message = `Warrior ${currentWarrior === 0 ? 'one' : 'two'}'s turn. Explore and find the dragon!`;
        }
        
        audioService.announceWarrior(currentWarrior);
      }

      set({
        gameState: state,
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
      gameState: state,
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

    gameEngine.moveWarrior(warriorNumber, position);
    const newState = gameEngine.getState();
    
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
      const justResetToPlayer2 = turnResetWarrior === 1;
      const justResetToPlayer1 = turnResetWarrior === 0;
      
      // In multiplayer, check if dragon actually moved
      // Dragon only moves after Player 2 (not after Player 1)
      const dragonMovedThisTurn = dragonWasAwake && (!isMultiplayer || justResetToPlayer1);
      
      if (dragonMovedThisTurn) {
        // Dragon moved - block for dragon sound + warrior announcement
        set({ isDragonTurn: true });
        setTimeout(() => {
          audioService.announceWarrior(turnResetWarrior);
          setTimeout(() => {
            set({ isDragonTurn: false });
          }, 1000);
        }, DRAGON_TURN_DELAY);
      } else {
        // Dragon didn't move - just play warrior announcement
        // Brief delay to ensure sound starts playing before enabling input
        audioService.announceWarrior(turnResetWarrior);
        setTimeout(() => {
          set({ isDragonTurn: false });
        }, 100);
      }
    }
    
    set({ gameState: newState });
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

    // Store current help message to check if dragon attack happened
    const messageBeforeFinish = get().helpMessage;

    gameEngine.finishWarriorTurn(warriorNumber);
    const state = gameEngine.getState();
    
    const currentWarrior = state.state === 3 ? 0 : 1;
    
    // Check if a dragon attack message was set during finishWarriorTurn
    const messageAfterFinish = get().helpMessage;
    const dragonAttackOccurred = messageAfterFinish.includes('Dragon attacks') || 
                                  messageAfterFinish.includes('Dragon defeats');
    
    // Only set turn message if no dragon attack occurred
    if (!dragonAttackOccurred) {
      // Only mention moves if tracking them (multiplayer or solo with dragon awake)
      const shouldTrackMoves = state.numberOfWarriors === 2 || state.dragon.state === 1; // 1 = Awake
      
      let message;
      if (shouldTrackMoves) {
        message = `Warrior ${currentWarrior === 0 ? 'one' : 'two'}'s turn with ${state.warriors[currentWarrior].moves} moves`;
      } else {
        message = `Warrior ${currentWarrior === 0 ? 'one' : 'two'}'s turn. Explore and find the dragon!`;
      }

      set({
        gameState: state,
        helpMessage: message,
      });
    } else {
      // Dragon attack occurred, keep that message but update game state
      set({
        gameState: state,
      });
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
      // Dragon moved - block input, play dragon sound, then announce warrior
      set({ isDragonTurn: true });
      setTimeout(() => {
        audioService.announceWarrior(currentWarrior);
        setTimeout(() => {
          set({ isDragonTurn: false });
        }, 1000);
      }, DRAGON_TURN_DELAY);
    } else if (isMultiplayer && justFinishedPlayer1) {
      // Two-player mode: Player 1 just finished, Player 2 is next
      // Play warrior announcement, then enable input after brief delay
      audioService.announceWarrior(1);
      // Brief delay to ensure sound starts playing before enabling input
      setTimeout(() => {
        set({ isDragonTurn: false });
      }, 100);
    } else {
      // Dragon is asleep - just announce next warrior
      audioService.announceWarrior(currentWarrior);
    }
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
    const { gameState } = get();
    if (gameState) {
      get().initGame(gameState.mode, gameState.numberOfWarriors, gameState.level);
    }
  },

  // Toggle help
  toggleHelp: () => {
    set((state) => ({ showHelp: !state.showHelp }));
  },

  // Set help message
  setHelpMessage: (message: string, temporary: boolean = false) => {
    // Always set the message and keep it visible
    // Messages only disappear when replaced by another message
    set({ helpMessage: message });
  },

  // Handle game events
  handleGameEvent: (event: GameEvent) => {
    const { gameState } = get();
    if (!gameState) return;

    let message = '';
    const currentWarrior = gameState.state === 3 ? 0 : 1;

    switch (event.type) {
      case 'WARRIOR_MOVED':
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
        if (gameState.numberOfWarriors === 1) {
          const moves = gameState.warriors[0].moves;
          message = `🐉 DRAGON SPOTTED! You can see the dragon now. It's hunting you! You have ${moves} moves this turn.`;
        } else {
          message = '🐉 THE DRAGON AWAKENS! It has sensed your presence and is now hunting you!';
        }
        break;

      case 'DRAGON_MOVED':
        // Don't overwrite treasure found message with dragon movement
        const currentMessage = get().helpMessage;
        if (currentMessage && currentMessage.includes('TREASURE FOUND')) {
          // Keep the treasure found message, don't overwrite it
          break;
        }
        
        if (gameState.treasure.warrior >= 0) {
          message = `🐉 Dragon is chasing warrior ${gameState.treasure.warrior === 0 ? 'one' : 'two'} who carries the treasure!`;
        } else if (gameState.treasure.visible) {
          message = '🐉 Dragon returns to guard the treasure.';
        } else {
          message = '🐉 You hear the dragon moving in the distance...';
        }
        break;

      case 'DRAGON_ATTACK':
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

      case 'GAME_WON':
        message = `🏆 VICTORY! Warrior ${event.warriorNumber === 0 ? 'one' : 'two'} has returned the treasure to The Waystone!`;
        
        // Trigger victory fireworks
        set({ showVictoryFireworks: true, gameWon: true, gameEndTime: Date.now() });
        // Keep fireworks for 5 seconds
        setTimeout(() => set({ showVictoryFireworks: false }), 5000);
        break;

      case 'GAME_LOST':
        message = '💀 GAME OVER! All warriors have fallen to the dragon. The treasure remains lost forever...';
        set({ gameWon: false, gameEndTime: Date.now() });
        break;

      case 'WALL_HIT':
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
        // Trigger door flash effect
        set({ showDoorFlash: true });
        setTimeout(() => set({ showDoorFlash: false }), 800);
        
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
            
            gameEngine.finishWarriorTurn(event.warriorNumber);
            const newState = gameEngine.getState();
            const currentWarrior = newState.state === 3 ? 0 : 1;
            
            // In solo mode with dragon asleep, no pause needed
            if (isSolo && !dragonIsAwake) {
              // Just re-enable input immediately, no announcement needed
              set({ gameState: newState, isDragonTurn: false });
              return;
            }
            
            // Block player input for announcement/dragon turn
            set({ isDragonTurn: true });
            
            // Check if we need to wait for dragon
            // Dragon only moves in multiplayer after Player 2, not after Player 1
            const justFinishedPlayer1 = event.warriorNumber === 0;
            const dragonWillMove = dragonIsAwake && (!isMultiplayer || !justFinishedPlayer1);
            
            if (dragonWillMove) {
              // Dragon turn is happening, wait for dragon flying sound + warrior announcement
              setTimeout(() => {
                audioService.announceWarrior(currentWarrior);
                setTimeout(() => {
                  set({ isDragonTurn: false });
                }, 1000); // Re-enable after warrior announcement completes
              }, DRAGON_TURN_DELAY);
            } else if (isMultiplayer && justFinishedPlayer1) {
              // Multiplayer, Player 1 hit door, transition to Player 2
              // Play warrior announcement, then enable input after brief delay
              audioService.announceWarrior(1);
              // Brief delay to ensure sound starts playing before enabling input
              setTimeout(() => {
                set({ isDragonTurn: false });
              }, 100);
            } else {
              // Solo mode with dragon awake - announce and re-enable after 1 second
              audioService.announceWarrior(currentWarrior);
              setTimeout(() => {
                set({ isDragonTurn: false });
              }, 1000);
            }
            
            set({ gameState: newState });
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

    // Play sound for event (except DOOR_CLOSED which we handle manually)
    if (event.type !== 'DOOR_CLOSED') {
      audioService.playForEvent(event);
    }
  },
}));
