import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from './components/Menu';
import { Board } from './components/Board';
import { HelpSidebar } from './components/HelpSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Leaderboard } from './components/Leaderboard';
import { PlayerNameModal } from './components/PlayerNameModal';
import { useGameStore } from './store/gameStore';
import { GameMode } from '@shared/types';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { 
    initGame, 
    gameState, 
    showTreasureFlash, 
    showDoorFlash, 
    showDeathFlash, 
    showBattleShake, 
    showVictoryFireworks, 
    gameStartTime, 
    gameEndTime,
    showPlayerNameModal,
    showLeaderboardAfterGame,
    submitScore,
    skipScoreSubmission,
    closeLeaderboard,
  } = useGameStore();

  // Calculate game time for display
  const getGameTime = () => {
    if (!gameStartTime || !gameEndTime) return 0;
    return gameEndTime - gameStartTime;
  };

  const handleStartGame = (mode: GameMode, players: number, level: number) => {
    initGame(mode, players, level);
    setGameStarted(true);
  };

  const handleExit = () => {
    setGameStarted(false);
  };

  if (!gameStarted) {
    return <Menu onStart={handleStartGame} onShowLeaderboard={() => setShowLeaderboard(true)} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
<div className="border-b border-stone-800 bg-black/50">
  <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
    <button
      onClick={handleExit}
      className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
    >
      <span>←</span>
      <span className="hidden sm:inline">Exit to Menu</span>
    </button>
    <h1 className="text-xl sm:text-2xl font-medieval text-red-500">
      D&D Computer Labyrinth
    </h1>
    
      <a href="https://tinyurl.com/dndlab-manual"
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
    >
      <span className="hidden sm:inline">Game Manual</span>
    </a>
  </div>
</div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-2 overflow-y-auto" style={{ height: 'calc(100vh - 68px)' }}>
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:h-full">
          
          {/* Game Controls - First on Mobile, part of Right Sidebar on Desktop */}
          <div className="lg:hidden order-1">
            <RightSidebar onlyControls />
          </div>

          {/* Help Sidebar - Left (Desktop) / Third on Mobile */}
          <div className="lg:w-80 lg:flex-shrink-0 lg:overflow-y-auto order-3 lg:order-1">
            <HelpSidebar />
          </div>

          {/* Game Board - Center */}
          <div className="flex-1 order-2 flex items-center justify-center" style={{ minHeight: '300px' }}>
            <Board />
          </div>

          {/* Right Sidebar - Desktop only / Controls moved to top on mobile */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0 lg:order-3">
            <RightSidebar />
          </div>
          
          {/* Sound Preview - Last on Mobile */}
          <div className="lg:hidden order-4">
            <RightSidebar onlySounds />
          </div>
        </div>
      </div>

      {/* Player Name Modal - shown after game ends */}
      <PlayerNameModal
        isVisible={showPlayerNameModal}
        gameWon={useGameStore.getState().gameWon}
        gameTime={getGameTime()}
        onSubmit={submitScore}
        onSkip={skipScoreSubmission}
      />

      {/* Treasure Found Flash Effect */}
      <AnimatePresence>
        {showTreasureFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0.4, 0.6, 0],
              scale: [1, 1.02, 1.01, 1.02, 1]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1,
              times: [0, 0.2, 0.5, 0.8, 1]
            }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.2) 50%, transparent 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Door Locked Flash Effect */}
      <AnimatePresence>
        {showDoorFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.5, 0.3, 0.5, 0],
              scale: [1, 1.01, 1, 1.01, 1]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.8,
              times: [0, 0.2, 0.5, 0.8, 1]
            }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.2) 50%, transparent 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Death Flash Effect */}
      <AnimatePresence>
        {showDeathFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1,
              times: [0, 0.3, 1]
            }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: 'radial-gradient(circle, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Battle Shake Effect */}
      <AnimatePresence>
        {showBattleShake && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            animate={{
              x: [0, -10, 10, -10, 10, -5, 5, 0],
              y: [0, 5, -5, 5, -5, 3, -3, 0],
            }}
            transition={{
              duration: 0.6,
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 1],
              ease: "easeInOut"
            }}
          >
            {/* Orange flash overlay for impact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.4, 0.2, 0.4, 0],
              }}
              transition={{ 
                duration: 0.6,
                times: [0, 0.15, 0.3, 0.5, 1]
              }}
              className="fixed inset-0"
              style={{
                background: 'radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(249, 115, 22, 0.2) 50%, transparent 100%)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Fireworks Effect */}
      <AnimatePresence>
        {showVictoryFireworks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 pointer-events-none z-45"
          >
            {/* Multiple firework bursts */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 60}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 2],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.3,
                  repeat: 1,
                  ease: "easeOut"
                }}
              >
                <div
                  className="w-32 h-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${
                      ['rgba(250, 204, 21, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'][i % 4]
                    } 0%, transparent 70%)`
                  }}
                />
              </motion.div>
            ))}
            {/* Sparkles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 360],
                  y: [0, -50]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: 1,
                  ease: "easeOut"
                }}
              >
                ✨
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal - Manual View */}
      {showLeaderboard && gameState && (
        <Leaderboard
          gameMode={gameState.numberOfWarriors === 1 ? 'solo' : 'multiplayer'}
          difficultyLevel={gameState.level as 1 | 2}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Leaderboard Modal - After Game Completion */}
      {showLeaderboardAfterGame && gameState && (
        <Leaderboard
          gameMode={gameState.numberOfWarriors === 1 ? 'solo' : 'multiplayer'}
          difficultyLevel={gameState.level as 1 | 2}
          onClose={closeLeaderboard}
        />
      )}
    </div>
  );
}

export default App;
