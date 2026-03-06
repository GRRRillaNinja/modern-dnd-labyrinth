import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabaseService, LeaderboardEntry, SupabaseService } from '../services/SupabaseService';

interface DailyLeaderboardProps {
  challengeDate: string;
  onClose: () => void;
  submissionResult?: { rank: number; isTop100: boolean } | null;
}

export const DailyLeaderboard: React.FC<DailyLeaderboardProps> = ({ challengeDate, onClose, submissionResult }) => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const playerEntryRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(challengeDate + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  useEffect(() => {
    loadScores();
  }, [challengeDate]);

  useEffect(() => {
    if (!loading && submissionResult?.isTop100 && playerEntryRef.current) {
      setTimeout(() => {
        playerEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [loading, submissionResult]);

  const loadScores = async () => {
    setLoading(true);
    const data = await supabaseService.getDailyChallengeScores(challengeDate);
    setEntries(data);
    setLoading(false);
  };

  if (!supabaseService.isEnabled()) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="dungeon-panel max-w-md"
        >
          <div className="dungeon-content text-center">
            <h2 className="text-2xl font-medieval text-amber-500 mb-4">Leaderboards Unavailable</h2>
            <p className="text-gray-300 mb-6">Leaderboard features are not configured.</p>
            <button onClick={onClose}
              className="w-full px-6 py-3 text-white rounded font-medieval transition-all active:translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, #7a1f1f 0%, #5c1818 50%, #3d1010 100%)',
                border: '3px solid #8f2828',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
              }}>Close</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="dungeon-panel max-w-lg w-full max-h-[calc(100vh-2rem)] flex flex-col"
      >
        <div className="flex flex-col overflow-hidden flex-1 min-h-0 m-2" style={{ padding: '2rem' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-3 flex-shrink-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', padding: '4px 15px', borderRadius: '5px' }}>
            <h2 className="text-xl sm:text-2xl font-medieval text-green-400">
              Daily Challenge
            </h2>
            <button onClick={onClose} className="text-green-400 hover:text-green-200 text-2xl transition-colors">
              ✕
            </button>
          </div>

          {/* Date */}
          <div className="text-center text-gray-400 text-sm mb-3 flex-shrink-0">
            {formattedDate}
          </div>

          {/* Submission Result */}
          {submissionResult && submissionResult.rank > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-3 p-3 rounded-lg text-center flex-shrink-0 ${
                submissionResult.isTop100
                  ? 'bg-green-900/40 border-2 border-green-600'
                  : 'bg-stone-800/60 border-2 border-stone-600'
              }`}
            >
              <div className={`font-medieval text-lg mb-1 ${submissionResult.isTop100 ? 'text-green-400' : 'text-gray-400'}`}>
                {submissionResult.isTop100 ? 'You made the Top 100!' : 'Score submitted!'}
              </div>
              <div className="text-gray-300 text-sm">
                Your rank: <span className="text-amber-400 font-bold">#{submissionResult.rank}</span>
              </div>
            </motion.div>
          )}

          {/* Fastest Wins Title */}
          <h3 className="text-lg font-medieval text-amber-400 mb-3 text-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', padding: '2px 15px', borderRadius: '5px' }}>
            Fastest Completions
          </h3>

          {/* Entries */}
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                No completions yet. Be the first!
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, index) => {
                  const isPlayerEntry = submissionResult?.isTop100 && index === submissionResult.rank - 1;
                  return (
                    <motion.div
                      key={entry.id}
                      ref={isPlayerEntry ? playerEntryRef : undefined}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isPlayerEntry
                        ? { opacity: 1, x: 0, boxShadow: ['0 0 10px rgba(16, 185, 129, 0.4)', '0 0 22px rgba(16, 185, 129, 0.85)', '0 0 10px rgba(16, 185, 129, 0.4)'] }
                        : { opacity: 1, x: 0 }
                      }
                      transition={isPlayerEntry
                        ? { delay: index * 0.05, boxShadow: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' } }
                        : { delay: index * 0.05 }
                      }
                      className={`p-2 sm:p-3 rounded text-sm ${index > 2 && !isPlayerEntry ? 'bg-stone-700/30 border border-stone-600' : ''}`}
                      style={isPlayerEntry ? {
                        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.5) 0%, rgba(4, 120, 87, 0.3) 50%, rgba(6, 78, 59, 0.5) 100%)',
                        border: '2px solid #10b981',
                      } : index === 0 ? {
                        background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.25) 0%, rgba(218, 165, 32, 0.15) 50%, rgba(184, 134, 11, 0.25) 100%)',
                        border: '2px solid #b8860b',
                      } : index === 1 ? {
                        background: 'linear-gradient(135deg, rgba(168, 169, 173, 0.2) 0%, rgba(192, 192, 192, 0.12) 50%, rgba(168, 169, 173, 0.2) 100%)',
                        border: '2px solid #8a8d91',
                      } : index === 2 ? {
                        background: 'linear-gradient(135deg, rgba(176, 101, 44, 0.25) 0%, rgba(205, 127, 50, 0.15) 50%, rgba(176, 101, 44, 0.25) 100%)',
                        border: '2px solid #a0622d',
                      } : undefined}
                    >
                      {isPlayerEntry && (
                        <div className="text-emerald-400 text-[10px] font-bold mb-1 text-center tracking-wider">YOUR SCORE</div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-center flex-shrink-0 w-7"
                          style={index === 0 ? { color: '#ffd700' } : index === 1 ? { color: '#c0c0c0' } : index === 2 ? { color: '#cd7f32' } : { color: '#6b7280' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className={`truncate min-w-0 text-xs sm:text-sm ${index === 0 ? 'font-semibold' : ''}`}
                          style={index === 0 ? { color: '#fde68a' } : index === 1 ? { color: '#d1d5db' } : index === 2 ? { color: '#e0a870' } : { color: '#d1d5db' }}>
                          {entry.player_name || 'Anonymous'}
                        </span>
                        {/* Difficulty Badge */}
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded font-bold flex-shrink-0 text-[10px] sm:text-xs ${
                          entry.difficulty_level === 1
                            ? 'bg-green-900/50 text-green-400 border border-green-700'
                            : 'bg-red-900/50 text-red-400 border border-red-700'
                        }`}>
                          L{entry.difficulty_level}
                        </span>
                        {/* Dungeon Size Badge */}
                        {entry.dungeon_size != null && (() => {
                          const sizeColors: Record<number, string> = {
                            8:  'bg-sky-900/50 text-sky-300 border-sky-500',
                            10: 'bg-emerald-900/50 text-emerald-300 border-emerald-500',
                            12: 'bg-violet-900/50 text-violet-300 border-violet-500',
                            14: 'bg-amber-900/50 text-amber-300 border-amber-500',
                            16: 'bg-rose-900/50 text-rose-300 border-rose-500',
                            18: 'bg-cyan-900/50 text-cyan-300 border-cyan-500',
                            20: 'bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-500',
                          };
                          const colorClass = sizeColors[entry.dungeon_size] ?? 'bg-sky-900/50 text-sky-300 border-sky-500';
                          return (
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded font-bold flex-shrink-0 text-[10px] sm:text-xs ${colorClass}`}>
                              {entry.dungeon_size}x{entry.dungeon_size}
                            </span>
                          );
                        })()}
                        <span className="text-amber-400 font-bold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ml-auto">
                          {SupabaseService.formatTime(entry.game_time)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 sm:gap-3 text-[10px] sm:text-xs mt-0.5">
                        {entry.total_moves != null && (
                          <span className="text-blue-400 font-semibold">{entry.total_moves} Moves</span>
                        )}
                        {entry.total_deaths != null && (
                          <span className="text-red-400 font-semibold">{entry.total_deaths} Deaths</span>
                        )}
                        {entry.walls_discovered_pct != null && (
                          <span className="text-green-400 font-semibold">{entry.walls_discovered_pct}% Walls</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-4 text-center flex-shrink-0">
            <button onClick={onClose}
              className="px-6 py-2 text-white rounded font-medieval text-sm transition-all active:translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, #1a4a2e 0%, #0f3320 50%, #082215 100%)',
                border: '3px solid #22c55e',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5)',
              }}>Close</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
