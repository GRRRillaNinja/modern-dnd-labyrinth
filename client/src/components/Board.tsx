import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { Chamber } from './Chamber';
import { useGameStore } from '../store/gameStore';
import { useReplayStore } from '../store/replayStore';
import { Position, GameState, VIEWPORT_SIZE } from '@shared/types';

const ARROW_KEY_OFFSETS: Record<string, [number, number]> = {
  ArrowUp:    [-1,  0],
  ArrowDown:  [ 1,  0],
  ArrowLeft:  [ 0, -1],
  ArrowRight: [ 0,  1],
};

// How many tiles from the viewport edge before the camera starts scrolling
// 0 = player must be at the very edge of the viewport before scrolling occurs
const SCROLL_MARGIN = 0;

function adjustViewportAxis(
  playerCoord: number,
  currentOffset: number,
  dungeonSize: number,
): number {
  const maxOffset = dungeonSize - VIEWPORT_SIZE;
  const vpMin = currentOffset;
  const vpMax = currentOffset + VIEWPORT_SIZE - 1;

  let newOffset = currentOffset;

  if (playerCoord < vpMin + SCROLL_MARGIN) {
    newOffset = playerCoord - SCROLL_MARGIN;
  } else if (playerCoord > vpMax - SCROLL_MARGIN) {
    newOffset = playerCoord - (VIEWPORT_SIZE - 1 - SCROLL_MARGIN);
  }

  return Math.max(0, Math.min(maxOffset, newOffset));
}

function centeredOffset(dungeonSize: number): { row: number; col: number } {
  if (dungeonSize <= VIEWPORT_SIZE) return { row: 0, col: 0 };
  const centered = Math.floor((dungeonSize - VIEWPORT_SIZE) / 2);
  return { row: centered, col: centered };
}

