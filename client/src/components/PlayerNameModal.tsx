import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PlayerNameModalProps {
  isVisible: boolean;
  gameWon: boolean;
  gameTime: number; // in milliseconds
  onSubmit: (playerName: string) => void;
  onSkip: () => void;
}

const STORAGE_KEY = 'dnd_labyrinth_player_name';

export const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  isVisible,
  gameWon,
  gameTime,
  onSubmit,
  onSkip,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved name and reset state when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      // Load previously saved name from localStorage
      const savedName = localStorage.getItem(STORAGE_KEY);
      setPlayerName(savedName || '');
      setIsSubmitting(false);
    }
  }, [isVisible]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) {
      return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    return `${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = playerName.trim();
    
    // Save name to localStorage if provided (even empty string to allow anonymous)
    if (trimmedName) {
      localStorage.setItem(STORAGE_KEY, trimmedName);
    }

    setIsSubmitting(true);
    await onSubmit(trimmedName);
    setIsSubmitting(false);
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border-4 border-red-900 rounded-lg p-8 max-w-md w-full"
      >
        {/* Game Result Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">
            {gameWon ? '🏆' : '💀'}
          </div>
          <h2 className="text-3xl font-medieval text-amber-500 mb-2">
            {gameWon ? 'Victory!' : 'Defeat'}
          </h2>
          <p className="text-gray-400 text-lg">
            Time: <span className="text-amber-400 font-bold">{formatTime(gameTime)}</span>
          </p>
        </div>

        {/* Name Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-gray-300 mb-2 font-medieval">
              Enter Your Name for the Leaderboard:
            </label>
            <div className="relative">
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Brave Warrior"
                maxLength={30}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-stone-800 border-2 border-stone-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-amber-600 disabled:opacity-50"
                autoFocus
              />
              {playerName && (
                <button
                  type="button"
                  onClick={() => setPlayerName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {playerName.length}/30 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-green-900 hover:bg-green-800 text-white rounded border-2 border-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medieval"
            >
            {isSubmitting ? 'Submitting...' : (playerName.trim() ? 'Submit Score' : 'Submit Anonymously')}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-stone-700 hover:bg-stone-600 text-white rounded border-2 border-stone-600 transition-colors disabled:opacity-50 font-medieval"
            >
              Skip
            </button>
          </div>
        </form>

        {/* Privacy Notice */}
        <p className="text-gray-500 text-xs text-center mt-4">
          Your score and name will be publicly visible on the leaderboard
        </p>
      </motion.div>
    </div>
  );
};
