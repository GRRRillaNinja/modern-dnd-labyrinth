import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PlayerNameModalProps {
  isVisible: boolean;
  gameWon: boolean;
  gameTime: number; // in milliseconds
  totalMoves: number;
  totalDeaths: number;
  wallsDiscoveredPct: number;
  onSubmit: (playerName: string) => void;
  onSkip: () => void;
}

const STORAGE_KEY = 'dnd_labyrinth_player_name';

export const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  isVisible,
  gameWon,
  gameTime,
  totalMoves,
  totalDeaths,
  wallsDiscoveredPct,
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

  // Overlay backdrop
  return (
    <div id="player-name-modal-overlay" className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      {/* Modal container */}
      <motion.div
        id="player-name-modal-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="dungeon-panel max-w-md w-full"
      >
        {/* Inner dungeon content */}
        <div id="player-name-modal-content" className="dungeon-content">
          {/* Game Result Header */}
          <div id="player-name-modal-result-header" className="text-center mb-6">
            {/* Result icon (trophy or skull) */}
            <div id="player-name-modal-result-icon" className="text-6xl mb-4">
              {gameWon ? '🏆' : '💀'}
            </div>
            {/* Victory/Defeat title */}
            <h2 id="player-name-modal-result-title" className="text-3xl font-medieval text-amber-500 mb-2">
              {gameWon ? 'Victory!' : 'Defeat'}
            </h2>
            {/* Time display */}
            <p id="player-name-modal-result-time" className="text-gray-400 text-lg">
              Time: {/* Time value */}<span id="player-name-modal-result-time-value" className="text-amber-400 font-bold">{formatTime(gameTime)}</span>
            </p>
            {/* Game stats row */}
            <div id="player-name-modal-stats" className="grid grid-cols-3 gap-3 mt-4">
              {/* Moves stat */}
              <div id="player-name-modal-stat-moves" className="text-center p-2 rounded bg-stone-800/60 border border-stone-700">
                <div className="text-gray-500 text-xs mb-1">Moves</div>
                <div className="text-amber-400 font-bold text-lg">{totalMoves}</div>
              </div>
              {/* Deaths stat */}
              <div id="player-name-modal-stat-deaths" className="text-center p-2 rounded bg-stone-800/60 border border-stone-700">
                <div className="text-gray-500 text-xs mb-1">Deaths</div>
                <div className="text-red-400 font-bold text-lg">{totalDeaths}</div>
              </div>
              {/* Walls discovered stat */}
              <div id="player-name-modal-stat-walls" className="text-center p-2 rounded bg-stone-800/60 border border-stone-700">
                <div className="text-gray-500 text-xs mb-1">Walls Found</div>
                <div className="text-blue-400 font-bold text-lg">{wallsDiscoveredPct}%</div>
              </div>
            </div>
          </div>

          {/* Name Input Form */}
          <form id="player-name-modal-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Field wrapper */}
            <div id="player-name-modal-field">
              <label htmlFor="player-name-modal-input" className="block text-gray-300 mb-2 font-medieval">
                Enter Your Name for the Leaderboard:
              </label>
              {/* Input wrapper */}
              <div id="player-name-modal-input-wrapper" className="relative">
                {/* Name input */}
                <input
                  id="player-name-modal-input"
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
                  /* Clear button */
                  <button
                    id="player-name-modal-clear-btn"
                    type="button"
                    onClick={() => setPlayerName('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
                    disabled={isSubmitting}
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* Character count */}
              <p id="player-name-modal-char-count" className="text-gray-500 text-sm mt-1">
                {playerName.length}/30 characters
              </p>
            </div>

            {/* Buttons */}
            <div id="player-name-modal-buttons" className="flex gap-3">
              {/* Submit button */}
              <button
                id="player-name-modal-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 text-white rounded font-medieval transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(180deg, #2f7d4a 0%, #246b3a 50%, #1a5a2e 100%)',
                  border: '3px solid #3a9d5c',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
                }}
              >
                {isSubmitting ? 'Submitting...' : (playerName.trim() ? 'Submit Score' : 'Submit Anonymously')}
              </button>
              {/* Skip button */}
              <button
                id="player-name-modal-skip-btn"
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 text-white rounded font-medieval transition-all active:translate-y-0.5 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(180deg, #3d3529 0%, #2a241c 50%, #1a1610 100%)',
                  border: '3px solid #4a4035',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
                }}
              >
                Skip
              </button>
            </div>
          </form>

          {/* Privacy Notice */}
          <p id="player-name-modal-privacy-notice" className="text-gray-500 text-xs text-center mt-4">
            Your score and name will be publicly visible on the leaderboard
          </p>
        </div>
      </motion.div>
    </div>
  );
};