export const Board: React.FC = () => {
  const { gameState, chamberPaths, moveWarrior, setWarriorRoom, isDragonTurn, isCPUMode } = useGameStore();

  // Viewport offset stored in a ref (mutated directly) + a render counter to trigger re-renders
  const dungeonSize = gameState?.dungeonSize ?? 8;
  const offsetRef = useRef(centeredOffset(dungeonSize));
  const [, forceRender] = React.useState(0);

  // Reset to centered when a new game starts
  const gamePhase = gameState?.state;
  const prevGamePhaseRef = useRef(gamePhase);
  if (gamePhase === GameState.WarriorOneSelectRoom && prevGamePhaseRef.current !== GameState.WarriorOneSelectRoom) {
    offsetRef.current = centeredOffset(dungeonSize);
  }
  prevGamePhaseRef.current = gamePhase;

  // Helper: update viewport to keep a position visible, only scrolling axes that need it
  const scrollToKeepVisible = useCallback((pos: Position) => {
    if (dungeonSize <= VIEWPORT_SIZE) return;
    const prev = offsetRef.current;
    const newRow = adjustViewportAxis(pos[0], prev.row, dungeonSize);
    const newCol = adjustViewportAxis(pos[1], prev.col, dungeonSize);
    if (newRow !== prev.row || newCol !== prev.col) {
      offsetRef.current = { row: newRow, col: newCol };
      forceRender(n => n + 1);
    }
  }, [dungeonSize]);

  const handleChamberClick = useCallback((position: Position) => {
    if (!gameState) return;
    // Block all interaction during replay
    if (useReplayStore.getState().isReplaying) return;
    const state = gameState.state;

    // Block clicks during AI turn in CPU mode
    if (isCPUMode && (state === GameState.WarriorTwoTurn || state === GameState.WarriorTwoSelectRoom)) {
      return;
    }

    // Selecting secret rooms — no viewport shift
    if (state === GameState.WarriorOneSelectRoom) {
      setWarriorRoom(0, position);
    } else if (state === GameState.WarriorTwoSelectRoom) {
      setWarriorRoom(1, position);
    }
    // Moving warriors — scroll viewport to keep the target position visible
    else if (state === GameState.WarriorOneTurn) {
      scrollToKeepVisible(position);
      moveWarrior(0, position);
    } else if (state === GameState.WarriorTwoTurn) {
      scrollToKeepVisible(position);
      moveWarrior(1, position);
    }
  }, [gameState, isCPUMode, moveWarrior, setWarriorRoom, scrollToKeepVisible]);

  // Keyboard arrow key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const kbOffset = ARROW_KEY_OFFSETS[e.key];
      if (!kbOffset) return;

      const state = useGameStore.getState();
      const gs = state.gameState;
      if (!gs || state.isDragonTurn || useReplayStore.getState().isReplaying) return;

      const dSize = gs.dungeonSize;

      // Determine which warrior is active
      let warriorIndex = -1;
      if (gs.state === GameState.WarriorOneTurn) warriorIndex = 0;
      else if (gs.state === GameState.WarriorTwoTurn && !state.isCPUMode) warriorIndex = 1;
      if (warriorIndex < 0) return;

      const pos = gs.warriors[warriorIndex].position;
      if (!pos) return;
      const target: Position = [pos[0] + kbOffset[0], pos[1] + kbOffset[1]];

      // Bounds check
      if (target[0] < 0 || target[0] >= dSize || target[1] < 0 || target[1] >= dSize) return;

      e.preventDefault();
      handleChamberClick(target);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleChamberClick]);

  // Also track AI/dragon-caused position changes (respawns, etc.)
  const prevW0PosRef = useRef<string | null>(null);
  const prevW1PosRef = useRef<string | null>(null);
  useEffect(() => {
    if (!gameState) return;
    const isMovement = gameState.state === GameState.WarriorOneTurn || gameState.state === GameState.WarriorTwoTurn;
    if (!isMovement) {
      // Reset tracking on non-movement phases
      prevW0PosRef.current = null;
      prevW1PosRef.current = null;
      return;
    }

    const warriorIdx = gameState.state === GameState.WarriorOneTurn ? 0 : 1;
    const pos = gameState.warriors[warriorIdx].position;
    if (!pos) return;

    const posKey = `${pos[0]},${pos[1]}`;
    const prevRef = warriorIdx === 0 ? prevW0PosRef : prevW1PosRef;

    // If prev is null, this is the first time we see this warrior's turn — seed without scrolling
    if (prevRef.current === null) {
      prevRef.current = posKey;
      return;
    }

    // Position changed externally (respawn, AI move) — scroll to keep visible
    if (posKey !== prevRef.current) {
      prevRef.current = posKey;
      scrollToKeepVisible(pos);
    }
  }, [gameState, scrollToKeepVisible]);

  if (!gameState) return null;

  const offset = offsetRef.current;

  // Off-screen entity indicators
  const indicators = useMemo(() => {
    if (dungeonSize <= VIEWPORT_SIZE) return [];

    const items: { direction: string; emoji: string; label: string }[] = [];
    const vpRowMin = offset.row;
    const vpRowMax = offset.row + VIEWPORT_SIZE - 1;
    const vpColMin = offset.col;
    const vpColMax = offset.col + VIEWPORT_SIZE - 1;

    const isOffScreen = (pos: Position) =>
      pos[0] < vpRowMin || pos[0] > vpRowMax || pos[1] < vpColMin || pos[1] > vpColMax;

    const getDirection = (pos: Position) => {
      const dirs: string[] = [];
      if (pos[0] < vpRowMin) dirs.push('top');
      if (pos[0] > vpRowMax) dirs.push('bottom');
      if (pos[1] < vpColMin) dirs.push('left');
      if (pos[1] > vpColMax) dirs.push('right');
      return dirs;
    };

    // Dragon indicator
    if (gameState.dragon.visible && gameState.dragon.position && isOffScreen(gameState.dragon.position)) {
      const dirs = getDirection(gameState.dragon.position);
      dirs.forEach(d => items.push({ direction: d, emoji: '🐉', label: 'Dragon' }));
    }

    // Treasure indicator (on ground)
    if (gameState.treasure.visible && gameState.treasure.warrior < 0 && gameState.treasure.room && isOffScreen(gameState.treasure.room)) {
      const dirs = getDirection(gameState.treasure.room);
      dirs.forEach(d => items.push({ direction: d, emoji: '🏆', label: 'Treasure' }));
    }

    // Other warrior indicator (in multiplayer)
    if (gameState.numberOfWarriors === 2) {
      const activeIdx = gameState.state === GameState.WarriorTwoTurn || gameState.state === GameState.WarriorTwoSelectRoom ? 1 : 0;
      const otherIdx = activeIdx === 0 ? 1 : 0;
      const otherPos = gameState.warriors[otherIdx].position;
      if (otherPos && gameState.warriors[otherIdx].lives > 0 && isOffScreen(otherPos)) {
        const dirs = getDirection(otherPos);
        dirs.forEach(d => items.push({ direction: d, emoji: otherIdx === 0 ? '🗡️' : '⚔️', label: `Warrior ${otherIdx + 1}` }));
      }
    }

    return items;
  }, [gameState, dungeonSize, offset.row, offset.col]);

  // Memoize chamber grid to prevent unnecessary re-renders
  const chambers = useMemo(() =>
    Array.from({ length: VIEWPORT_SIZE }).flatMap((_, vRow) =>
      Array.from({ length: VIEWPORT_SIZE }).map((_, vCol) => {
        const row = vRow + offset.row;
        const col = vCol + offset.col;
        const position: Position = [row, col];
        const paths = chamberPaths[row]?.[col];

        return (
          <Chamber
            key={`${row}-${col}`}
            position={position}
            paths={paths}
            gameState={gameState}
            onClick={() => handleChamberClick(position)}
            isDragonTurn={isDragonTurn}
            isViewportTop={vRow === 0}
            isViewportLeft={vCol === 0}
          />
        );
      })
    ),
    [gameState, chamberPaths, isDragonTurn, handleChamberClick, offset.row, offset.col]
  );

  return (
    <div id="board-container" className="relative flex items-center justify-center p-2 w-full" style={{ minHeight: '300px' }}>
      {/* Board Frame Wrapper */}
      <div
        id="board-frame-wrapper"
        className="relative"
        style={{
          width: 'min(100%, calc(100vh - 180px))',
          aspectRatio: '1',
          overflow: 'visible'
        }}
      >
        {/* Background board with ornate frame */}
        <div id="board-background" className="absolute inset-0">
          {/* Board frame image */}
          <div
            id="board-frame-image"
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/textures/board-frame.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Inner board area - dark background for grid */}
          <div
            id="board-inner-area"
            className="absolute rounded"
            style={{
              top: '5%',
              left: '5%',
              right: '5%',
              bottom: '5%',
              background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
            }}
          />
        </div>

        {/* 8x8 Chamber Grid (viewport into larger dungeon) */}
        <div id="board-grid" className="relative w-full h-full grid grid-cols-8 grid-rows-8 gap-1" style={{ overflow: 'visible', padding: 'max(6%, 1rem)' }}>
          {chambers}
        </div>

        {/* Off-screen entity indicators */}
        {indicators.map((ind, i) => (
          <div
            key={`indicator-${ind.direction}-${ind.label}-${i}`}
            className="absolute pointer-events-none z-20 flex items-center justify-center animate-pulse"
            title={`${ind.label} is off-screen`}
            style={{
              fontSize: '1.2rem',
              ...(ind.direction === 'top' && { top: '1%', left: '50%', transform: 'translateX(-50%)' }),
              ...(ind.direction === 'bottom' && { bottom: '1%', left: '50%', transform: 'translateX(-50%)' }),
              ...(ind.direction === 'left' && { left: '1%', top: '50%', transform: 'translateY(-50%)' }),
              ...(ind.direction === 'right' && { right: '1%', top: '50%', transform: 'translateY(-50%)' }),
              textShadow: '0 0 8px rgba(255,200,0,0.8), 0 0 16px rgba(255,100,0,0.5)',
            }}
          >
            <span>{ind.emoji}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
