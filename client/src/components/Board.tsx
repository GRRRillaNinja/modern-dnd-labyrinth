import React from 'react';
import { Chamber } from './Chamber';
import { useGameStore } from '../store/gameStore';
import { Position, GameState } from '@shared/types';

export const Board: React.FC = () => {
  const { gameState, chamberPaths, moveWarrior, setWarriorRoom, isDragonTurn } = useGameStore();

  if (!gameState) return null;

  const handleChamberClick = (position: Position) => {
    const state = gameState.state;

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
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="w-full h-full max-w-full max-h-full aspect-square">
        {/* Background board image */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-black rounded-lg shadow-2xl border-4 border-red-900" />
        </div>

        {/* Grid */}
        <div className="relative w-full h-full p-4 grid grid-cols-8 grid-rows-8 gap-1">
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
