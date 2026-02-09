import React from 'react';
import { Chamber } from './Chamber';
import { useGameStore } from '../store/gameStore';
import { Position, GameState } from '@shared/types';

export const Board: React.FC = () => {
  const { gameState, chamberPaths, moveWarrior, setWarriorRoom, isDragonTurn, isCPUMode } = useGameStore();

  if (!gameState) return null;

  const handleChamberClick = (position: Position) => {
    const state = gameState.state;

    // Block clicks during AI turn in CPU mode
    if (isCPUMode && (state === GameState.WarriorTwoTurn || state === GameState.WarriorTwoSelectRoom)) {
      return;
    }

    // Selecting secret rooms
    if (state === GameState.WarriorOneSelectRoom) {
      setWarriorRoom(0, position);
    } else if (state === GameState.WarriorTwoSelectRoom) {
      setWarriorRoom(1, position);
    }
    // Moving warriors
    else if (state === GameState.WarriorOneTurn) {
      moveWarrior(0, position);
    } else if (state === GameState.WarriorTwoTurn) {
      moveWarrior(1, position);
    }
  };

  return (
    <div id="board-container" className="relative flex items-center justify-center p-2 w-full" style={{ minHeight: '300px' }}>
      {/* Board Frame Wrapper */}
      <div
        id="board-frame-wrapper"
        className="relative"
        style={{
          width: 'min(100%, calc(100vh - 180px))',
          aspectRatio: '1'
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

        {/* 8x8 Chamber Grid */}
        <div id="board-grid" className="relative w-full h-full p-[6%] grid grid-cols-8 grid-rows-8 gap-1">
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => {
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
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
