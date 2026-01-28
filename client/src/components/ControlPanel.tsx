import React from 'react';
import { useGameStore } from '../store/gameStore';
import { GameState } from '@shared/types';

export const ControlPanel: React.FC = () => {
  const {
    gameState,
    resetGame,
    finishTurn,
    skipWarriorTwo,
  } = useGameStore();

  if (!gameState) return null;

  const handleNextTurn = () => {
    const state = gameState.state;

    if (state === GameState.WarriorTwoSelectRoom) {
      skipWarriorTwo();
    } else if (state === GameState.WarriorOneTurn) {
      finishTurn(0);
    } else if (state === GameState.WarriorTwoTurn) {
      finishTurn(1);
    }
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={resetGame}
          className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white rounded border-2 border-red-700 transition-colors font-medieval"
        >
          Reset Game
        </button>

        <button
          onClick={handleNextTurn}
          disabled={gameState.state === GameState.Wait || gameState.state === GameState.GameOver}
          className="px-6 py-2 bg-green-900 hover:bg-green-800 text-white rounded border-2 border-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {gameState.state === GameState.WarriorTwoSelectRoom
            ? 'Skip (Single Player)'
            : 'Next Turn'}
        </button>
      </div>
    </div>
  );
};
