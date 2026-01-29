import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameMode } from '@shared/types';
import { audioService } from '../services/AudioService';
import { Leaderboard } from './Leaderboard';

interface MenuProps {
  onStart: (mode: GameMode, players: number, level: number) => void;
  onShowLeaderboard: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart, onShowLeaderboard: _onShowLeaderboard }) => {
  const [players, setPlayers] = useState<number>(1);
  const [level, setLevel] = useState<number>(1);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Play intro sound on mount
  useEffect(() => {
    // Try to play intro (will work after user interaction)
    audioService.play('intro').catch(() => {
      console.log('Intro music will play after user interaction');
    });

    // Cleanup: stop intro sound when component unmounts
    return () => {
      audioService.stopCurrent();
    };
  }, []);

  const handleStartGame = () => {
    // Stop intro sound before starting game
    audioService.stopCurrent();
    onStart(GameMode.LocalMultiplayer, players, level);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-black via-red-950 to-black p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        {/* Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl md:text-6xl font-medieval text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            DUNGEONS & DRAGONS
          </h1>
          <h2 className="text-xl md:text-2xl font-medieval text-amber-500">
            Computer Labyrinth Game
          </h2>
          <div className="mt-2 text-gray-400 text-xs">
            A modernized tribute to the 1980 Mattel Electronics classic
          </div>
        </motion.div>

        {/* Game modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-stone-900 border-4 border-red-900 rounded-lg p-6 shadow-2xl"
        >
          <h3 className="text-xl font-medieval text-center text-amber-500 mb-4">
            Choose Your Quest
          </h3>

          {/* Player count */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2 text-center text-sm">
              Number of Warriors
            </label>
            <div className="flex gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => setPlayers(1)}
                className={`
                  px-4 sm:px-6 py-3 rounded-lg border-2 transition-all font-medieval text-sm sm:text-base
                  ${
                    players === 1
                      ? 'bg-red-900 border-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'bg-stone-800 border-stone-700 text-gray-400 hover:bg-stone-700'
                  }
                `}
              >
                Solo Quest
              </button>
              <button
                onClick={() => setPlayers(2)}
                className={`
                  px-4 sm:px-6 py-3 rounded-lg border-2 transition-all font-medieval text-sm sm:text-base
                  ${
                    players === 2
                      ? 'bg-red-900 border-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'bg-stone-800 border-stone-700 text-gray-400 hover:bg-stone-700'
                  }
                `}
              >
                Two Warriors
              </button>
            </div>
          </div>

          {/* Level selection */}
          <div className="mb-5">
            <label className="block text-gray-300 mb-2 text-center text-sm">
              Difficulty Level
            </label>
            <div className="flex gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => setLevel(1)}
                className={`
                  px-4 sm:px-6 py-3 rounded-lg border-2 transition-all font-medieval text-sm sm:text-base flex-1 sm:flex-none
                  ${
                    level === 1
                      ? 'bg-amber-900 border-amber-700 text-white shadow-lg shadow-amber-900/50'
                      : 'bg-stone-800 border-stone-700 text-gray-400 hover:bg-stone-700'
                  }
                `}
              >
                <div>Level 1</div>
                <div className="text-xs font-normal mt-0.5">Open Passages</div>
              </button>
              <button
                onClick={() => setLevel(2)}
                className={`
                  px-4 sm:px-6 py-3 rounded-lg border-2 transition-all font-medieval text-sm sm:text-base flex-1 sm:flex-none
                  ${
                    level === 2
                      ? 'bg-amber-900 border-amber-700 text-white shadow-lg shadow-amber-900/50'
                      : 'bg-stone-800 border-stone-700 text-gray-400 hover:bg-stone-700'
                  }
                `}
              >
                <div>Level 2</div>
                <div className="text-xs font-normal mt-0.5">Locked Doors</div>
              </button>
            </div>
          </div>

          {/* Start button */}
          <div className="text-center mb-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
              className="px-10 py-3 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white rounded-lg border-2 border-red-600 font-medieval text-lg shadow-lg shadow-red-900/50 transition-all"
            >
              ⚔️ Begin Adventure ⚔️
            </motion.button>
          </div>

          {/* Leaderboard Button */}
          <div className="text-center mb-5">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="px-6 py-2 bg-amber-900/50 hover:bg-amber-900 text-amber-400 hover:text-white rounded border-2 border-amber-700 transition-colors font-medieval text-sm"
            >
              🏆 View Leaderboards
            </button>
          </div>

          {/* Instructions */}
          <div className="pt-5 border-t border-stone-700">
            <h4 className="text-amber-500 font-medieval mb-2 text-center text-sm">
              How to Play
            </h4>
            <ul className="text-gray-400 text-xs space-y-1 text-center list-none">
              <li>• Pick your Waystone location (secret safe room) to start</li>
              <li>• Navigate the labyrinth to find the dragon's treasure</li>
              <li>• Dragon wakes when you get within 3 tiles - avoid it!</li>
              <li>• Return the treasure to your Waystone to win</li>
              {level === 2 && (
                <>
                  <li className="text-amber-300">• Level 2: Doors start locked or unlocked</li>
                  <li className="text-amber-300">• Locked doors: 50% chance to unlock when trying</li>
                  <li className="text-amber-300">• Unlocked doors: Lock behind you after passing</li>
                </>
              )}
            </ul>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center text-gray-500 text-xs"
        >
          <p>Based on the 1980 Mattel Electronics D&D Computer Labyrinth Game</p>
          <p className="mt-0.5">
            Dungeons & Dragons™ is copyright of Wizards of the Coast™
          </p>
        </motion.div>
      </motion.div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          gameMode={players === 1 ? 'solo' : 'multiplayer'}
          difficultyLevel={level as 1 | 2}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
};
