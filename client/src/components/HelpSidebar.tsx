import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { HomeIcon } from './HomeIcon';

export const HelpSidebar: React.FC = () => {
  const { showHelp, toggleHelp, helpMessage, gameState, setHelpMessage } = useGameStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full lg:w-80 flex-shrink-0 h-full flex flex-col justify-between">
      {/* Help Toggle - Desktop Only */}
      <div className="hidden lg:block bg-stone-900 border-2 border-amber-700 rounded-lg p-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-amber-400 font-medieval text-lg">Help Tips</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={showHelp}
              onChange={toggleHelp}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </div>
        </label>
      </div>

      {/* Help Content - Always visible on mobile */}
      <AnimatePresence>
        {(showHelp || isMobile) && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className="bg-stone-900 border-2 border-amber-700 rounded-lg overflow-hidden"
          >
            <div className="p-4 space-y-4">
            {/* Current Message */}
            {helpMessage && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className={`
                  rounded p-3 cursor-pointer transition-colors
                  ${
                    helpMessage.includes('TREASURE FOUND') || helpMessage.includes('🏆 TREASURE FOUND')
                      ? 'bg-green-900/40 border border-green-600/70 hover:bg-green-900/50'
                      : 'bg-amber-900/30 border border-amber-700/50 hover:bg-amber-900/40'
                  }
                `}
                onClick={() => setHelpMessage('')}
                title="Click to dismiss"
              >
                <div className="flex items-start gap-2">
                  {/* Icon based on message type */}
                  {helpMessage.includes('TREASURE FOUND') || helpMessage.includes('🏆 TREASURE FOUND') ? (
                    <span className="text-2xl flex-shrink-0">🎉</span>
                  ) : helpMessage.includes('Waystone location') ? (
                    <div className="flex-shrink-0 mt-0.5">
                      <HomeIcon 
                        size={24} 
                        warriorNumber={helpMessage.includes('warrior one') || helpMessage.includes('Player 1') ? 0 : 1} 
                      />
                    </div>
                  ) : (
                    <span className="text-2xl flex-shrink-0">💡</span>
                  )}
                  <p className={`
                    text-sm leading-relaxed flex-1
                    ${
                      helpMessage.includes('TREASURE FOUND') || helpMessage.includes('🏆 TREASURE FOUND')
                        ? 'text-green-200 font-bold'
                        : 'text-amber-200'
                    }
                  `}>
                    {helpMessage}
                  </p>
                  <button className={`
                    text-xs opacity-50 hover:opacity-100 transition-opacity
                    ${
                      helpMessage.includes('TREASURE FOUND') || helpMessage.includes('🏆 TREASURE FOUND')
                        ? 'text-green-400 hover:text-green-200'
                        : 'text-amber-400 hover:text-amber-200'
                    }
                  `}>
                    ✕
                  </button>
                </div>
              </motion.div>
            )}

            {/* Game Status */}
            {gameState && (
              <div className="space-y-3">
                <div className="border-t border-stone-700 pt-3">
                  <h3 className="text-amber-500 font-medieval text-sm mb-2">
                    Game Status
                  </h3>
                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex justify-start" style={{ columnGap: '5px' }}>
                      <span>Mode:</span>
                      <span className="text-amber-400 font-bold">
                        {gameState.numberOfWarriors === 1 ? 'Solo' : 'Two Player'}
                      </span>
                    </div>
                    <div className="flex justify-start" style={{ columnGap: '5px' }}>
                      <span>Difficulty:</span>
                      <span className="text-red-400 font-bold">
                        {gameState.level === 1 ? 'Level 1 (no doors)' : 'Level 2 (locking doors)'}
                      </span>
                    </div>
                    <div className="flex justify-start" style={{ columnGap: '5px' }}>
                      <span>Dragon:</span>
                      <span className={gameState.dragon.state === 1 ? 'text-red-400 font-bold' : 'text-green-400'}>
                        {gameState.dragon.state === 0 ? 'Asleep 😴' : 'Awake & Hunting! 🐉'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="border-t border-stone-700 pt-3">
                  <h3 className="text-amber-500 font-medieval text-sm mb-2">
                    Quick Tips
                  </h3>
                  <ul className="text-xs space-y-1">
                    {(() => {
                      const tips = ['• Click chambers to move warriors'];
                      
                      if (gameState.numberOfWarriors === 1) {
                        tips.push(
                          '• Dragon wakes when you get within 3 tiles',
                          '• After waking, visible when within 5 tiles',
                          '• ✨ Sparkles mark a general area where the treasure can be found.'
                        );
                      } else {
                        tips.push('• Dragon wakes when you get within 3 tiles');
                      }
                      
                      tips.push(
                        '• Return treasure to The Waystone',
                        '• Safe on your Waystones tile'
                      );
                      
                      if (gameState.level === 2) {
                        tips.push('• Doors may be locked!');
                      }
                      
                      // Alternate colors: yellow (rgb(250, 204, 21)) and red (rgb(248, 113, 113))
                      return tips.map((tip, index) => (
                        <li 
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

      {/* Quick Legend */}
      <motion.div
        animate={{
          y: (showHelp || isMobile) ? 0 : '-58vh'
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0.0, 0.2, 1]
        }}
        className="bg-stone-900 border-2 border-stone-700 rounded-lg p-3"
      >
        <h3 className="text-stone-400 font-medieval text-sm mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Solo Mode Layout */}
          {gameState?.numberOfWarriors === 1 && (
            <>
              {/* Row 1: Warrior 1 | W1 Waystone */}
              <div className="flex items-center gap-1">
                <span className="text-lg">🗡️</span>
                <span className="text-gray-400">Warrior 1</span>
              </div>
              <div className="flex items-center gap-1">
                <HomeIcon size={20} warriorNumber={0} />
                <span className="text-gray-400">P1 Waystone</span>
              </div>
              
              {/* Row 2: Treasure | Treasure Hint (always show) */}
              <div className="flex items-center gap-1">
                <span className="text-lg">🏆</span>
                <span className="text-gray-400">Treasure</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full border border-yellow-500 bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-xs">✨</span>
                  </div>
                </div>
                <span className="text-gray-400">Treasure Hint</span>
              </div>
              
              {/* Row 3: Dragon | Door (if level 2) */}
              <div className="flex items-center gap-1">
                <span className="text-lg">🐉</span>
                <span className="text-gray-400">Dragon</span>
              </div>
              {gameState.level === 2 ? (
                <div className="flex items-center gap-1">
                  <div className="w-8 h-1 bg-amber-700 rounded shadow-sm"></div>
                  <span className="text-gray-400">Door (may lock randomly)</span>
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
              <div className="flex items-center gap-1">
                <span className="text-lg">🗡️</span>
                <span className="text-gray-400">Warrior 1</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">⚔️</span>
                <span className="text-gray-400">Warrior 2</span>
              </div>
              
              {/* Row 2: W1 Waystone | W2 Waystone */}
              <div className="flex items-center gap-1">
                <HomeIcon size={20} warriorNumber={0} />
                <span className="text-gray-400">P1 Waystone</span>
              </div>
              <div className="flex items-center gap-1">
                <HomeIcon size={20} warriorNumber={1} />
                <span className="text-gray-400">P2 Waystone</span>
              </div>
              
              {/* Row 3: Treasure | Treasure Hint (always show) */}
              <div className="flex items-center gap-1">
                <span className="text-lg">🏆</span>
                <span className="text-gray-400">Treasure</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full border border-yellow-500 bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-xs">✨</span>
                  </div>
                </div>
                <span className="text-gray-400">Treasure Hint</span>
              </div>
              
              {/* Row 4: Dragon | Door (if level 2) */}
              <div className="flex items-center gap-1">
                <span className="text-lg">🐉</span>
                <span className="text-gray-400">Dragon</span>
              </div>
              {gameState.level === 2 ? (
                <div className="flex items-center gap-1">
                  <div className="w-8 h-1 bg-amber-700 rounded shadow-sm"></div>
                  <span className="text-gray-400">Door (may lock randomly)</span>
                </div>
              ) : (
                <div></div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
