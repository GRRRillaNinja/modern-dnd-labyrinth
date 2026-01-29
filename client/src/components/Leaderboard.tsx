import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseService, LeaderboardEntry, SupabaseService } from '../services/SupabaseService';

interface LeaderboardProps {
  gameMode: 'solo' | 'multiplayer';
  difficultyLevel: 1 | 2;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ gameMode, difficultyLevel, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'fastest-win' | 'slowest-win' | 'fastest-loss' | 'longest-loss'>('fastest-win');
  const [leaderboards, setLeaderboards] = useState<{
    soloFastestWins: LeaderboardEntry[];
    soloSlowestWins: LeaderboardEntry[];
    soloFastestLosses: LeaderboardEntry[];
    soloLongestLosses: LeaderboardEntry[];
    multiplayerFastestWins: LeaderboardEntry[];
    multiplayerSlowestWins: LeaderboardEntry[];
    multiplayerFastestLosses: LeaderboardEntry[];
    multiplayerLongestLosses: LeaderboardEntry[];
  }>({
    soloFastestWins: [],
    soloSlowestWins: [],
    soloFastestLosses: [],
    soloLongestLosses: [],
    multiplayerFastestWins: [],
    multiplayerSlowestWins: [],
    multiplayerFastestLosses: [],
    multiplayerLongestLosses: [],
  });

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    
    // Load both solo and multiplayer leaderboards (all difficulty levels)
    const [soloData, multiplayerData] = await Promise.all([
      supabaseService.getAllLeaderboards('solo'),
      supabaseService.getAllLeaderboards('multiplayer'),
    ]);
    
    setLeaderboards({
      soloFastestWins: soloData.fastestWins,
      soloSlowestWins: soloData.slowestWins,
      soloFastestLosses: soloData.fastestLosses,
      soloLongestLosses: soloData.longestLosses,
      multiplayerFastestWins: multiplayerData.fastestWins,
      multiplayerSlowestWins: multiplayerData.slowestWins,
      multiplayerFastestLosses: multiplayerData.fastestLosses,
      multiplayerLongestLosses: multiplayerData.longestLosses,
    });
    
    setLoading(false);
  };

  const getCurrentLeaderboards = (): { solo: LeaderboardEntry[], multiplayer: LeaderboardEntry[] } => {
    switch (selectedCategory) {
      case 'fastest-win':
        return { solo: leaderboards.soloFastestWins, multiplayer: leaderboards.multiplayerFastestWins };
      case 'slowest-win':
        return { solo: leaderboards.soloSlowestWins, multiplayer: leaderboards.multiplayerSlowestWins };
      case 'fastest-loss':
        return { solo: leaderboards.soloFastestLosses, multiplayer: leaderboards.multiplayerFastestLosses };
      case 'longest-loss':
        return { solo: leaderboards.soloLongestLosses, multiplayer: leaderboards.multiplayerLongestLosses };
    }
  };

  const getCategoryTitle = (): string => {
    switch (selectedCategory) {
      case 'fastest-win':
        return '🏆 Fastest Wins';
      case 'slowest-win':
        return '🐌 Slowest Wins';
      case 'fastest-loss':
        return '💀 Fastest Defeats';
      case 'longest-loss':
        return '⏳ Longest Defeats';
    }
  };

  const getCategoryEmoji = (category: typeof selectedCategory): string => {
    switch (category) {
      case 'fastest-win':
        return '🏆';
      case 'slowest-win':
        return '🐌';
      case 'fastest-loss':
        return '💀';
      case 'longest-loss':
        return '⏳';
    }
  };

  const renderLeaderboardList = (entries: LeaderboardEntry[], mode: 'solo' | 'multiplayer') => {
    if (loading) {
      return (
        <div className="text-center text-gray-400 py-8">
          Loading...
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8 text-sm">
          No entries yet. Be the first!
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center justify-between p-2 sm:p-3 rounded text-sm
              ${index === 0 ? 'bg-amber-900/30 border border-amber-700' :
                index === 1 ? 'bg-gray-700/30 border border-gray-600' :
                index === 2 ? 'bg-orange-900/30 border border-orange-800' :
                'bg-stone-700/30 border border-stone-600'}
            `}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`
                font-bold text-base sm:text-lg w-6 sm:w-8 text-center flex-shrink-0
                ${index === 0 ? 'text-amber-400' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-orange-400' :
                  'text-gray-500'}
              `}>
                #{index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-gray-300 truncate text-xs sm:text-sm">
                  {entry.player_name || 'Anonymous'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Difficulty Badge */}
              <span className={`
                text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold
                ${entry.difficulty_level === 1 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : 'bg-red-900/50 text-red-400 border border-red-700'}
              `}>
                L{entry.difficulty_level}
              </span>
              {/* Time */}
              <span className="text-amber-400 font-bold text-xs sm:text-sm whitespace-nowrap">
                {SupabaseService.formatTime(entry.game_time)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (!supabaseService.isEnabled()) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-stone-900 border-4 border-red-900 rounded-lg p-8 max-w-md"
        >
          <h2 className="text-2xl font-medieval text-amber-500 mb-4 text-center">
            Leaderboards Unavailable
          </h2>
          <p className="text-gray-300 text-center mb-6">
            Leaderboard features are not configured. Please check the setup guide.
          </p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-red-900 hover:bg-red-800 text-white rounded border-2 border-red-700 transition-colors font-medieval"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  const currentBoards = getCurrentLeaderboards();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-stone-900 border-4 border-red-900 rounded-lg p-4 sm:p-6 max-w-6xl w-full my-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-medieval text-amber-500">
            Leaderboards
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4 sm:mb-6">
          {(['fastest-win', 'slowest-win', 'fastest-loss', 'longest-loss'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all font-medieval text-xs sm:text-sm
                ${selectedCategory === category
                  ? 'bg-red-900 border-red-700 text-white shadow-lg'
                  : 'bg-stone-800 border-stone-700 text-gray-400 hover:bg-stone-700'
                }
              `}
            >
              <div className="text-lg sm:text-xl mb-0.5 sm:mb-1">{getCategoryEmoji(category)}</div>
              <div className="text-[10px] sm:text-xs leading-tight">
                {category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </div>
            </button>
          ))}
        </div>

        {/* Current Category Title */}
        <h3 className="text-lg sm:text-xl font-medieval text-amber-400 mb-4 text-center">
          {getCategoryTitle()}
        </h3>

        {/* Leaderboard Tables - Side by Side on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Solo Leaderboard */}
          <div className="bg-stone-800 rounded-lg p-3 sm:p-4 border-2 border-stone-700">
            <h4 className="text-base sm:text-lg font-medieval text-blue-400 mb-3 text-center flex items-center justify-center gap-2">
              <span>🗡️</span>
              <span>Solo Quest</span>
            </h4>
            {renderLeaderboardList(currentBoards.solo, 'solo')}
          </div>

          {/* Multiplayer Leaderboard */}
          <div className="bg-stone-800 rounded-lg p-3 sm:p-4 border-2 border-stone-700">
            <h4 className="text-base sm:text-lg font-medieval text-purple-400 mb-3 text-center flex items-center justify-center gap-2">
              <span>⚔️</span>
              <span>Two Warriors</span>
            </h4>
            {renderLeaderboardList(currentBoards.multiplayer, 'multiplayer')}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-red-900 hover:bg-red-800 text-white rounded border-2 border-red-700 transition-colors font-medieval text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
