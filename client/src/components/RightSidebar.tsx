import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GameState, DragonState } from '@shared/types';
import { audioService } from '../services/AudioService';

export const RightSidebar: React.FC = () => {
  const {
    gameState,
    resetGame,
    finishTurn,
    skipWarriorTwo,
    isDragonTurn,
  } = useGameStore();
  
  const [showSounds, setShowSounds] = useState(false);

  const sounds = [
    { id: 'defeat', name: 'Defeat', description: 'Warrior is defeated' },
    { id: 'door', name: 'Door Locked', description: 'Door is locked (Level 2)' },
    { id: 'dragonAttacks', name: 'Dragon Attacks', description: 'Dragon attacks warrior' },
    { id: 'dragonFlying', name: 'Dragon Flying', description: 'Dragon moves/flies' },
    { id: 'dragonWakes', name: 'Dragon Wakes', description: 'Dragon awakens nearby' },
    { id: 'levelOne', name: 'Level One', description: 'Level 1 Difficulty' },
    { id: 'levelTwo', name: 'Level Two', description: 'Level 2 Difficulty' },
    { id: 'treasure', name: 'Treasure Found', description: 'Warrior finds treasure' },
    { id: 'winner', name: 'Victory', description: 'Warrior wins the game' },
    { id: 'wall', name: 'Wall Hit', description: 'Warrior discovers a wall' },
    { id: 'scuffle', name: 'Warrior Battle', description: 'Players fight over treasure' },
    { id: 'warriorMoves', name: 'Warrior Moves', description: 'Movement sound effect' },
    { id: 'warriorOne', name: 'Warrior One', description: 'Announces Player 1\'s turn' },
    { id: 'warriorTwo', name: 'Warrior Two', description: 'Announces Player 2\'s turn' },
  ] as const;

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

  const isNextTurnDisabled = 
    gameState.state === GameState.Wait || 
    gameState.state === GameState.GameOver ||
    isDragonTurn; // Disable during dragon's turn

  const getNextTurnLabel = () => {
    if (gameState.state === GameState.WarriorTwoSelectRoom) {
      return 'Skip (Single Player)';
    }
    return 'Next Turn';
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
      {/* Controls Panel */}
      <div className="bg-stone-900 border-2 border-amber-700 rounded-lg p-4">
        <h3 className="text-amber-500 font-medieval text-lg mb-4 text-center">
          Game Controls
        </h3>
        
        <div className="space-y-3">
          {/* Next Turn Button */}
          <button
            onClick={handleNextTurn}
            disabled={isNextTurnDisabled}
            className="w-full px-6 py-3 bg-green-900 hover:bg-green-800 text-white rounded border-2 border-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medieval text-lg"
          >
            {getNextTurnLabel()}
          </button>

          {/* Reset Game Button */}
          <button
            onClick={resetGame}
            className="w-full px-6 py-3 bg-red-900 hover:bg-red-800 text-white rounded border-2 border-red-700 transition-colors font-medieval text-lg"
          >
            Reset Game
          </button>
        </div>

        {/* Warrior Info */}
        {(gameState.state === GameState.WarriorOneTurn || gameState.state === GameState.WarriorTwoTurn) && (
          <div className="mt-6 pt-4 border-t border-stone-700">
            <div className="text-center space-y-3">
              {/* Current Turn */}
              <div>
                <div className="text-gray-400 text-sm mb-1">Current Turn</div>
                <div className="text-amber-400 font-medieval text-xl">
                  {gameState.state === GameState.WarriorOneTurn ? 'Warrior One' : 'Warrior Two'}
                </div>
              </div>
              
              {/* Warrior Icon */}
              <div className="text-4xl">
                {gameState.state === GameState.WarriorOneTurn ? '🗡️' : '⚔️'}
              </div>
              
              {/* Lives (Hearts) */}
              <div>
                <div className="text-gray-400 text-sm mb-1">Lives</div>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-2xl ${
                        i < (gameState.state === GameState.WarriorOneTurn 
                          ? gameState.warriors[0].lives 
                          : gameState.warriors[1].lives)
                          ? 'text-red-500'
                          : 'text-gray-700'
                      }`}
                    >
                      ♥
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Moves Remaining */}
              {/* Only show in multiplayer OR in solo after dragon wakes */}
              {(gameState.numberOfWarriors === 2 || gameState.dragon.state === DragonState.Awake) && (
                <div>
                  <div className="text-gray-400 text-sm mb-1">Moves Remaining</div>
                  <div className="text-green-400 font-bold text-3xl">
                    {gameState.state === GameState.WarriorOneTurn 
                      ? gameState.warriors[0].moves 
                      : gameState.warriors[1].moves}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sound Preview Panel */}
      <div className="bg-stone-900 border-2 border-amber-700 rounded-lg p-4">
        <button
          onClick={() => setShowSounds(!showSounds)}
          className="w-full flex items-center justify-between text-amber-500 font-medieval text-lg mb-3 hover:text-amber-400 transition-colors"
        >
          <span>🔊 Sound Preview</span>
          <span className="text-sm">{showSounds ? '▲' : '▼'}</span>
        </button>
        
        <AnimatePresence>
          {showSounds && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="text-xs text-gray-400 mb-3">
                Click to preview each game sound:
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {sounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => audioService.play(sound.id as any)}
                    className="w-full text-left p-3 rounded bg-stone-800 hover:bg-stone-700 transition-colors border border-stone-700 hover:border-amber-700"
                  >
                    <div className="text-sm font-semibold text-amber-300">{sound.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{sound.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
