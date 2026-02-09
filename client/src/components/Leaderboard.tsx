import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabaseService, LeaderboardEntry, SupabaseService } from '../services/SupabaseService';

interface LeaderboardProps {
  gameMode: 'solo' | 'multiplayer';
  difficultyLevel: 1 | 2;
  onClose: () => void;
  submissionResult?: { rank: number; isTop100: boolean } | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ gameMode: _gameMode, difficultyLevel: _difficultyLevel, onClose, submissionResult }) => {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'fastest-win' | 'slowest-win' | 'fastest-loss' | 'slowest-loss'>('fastest-win');
  const [mobileMode, setMobileMode] = useState<'solo' | 'multiplayer'>('solo');
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
      case 'slowest-loss':
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
        return '💀 Fastest Loss';
      case 'slowest-loss':
        return '⏳ Slowest Loss';
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
      case 'slowest-loss':
        return '⏳';
    }
  };

  const renderLeaderboardList = (entries: LeaderboardEntry[], listId: string) => {
    if (loading) {
      return (
        <div id={`leaderboard-${listId}-loading`} className="text-center text-gray-400 py-8">
          Loading...
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div id={`leaderboard-${listId}-empty`} className="text-center text-gray-400 py-8 text-sm">
          No entries yet. Be the first!
        </div>
      );
    }

    return (
      <div id={`leaderboard-${listId}-entries`} className="space-y-2">
        {entries.map((entry, index) => (
          /* Leaderboard Entry Card */
          <motion.div
            key={entry.id}
            id={`leaderboard-${listId}-entry-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              p-2 sm:p-3 rounded text-sm
              ${index > 2 ? 'bg-stone-700/30 border border-stone-600' : ''}
            `}
            style={index === 0 ? {
              background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.25) 0%, rgba(218, 165, 32, 0.15) 50%, rgba(184, 134, 11, 0.25) 100%)',
              border: '2px solid #b8860b',
              boxShadow: 'inset 0 1px 0 rgba(255, 215, 0, 0.2), 0 0 12px rgba(218, 165, 32, 0.15)',
            } : index === 1 ? {
              background: 'linear-gradient(135deg, rgba(168, 169, 173, 0.2) 0%, rgba(192, 192, 192, 0.12) 50%, rgba(168, 169, 173, 0.2) 100%)',
              border: '2px solid #8a8d91',
              boxShadow: 'inset 0 1px 0 rgba(220, 220, 225, 0.15), 0 0 10px rgba(192, 192, 192, 0.1)',
            } : index === 2 ? {
              background: 'linear-gradient(135deg, rgba(176, 101, 44, 0.25) 0%, rgba(205, 127, 50, 0.15) 50%, rgba(176, 101, 44, 0.25) 100%)',
              border: '2px solid #a0622d',
              boxShadow: 'inset 0 1px 0 rgba(225, 160, 80, 0.2), 0 0 10px rgba(205, 127, 50, 0.12)',
            } : undefined}
          >
            {/* Top Row: Rank + Name + Time */}
            <div id={`leaderboard-${listId}-entry-${index}-top`} className="flex items-center gap-2">
              {/* Rank */}
              <span id={`leaderboard-${listId}-entry-${index}-rank`} className={`
                font-bold text-center flex-shrink-0
                ${index === 0 ? 'text-lg sm:text-xl w-7 sm:w-9' :
                  index <= 2 ? 'text-base sm:text-lg w-6 sm:w-8' :
                  'text-base sm:text-lg w-6 sm:w-8'}
              `}
              style={index === 0 ? {
                color: '#ffd700',
                textShadow: '0 0 8px rgba(255, 215, 0, 0.5)',
              } : index === 1 ? {
                color: '#c0c0c0',
                textShadow: '0 0 6px rgba(192, 192, 192, 0.4)',
              } : index === 2 ? {
                color: '#cd7f32',
                textShadow: '0 0 6px rgba(205, 127, 50, 0.4)',
              } : { color: '#6b7280' }}
              >
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </span>
              {/* Player Name */}
              <span id={`leaderboard-${listId}-entry-${index}-name`} className={`truncate min-w-0 text-xs sm:text-sm ${
                index === 0 ? 'font-semibold' : ''
              }`}
              style={index === 0 ? {
                color: '#fde68a',
              } : index === 1 ? {
                color: '#d1d5db',
              } : index === 2 ? {
                color: '#e0a870',
              } : { color: '#d1d5db' }}
              >
                {entry.player_name || 'Anonymous'}
              </span>
              {/* Time */}
              <span id={`leaderboard-${listId}-entry-${index}-time`} className="text-amber-400 font-bold text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                {SupabaseService.formatTime(entry.game_time)}
              </span>
            </div>

            {/* Bottom Row: Stats */}
            <div id={`leaderboard-${listId}-entry-${index}-stats`} className="flex items-center gap-2 sm:gap-3 mt-1 ml-9 sm:ml-11 text-[10px] sm:text-xs text-gray-400">
              {/* Difficulty Badge */}
              <span id={`leaderboard-${listId}-entry-${index}-difficulty`} className={`
                px-1.5 sm:px-2 py-0.5 rounded font-bold
                ${entry.difficulty_level === 1
                  ? 'bg-green-900/50 text-green-400 border border-green-700'
                  : 'bg-red-900/50 text-red-400 border border-red-700'}
              `}>
                L{entry.difficulty_level}
              </span>
              {/* vs CPU / PvP Badge (multiplayer only) */}
              {entry.game_mode === 'multiplayer' && (
                <span className={`
                  px-1.5 sm:px-2 py-0.5 rounded font-bold
                  ${entry.vs_cpu
                    ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-700'
                    : 'bg-purple-900/50 text-purple-400 border border-purple-700'}
                `}>
                  {entry.vs_cpu ? 'vs CPU' : 'PvP'}
                </span>
              )}
              {/* Moves | Deaths | Walls Discovered */}
              {entry.total_moves != null && (
                <span id={`leaderboard-${listId}-entry-${index}-metrics`} className="whitespace-nowrap">
                  {entry.total_moves} Moves{entry.total_deaths != null && ` | ${entry.total_deaths} Deaths`}{entry.walls_discovered_pct != null && ` | ${entry.walls_discovered_pct}% Walls Discovered`}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (!supabaseService.isEnabled()) {
    return (
  <div
    id="leaderboard-unavailable-overlay"
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
  >
    {/* Leaderboard Unavailable Overlay */}
    {/* Unavailable Container */}
    <motion.div
          id="leaderboard-unavailable-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="dungeon-panel max-w-md"
        >
          {/* Unavailable Content */}
          <div id="leaderboard-unavailable-content" className="dungeon-content">
            {/* Unavailable Title */}
            <h2 id="leaderboard-unavailable-title" className="text-2xl font-medieval text-amber-500 mb-4 text-center">
              Leaderboards Unavailable
            </h2>
            {/* Unavailable Message */}
            <p id="leaderboard-unavailable-message" className="text-gray-300 text-center mb-6">
              Leaderboard features are not configured. Please check the setup guide.
            </p>
            {/* Unavailable Close Button */}
            <button
              id="leaderboard-unavailable-close-btn"
              onClick={onClose}
              className="w-full px-6 py-3 text-white rounded font-medieval transition-all active:translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, #7a1f1f 0%, #5c1818 50%, #3d1010 100%)',
                border: '3px solid #8f2828',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentBoards = getCurrentLeaderboards();

  return (
    
    <div id="leaderboard-overlay" className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      {/* Leaderboard Overlay */}
	  
      <motion.div
        id="leaderboard-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="dungeon-panel max-w-6xl w-full max-h-[calc(100vh-2rem)] min-h-[calc(100vh-2rem)] flex flex-col"
      >{/* Leaderboard Container */}
        {/* Leaderboard Inner Layout */}
        <div id="leaderboard-inner" className="flex flex-col overflow-hidden flex-1 min-h-0 m-2" style={{ padding: '3rem' }}>
          {/* Header */}
          <div id="leaderboard-header" className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', padding: '0px 15px', borderRadius: '5px', }}>
            {/* Leaderboard Title */}
            <h2 id="leaderboard-title" className="text-2xl sm:text-3xl font-medieval text-amber-500">
              Leaderboards
            </h2>
            {/* Close X Button */}
            <button
              id="leaderboard-close-btn"
              onClick={onClose}
              className="text-amber-400 hover:text-amber-200 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Submission Result Message */}
          {submissionResult && submissionResult.rank > 0 && (
            <motion.div
              id="leaderboard-submission-result"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 sm:mb-6 p-4 rounded-lg text-center flex-shrink-0 ${
                submissionResult.isTop100
                  ? 'bg-green-900/40 border-2 border-green-600'
                  : 'bg-stone-800/60 border-2 border-stone-600'
              }`}
            >
              {submissionResult.isTop100 ? (
                <>
                  <div id="leaderboard-submission-result-success" className="text-green-400 font-medieval text-lg mb-1">
                    Congratulations! You made the Top 100!
                  </div>
                  <div id="leaderboard-submission-result-rank" className="text-gray-300">
                    Your score ranks <span className="text-amber-400 font-bold">#{submissionResult.rank}</span> out of all recorded scores.
                  </div>
                </>
              ) : (
                <>
                  <div id="leaderboard-submission-result-not-top" className="text-gray-400 font-medieval text-lg mb-1">
                    Your time didn't make the Top 100. Keep trying!
                  </div>
                  <div id="leaderboard-submission-result-rank" className="text-gray-300">
                    Your score ranks <span className="text-amber-400 font-bold">#{submissionResult.rank}</span> out of all recorded scores.
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Mobile Mode Toggle (Solo/Multiplayer) - Only visible in landscape */}
          <div id="leaderboard-mode-toggle" className="hidden grid-cols-2 gap-2 mb-2 flex-shrink-0">
            <button
              id="leaderboard-mode-solo"
              onClick={() => setMobileMode('solo')}
              className="px-4 py-2 rounded-lg font-medieval text-sm transition-all active:translate-y-0.5"
              style={mobileMode === 'solo'
                ? {
                    background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 50%, #1e3a8a 100%)',
                    border: '2px solid #3b82f6',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
                    color: '#ffffff',
                  }
                : {
                    background: 'linear-gradient(180deg, #3d3529 0%, #2a241c 50%, #1a1610 100%)',
                    border: '2px solid #4a4035',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3)',
                    color: '#9ca3af',
                  }
              }
            >
              🗡️ Solo Quest
            </button>
            <button
              id="leaderboard-mode-multiplayer"
              onClick={() => setMobileMode('multiplayer')}
              className="px-4 py-2 rounded-lg font-medieval text-sm transition-all active:translate-y-0.5"
              style={mobileMode === 'multiplayer'
                ? {
                    background: 'linear-gradient(180deg, #7e22ce 0%, #6b21a8 50%, #581c87 100%)',
                    border: '2px solid #a855f7',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
                    color: '#ffffff',
                  }
                : {
                    background: 'linear-gradient(180deg, #3d3529 0%, #2a241c 50%, #1a1610 100%)',
                    border: '2px solid #4a4035',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3)',
                    color: '#9ca3af',
                  }
              }
            >
              ⚔️ Two Warriors
            </button>
          </div>

          {/* Category Tabs */}
          <div id="leaderboard-tabs" className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4 sm:mb-6 flex-shrink-0">
            {(['fastest-win', 'slowest-win', 'fastest-loss', 'slowest-loss'] as const).map((category) => (
              /* Category Tab Button */
              <button
                key={category}
                id={`leaderboard-tab-${category}`}
                onClick={() => setSelectedCategory(category)}
                className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medieval text-xs sm:text-sm transition-all active:translate-y-0.5"
                style={selectedCategory === category
                  ? {
                      background: 'linear-gradient(180deg, #7a1f1f 0%, #5c1818 50%, #3d1010 100%)',
                      border: '2px solid #8f2828',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5), 0 0 10px rgba(127, 29, 29, 0.3)',
                      color: '#ffffff',
                    }
                  : {
                      background: 'linear-gradient(180deg, #3d3529 0%, #2a241c 50%, #1a1610 100%)',
                      border: '2px solid #4a4035',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3)',
                      color: '#9ca3af',
                    }
                }
              >
                {/* Tab Emoji */}
                <div id={`leaderboard-tab-${category}-emoji`} className="text-lg sm:text-xl mb-0.5 sm:mb-1">{getCategoryEmoji(category)}</div>
                {/* Tab Label */}
                <div id={`leaderboard-tab-${category}-text`} className="text-[10px] sm:text-xs leading-tight">
                  {category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </div>
              </button>
            ))}
          </div>

          {/* Current Category Title */}
          <h3 id="leaderboard-category-title" className="text-lg sm:text-xl font-medieval text-amber-400 mb-4 text-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', padding: '0px 15px', borderRadius: '5px', width: 'auto', }}>
            {getCategoryTitle()}
          </h3>

          {/* Leaderboard Columns - Side by Side on Desktop, Stacked on Mobile */}
          <div id="leaderboard-columns" className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0" data-mobile-mode={mobileMode}>
            {/* Solo Leaderboard Column */}
            <div id="leaderboard-solo-column" className="dungeon-content flex flex-col min-h-0">
              {/* Solo Quest Title */}
              <h4 id="leaderboard-solo-title" className="text-base sm:text-lg font-medieval text-blue-400 mb-3 text-center flex items-center justify-center gap-2 flex-shrink-0">
                <span>🗡️</span>
                <span>Solo Quest</span>
              </h4>
              {/* Solo Quest Entry List */}
              <div id="leaderboard-solo-list" className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                {renderLeaderboardList(currentBoards.solo, 'solo')}
              </div>
            </div>

            {/* Multiplayer Leaderboard Column */}
            <div id="leaderboard-multiplayer-column" className="dungeon-content flex flex-col min-h-0">
              {/* Two Warriors Title */}
              <h4 id="leaderboard-multiplayer-title" className="text-base sm:text-lg font-medieval text-purple-400 mb-3 text-center flex items-center justify-center gap-2 flex-shrink-0">
                <span>⚔️</span>
                <span>Two Warriors</span>
              </h4>
              {/* Multiplayer Entry List */}
              <div id="leaderboard-multiplayer-list" className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                {renderLeaderboardList(currentBoards.multiplayer, 'multiplayer')}
              </div>
            </div>
          </div>

          {/* Bottom Close Button */}
          <div className="mt-4 sm:mt-6 text-center flex-shrink-0">
            <button
              id="leaderboard-close-bottom-btn"
              onClick={onClose}
              className="px-6 sm:px-8 py-2 sm:py-3 text-white rounded font-medieval text-sm sm:text-base transition-all active:translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, #7a1f1f 0%, #5c1818 50%, #3d1010 100%)',
                border: '3px solid #8f2828',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
