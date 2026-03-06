import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameMode } from '@shared/types';
import { audioService } from '../services/AudioService';
import { Leaderboard } from './Leaderboard';
import { getDailyChallengeSeed, getDailyChallengeSettings } from '../store/gameStore';

interface MenuProps {
  onStart: (mode: GameMode, players: number, level: number, dungeonSize: number) => void;
  onStartDailyChallenge: () => void;
  onShowLeaderboard: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart, onStartDailyChallenge, onShowLeaderboard: _onShowLeaderboard }) => {
  const [players, setPlayers] = useState<number>(1);
  const [level, setLevel] = useState<number>(1);
  const [dungeonSize, setDungeonSize] = useState<number>(8);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Play intro sound on mount
  useEffect(() => {
    // Try to play intro (will work after user interaction)
    audioService.play('intro').catch(() => {
      // Audio will play after user interaction - silently ignore for production
    });

    // Cleanup: stop intro sound when component unmounts
    return () => {
      audioService.stopCurrent();
    };
  }, []);

  const handleStartGame = () => {
    // Stop intro sound before starting game
    audioService.stopCurrent();
    const mode = players === 1 ? GameMode.SinglePlayer : players === 3 ? GameMode.VsCPU : GameMode.LocalMultiplayer;
    const actualPlayers = players === 3 ? 2 : players; // vs CPU uses 2 warriors
    onStart(mode, actualPlayers, level, dungeonSize);
  };

  // Root wrapper
  return (
    <div id="menu-root" className="h-screen flex items-center justify-center p-2 md:p-4 overflow-hidden" style={{ maxHeight: '100vh' }}>
      {/* Outer animated wrapper */}
      <motion.div
        id="menu-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        {/* Title section animated wrapper */}
        <motion.div
          id="menu-title-section"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-2"
        >
          {/* Main h1 title */}
          <h1 id="menu-title-main" className="text-4xl md:text-5xl font-medieval text-red-500 mb-1 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            DELVE & DASH
          </h1>
          {/* Subtitle h2 */}
          <h2 id="menu-title-subtitle" className="text-lg md:text-xl font-medieval text-amber-500">
            The Dungeon Crawler
          </h2>
          {/* Attribution + Manual on same line */}
          <div id="menu-title-attribution" className="mt-1 text-gray-400 text-xs">
            Inspired by <a id="menu-title-attribution-link" href="https://github.com/bobwhitley/dndlabyrinth" className="text-amber-500 hover:text-amber-400 text-xs underline transition-colors">Bob Whitley's classic</a>
            <span className="mx-2 text-stone-600">|</span>
            <a id="menu-title-manual-link" href="/game-manual.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500 hover:text-amber-400 text-xs underline transition-colors"
            >Game Manual</a>
          </div>
        </motion.div>

        {/* Quest panel (dungeon-panel) */}
        <motion.div
          id="menu-quest-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="dungeon-panel shadow-2xl flex justify-center max-w-lg mx-auto"
        >
          {/* Quest content (dungeon-content) */}
          <div id="menu-quest-content" className="dungeon-content w-auto px-6 py-3 rounded-lg">
            {/* "Choose Your Quest" heading */}
            <h3 id="menu-quest-title" className="text-lg font-medieval text-center text-amber-500 mb-3">
              Choose Your Quest
            </h3>

          {/* Player count section */}
          <div id="menu-players-section" className="mb-3">
            {/* Player count label */}
            <label id="menu-players-label" className="block text-gray-300 mb-2 text-center text-sm">
              Number of Warriors
            </label>
            {/* Player buttons container */}
            <div id="menu-players-buttons" className="flex gap-2 sm:gap-3 justify-center">
              {/* Solo Quest button */}
              <button
                id="menu-players-solo-btn"
                onClick={() => setPlayers(1)}
                className={`
                  px-4 sm:px-5 py-2 rounded-lg border-2 transition-all font-medieval text-sm
                  ${
                    players === 1
                      ? 'bg-red-900 border-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'bg-stone-800 border-stone-700 text-gray-400 hover:bg-stone-700'
                  }
                `}
              >
                Solo Quest
              </button>
              {/* vs CPU button */}
              <button
                id="menu-players-cpu-btn"
                onClick={() => setPlayers(3)}
                className={`
                  px-4 sm:px-5 py-2 rounded-lg border-2 transition-all font-medieval text-sm
                  ${
                    players === 3
                      ? 'bg-red-900 border-red-700 text-white shadow-lg shadow-red-900/50'
                      : 'bg-stone-800 border-stone-700 text-gray-400 hover:bg-stone-700'
                  }
                `}
              >
                vs CPU
              </button>
              {/* Two Warriors button */}
              <button
                id="menu-players-two-btn"
                onClick={() => setPlayers(2)}
                className={`
                  px-4 sm:px-5 py-2 rounded-lg border-2 transition-all font-medieval text-sm
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

          {/* Level section */}
          <div id="menu-level-section" className="mb-3">
            {/* Level label */}
            <label id="menu-level-label" className="block text-gray-300 mb-2 text-center text-sm">
              Difficulty Level
            </label>
            {/* Level buttons container */}
            <div id="menu-level-buttons" className="flex gap-2 sm:gap-3 justify-center">
              {/* Level 1 button */}
              <button
                id="menu-level-1-btn"
                onClick={() => setLevel(1)}
                className={`
                  px-4 sm:px-5 py-2 rounded-lg border-2 transition-all font-medieval text-sm flex-1 sm:flex-none
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
              {/* Level 2 button */}
              <button
                id="menu-level-2-btn"
                onClick={() => setLevel(2)}
                className={`
                  px-4 sm:px-5 py-2 rounded-lg border-2 transition-all font-medieval text-sm flex-1 sm:flex-none
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

          {/* Dungeon size section */}
          <div id="menu-dungeon-size-section" className="mb-3">
            <label id="menu-dungeon-size-label" className="block text-gray-300 mb-2 text-center text-sm">
              Dungeon Size: <span className="text-amber-400 font-medieval">{dungeonSize}x{dungeonSize}</span>
            </label>
            <div className="flex items-center gap-3 justify-center px-4">
              <span className="text-gray-500 text-xs">8</span>
              <input
                id="menu-dungeon-size-slider"
                type="range"
                min={8}
                max={20}
                step={2}
                value={dungeonSize}
                onChange={(e) => setDungeonSize(Number(e.target.value))}
                className="w-full max-w-[200px] accent-amber-600 cursor-pointer"
              />
              <span className="text-gray-500 text-xs">20</span>
            </div>
            {dungeonSize > 8 && (
              <p className="text-gray-500 text-xs text-center mt-1">
                Board scrolls to follow your warrior
              </p>
            )}
          </div>

          {/* Start button wrapper */}
          <div id="menu-start-wrapper" className="text-center mb-2">
            {/* Begin Adventure button */}
            <motion.button
              id="menu-start-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartGame}
              className="px-8 py-2.5 text-white rounded-lg font-medieval text-base transition-all"
              style={{
                background: 'linear-gradient(180deg, #7a1f1f 0%, #5c1818 50%, #3d1010 100%)',
                border: '3px solid #8f2828',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5), 0 0 15px rgba(127, 29, 29, 0.4)',
              }}
            >
              ⚔️ Begin Adventure ⚔️
            </motion.button>
          </div>

          {/* Daily Challenge button */}
          <div id="menu-daily-wrapper" className="text-center mb-2">
            <motion.button
              id="menu-daily-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                audioService.stopCurrent();
                onStartDailyChallenge();
              }}
              className="px-8 py-2.5 text-white rounded-lg font-medieval text-base transition-all"
              style={{
                background: 'linear-gradient(180deg, #1a4a2e 0%, #0f3320 50%, #082215 100%)',
                border: '3px solid #22c55e',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.5), 0 0 15px rgba(34, 197, 94, 0.3)',
              }}
            >
              Daily Challenge
              {(() => {
                const dc = getDailyChallengeSettings(getDailyChallengeSeed());
                return (
                  <div className="text-[10px] font-normal text-green-300 mt-0.5">
                    Today: {dc.dungeonSize}x{dc.dungeonSize} · L{dc.level} · {dc.mode === GameMode.VsCPU ? 'vs CPU' : 'Solo'}
                  </div>
                );
              })()}
            </motion.button>
          </div>

          {/* Leaderboard button wrapper */}
          <div id="menu-leaderboard-wrapper" className="text-center mb-2">
            {/* View Leaderboards button */}
            <button
              id="menu-leaderboard-btn"
              onClick={() => setShowLeaderboard(true)}
              className="px-6 py-2 text-amber-300 hover:text-white rounded font-medieval text-sm transition-all"
              style={{
                background: 'linear-gradient(180deg, #5c4a32 0%, #3d2e1f 50%, #2a1f14 100%)',
                border: '2px solid #c9a24d',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              View Leaderboards
            </button>
          </div>

          {/* Instructions section */}
          <div id="menu-instructions-section" className="pt-2 border-t border-stone-700">
            {/* Instructions title */}
            <h4 id="menu-instructions-title" className="text-amber-500 font-medieval mb-1 text-center text-xs">
              How to Play
            </h4>
            {/* Instructions list */}
            <ul id="menu-instructions-list" className="text-gray-400 text-xs space-y-0.5 text-center list-none">
              <li>• Pick your Waystone location (secret safe room) to start</li>
              <li>• Navigate the labyrinth to find the dragon's treasure</li>
              <li>• Dragon wakes when you get within 3 tiles - avoid it!</li>
              <li>• Return the treasure to your Waystone to win</li>
              {players === 3 && (
                <li className="text-cyan-300">• vs CPU: A computer opponent races against you!</li>
              )}
              {level === 2 && (
                <>
                  <li className="text-amber-300">• Level 2: Doors start locked or unlocked</li>
                  <li className="text-amber-300">• Locked doors: 50% chance to unlock when trying</li>
                  <li className="text-amber-300">• Unlocked doors: Lock behind you after passing</li>
                </>
              )}
            </ul>
          </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          id="menu-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-1 text-center"
        >
          <p className="text-gray-500 text-xs mb-1">Share the adventure!</p>
          <div id="menu-footer-share" className="flex justify-center gap-2 flex-wrap">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('🐉 Delve & Dash - hunt treasure and flee a dragon! delvedash.com')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: '#000', border: '1px solid #333' }}>
              𝕏 Post
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdelvedash.com"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: '#1877F2', border: '1px solid #1455b3' }}>
              f Share
            </a>
            {'share' in navigator && (
              <button
                onClick={() => navigator.share({ title: 'Delve & Dash', text: '🐉 Hunt treasure and flee a dragon!', url: 'https://delvedash.com' })}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: '#6b21a8', border: '1px solid #581c87' }}>
                ↑ Share
              </button>
            )}
          </div>
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
