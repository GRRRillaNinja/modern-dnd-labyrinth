import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { HomeIcon } from './HomeIcon';

export const HelpSidebar: React.FC = () => {
  const { showHelp, toggleHelp, helpMessage, gameState, setHelpMessage, isCPUMode } = useGameStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    /* Root container */
    <div id="help-sidebar-root" className="w-full md:w-full flex-shrink-0 h-full flex flex-col justify-between">
      {/* Help Toggle - Desktop Only */}
      <div id="help-sidebar-toggle-panel" className="hidden md:block dungeon-panel">
        {/* Toggle content */}
        <div id="help-sidebar-toggle-content" className="dungeon-content">
          {/* Toggle label */}
          <label id="help-sidebar-toggle-label" className="flex items-center justify-between cursor-pointer">
            {/* "Help Tips" text */}
            <span id="help-sidebar-toggle-text" className="text-amber-400 font-medieval text-sm lg:text-lg">Help Tips</span>
            {/* Toggle switch wrapper */}
            <div id="help-sidebar-toggle-wrapper" className="relative">
              {/* Checkbox input */}
              <input
                id="help-sidebar-toggle-input"
                type="checkbox"
                checked={showHelp}
                onChange={toggleHelp}
                className="sr-only peer"
              />
              {/* Toggle track */}
              <div id="help-sidebar-toggle-track" className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Help Content - Always visible on mobile */}
      <AnimatePresence>
        {(showHelp || isMobile) && (
          /* Animated help content panel */
          <motion.div
            id="help-sidebar-content-panel"
            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className="dungeon-panel flex-1 min-h-0"
          >
            {/* Inner content */}
            <div id="help-sidebar-content" className="dungeon-content space-y-4 h-full overflow-y-auto">
            {/* Current Message */}
            {helpMessage && (
              /* Current message card */
              <motion.div
                id="help-sidebar-message"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className={`
                  rounded p-3 cursor-pointer transition-colors
                  ${
                    helpMessage.includes('TREASURE FOUND') || helpMessage.includes('\u{1F3C6} TREASURE FOUND')
                      ? 'bg-green-900/40 border border-green-600/70 hover:bg-green-900/50'
                      : 'bg-amber-900/30 border border-amber-700/50 hover:bg-amber-900/40'
                  }
                `}
                onClick={() => setHelpMessage('')}
                title="Click to dismiss"
              >
                {/* Message layout */}
                <div id="help-sidebar-message-layout" className="flex items-start gap-2">
                  {/* Icon based on message type */}
                  {helpMessage.includes('TREASURE FOUND') || helpMessage.includes('\u{1F3C6} TREASURE FOUND') ? (
                    <span className="text-2xl flex-shrink-0">{'\u{1F389}'}</span>
                  ) : helpMessage.includes('Waystone location') ? (
                    <div className="flex-shrink-0 mt-0.5">
                      <HomeIcon
                        size={24}
                        warriorNumber={helpMessage.includes('warrior one') || helpMessage.includes('Player 1') ? 0 : 1}
                      />
                    </div>
                  ) : (
                    <span className="text-2xl flex-shrink-0">{'\u{1F4A1}'}</span>
                  )}
                  {/* Message text */}
                  <p id="help-sidebar-message-text" className={`
                    text-sm leading-relaxed flex-1
                    ${
                      helpMessage.includes('TREASURE FOUND') || helpMessage.includes('\u{1F3C6} TREASURE FOUND')
                        ? 'text-green-200 font-bold'
                        : 'text-amber-200'
                    }
                  `}>
                    {helpMessage}
                  </p>
                  {/* Dismiss button */}
                  <button id="help-sidebar-message-dismiss" className={`
                    text-xs opacity-50 hover:opacity-100 transition-opacity
                    ${
                      helpMessage.includes('TREASURE FOUND') || helpMessage.includes('\u{1F3C6} TREASURE FOUND')
                        ? 'text-green-400 hover:text-green-200'
                        : 'text-amber-400 hover:text-amber-200'
                    }
                  `}>
                    {'\u2715'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Game Status */}
            {gameState && (
              /* Game Status section wrapper */
              <div id="help-sidebar-status-section" className="space-y-3">
                <div className="border-t border-stone-700 pt-3">
                  {/* "Game Status" heading */}
                  <h3 id="help-sidebar-status-title" className="text-amber-500 font-medieval text-sm mb-2">
                    Game Status
                  </h3>
                  {/* Status items container */}
                  <div id="help-sidebar-status-items" className="space-y-2 text-xs text-gray-400">
                    {/* Mode row */}
                    <div id="help-sidebar-status-mode" className="flex justify-start" style={{ columnGap: '5px' }}>
                      {/* Mode label */}
                      <span id="help-sidebar-status-mode-label">Mode:</span>
                      {/* Mode value */}
                      <span id="help-sidebar-status-mode-value" className="text-amber-400 font-bold">
                        {gameState.numberOfWarriors === 1 ? 'Solo' : (isCPUMode ? 'vs CPU' : 'Two Player')}
                      </span>
                    </div>
                    {/* Difficulty row */}
                    <div id="help-sidebar-status-difficulty" className="flex justify-start" style={{ columnGap: '5px' }}>
                      {/* Difficulty label */}
                      <span id="help-sidebar-status-difficulty-label">Difficulty:</span>
                      {/* Difficulty value */}
                      <span id="help-sidebar-status-difficulty-value" className="text-red-400 font-bold">
                        {gameState.level === 1 ? 'Level 1 (no doors)' : 'Level 2 (locking doors)'}
                      </span>
                    </div>
                    {/* Dragon row */}
                    <div id="help-sidebar-status-dragon" className="flex justify-start" style={{ columnGap: '5px' }}>
                      {/* Dragon label */}
                      <span id="help-sidebar-status-dragon-label">Dragon:</span>
                      {/* Dragon value */}
                      <span id="help-sidebar-status-dragon-value" className={gameState.dragon.state === 1 ? 'text-red-400 font-bold' : 'text-green-400'}>
                        {gameState.dragon.state === 0 ? 'Asleep \u{1F634}' : 'Awake & Hunting! \u{1F409}'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                {/* Tips section wrapper */}
                <div id="help-sidebar-tips-section" className="border-t border-stone-700 pt-3">
                  {/* "Quick Tips" heading */}
                  <h3 id="help-sidebar-tips-title" className="text-amber-500 font-medieval text-sm mb-2">
                    Quick Tips
                  </h3>
                  {/* Tips list */}
                  <ul id="help-sidebar-tips-list" className="text-xs space-y-1">
                    {(() => {
                      const tips = ['• Click chambers to move warriors'];

                      tips.push(
                        '• Dragon wakes when you get within 3 tiles',
                        '• After waking, visible when within 5 tiles',
                        '• \u2728 Sparkles mark a general area where the treasure can be found.'
                      );

                      tips.push(
                        '• Return treasure to The Waystone',
                        '• Safe on your Waystones tile'
                      );

                      if (gameState.level === 2) {
                        tips.push('• Doors may be locked!');
                      }

                      // Alternate colors: yellow (rgb(250, 204, 21)) and red (rgb(248, 113, 113))
                      return tips.map((tip, index) => (
                        /* Each tip item */
                        <li
                          id={`help-sidebar-tip-${index}`}
                          key={index}
                          style={{
                            color: index % 2 === 0 ? 'rgb(250, 204, 21)' : 'rgb(248, 113, 113)'
                          }}
                        >
                          {tip}
                        </li>
                      ));
                    })()}
                  </ul>
                </div>
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend panel */}
      <motion.div
        id="help-sidebar-legend-panel"
        animate={{
          y: (showHelp || isMobile) ? 0 : '-45vh'
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0.0, 0.2, 1]
        }}
        className="dungeon-panel"
      >
        {/* Legend content */}
        <div id="help-sidebar-legend-content" className="dungeon-content">
          {/* "Legend" heading */}
          <h3 id="help-sidebar-legend-title" className="text-stone-400 font-medieval text-xs lg:text-sm mb-1 lg:mb-2">Legend</h3>
          {/* Legend grid */}
          <div id="help-sidebar-legend-grid" className="grid grid-cols-2 gap-1 lg:gap-2 text-xs">
          {/* Solo Mode Layout */}
          {gameState?.numberOfWarriors === 1 && (
            <>
              {/* Row 1: Warrior 1 | W1 Waystone */}
              {/* Warrior 1 item */}
              <div id="help-sidebar-legend-warrior-1" className="flex items-center gap-1">
                <span className="text-lg">{'\u{1F5E1}\uFE0F'}</span>
                <span className="text-gray-400">Warrior 1</span>
              </div>
              {/* P1 Waystone item */}
              <div id="help-sidebar-legend-waystone-1" className="flex items-center gap-1">
                <HomeIcon size={20} warriorNumber={0} />
                <span className="text-gray-400">P1 Waystone</span>
              </div>

              {/* Row 2: Treasure | Treasure Hint (always show) */}
              {/* Treasure item */}
              <div id="help-sidebar-legend-treasure" className="flex items-center gap-1">
                <span className="text-lg">{'\u{1F3C6}'}</span>
                <span className="text-gray-400">Treasure</span>
              </div>
              {/* Treasure Hint item */}
              <div id="help-sidebar-legend-treasure-hint" className="flex items-center gap-1">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full border border-yellow-500 bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-xs">{'\u2728'}</span>
                  </div>
                </div>
                <span className="text-gray-400">Treasure Hint</span>
              </div>

              {/* Row 3: Dragon | Door (if level 2) */}
              {/* Dragon item */}
              <div id="help-sidebar-legend-dragon" className="flex items-center gap-1">
                <span className="text-lg">{'\u{1F409}'}</span>
                <span className="text-gray-400">Dragon</span>
              </div>
              {gameState.level === 2 ? (
                /* Door item */
                <div id="help-sidebar-legend-door" className="flex items-center gap-1">
                  <div className="w-8 h-1 bg-amber-700 rounded shadow-sm"></div>
                  <span className="text-gray-400"> Door</span>
                </div>
              ) : (
                <div></div>
              )}
            </>
          )}

          {/* Two-Player Mode Layout */}
          {gameState?.numberOfWarriors === 2 && (
            <>
              {/* Row 1: Warrior 1 | Warrior 2 */}
              {/* Warrior 1 item */}
              <div id="help-sidebar-legend-warrior-1" className="flex items-center gap-1">
                <span className="text-lg">{'\u{1F5E1}\uFE0F'}</span>
                <span className="text-gray-400">Warrior 1</span>
              </div>
              {/* Warrior 2 item */}
              <div id="help-sidebar-legend-warrior-2" className="flex items-center gap-1">
                <span className="text-lg">{'\u2694\uFE0F'}</span>
                <span className="text-gray-400">Warrior 2</span>
              </div>

              {/* Row 2: W1 Waystone | W2 Waystone */}
              {/* P1 Waystone item */}
              <div id="help-sidebar-legend-waystone-1" className="flex items-center gap-1">
                <HomeIcon size={20} warriorNumber={0} />
                <span className="text-gray-400">P1 Waystone</span>
              </div>
              {/* P2 Waystone item */}
              <div id="help-sidebar-legend-waystone-2" className="flex items-center gap-1">
                <HomeIcon size={20} warriorNumber={1} />
                <span className="text-gray-400">P2 Waystone</span>
              </div>

              {/* Row 3: Treasure | Treasure Hint (always show) */}
              {/* Treasure item */}
              <div id="help-sidebar-legend-treasure" className="flex items-center gap-1">
                <span className="text-lg">{'\u{1F3C6}'}</span>
                <span className="text-gray-400">Treasure</span>
              </div>
              {/* Treasure Hint item */}
              <div id="help-sidebar-legend-treasure-hint" className="flex items-center gap-1">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full border border-yellow-500 bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-xs">{'\u2728'}</span>
                  </div>
                </div>
                <span className="text-gray-400">Treasure Hint</span>
              </div>

              {/* Row 4: Dragon | Door (if level 2) */}
              {/* Dragon item */}
              <div id="help-sidebar-legend-dragon" className="flex items-center gap-1">
                <span className="text-lg">{'\u{1F409}'}</span>
                <span className="text-gray-400">Dragon</span>
              </div>
              {gameState.level === 2 ? (
                /* Door item */
                <div id="help-sidebar-legend-door" className="flex items-center gap-1">
                  <div className="w-8 h-1 bg-amber-700 rounded shadow-sm"></div>
                  <span className="text-gray-400"> Door</span>
                </div>
              ) : (
                <div></div>
              )}
            </>
          )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
