import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from './components/Menu';
import { Board } from './components/Board';
import { HelpSidebar } from './components/HelpSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Leaderboard } from './components/Leaderboard';
import { PlayerNameModal } from './components/PlayerNameModal';
import { useGameStore, calculateWallsDiscoveredPct } from './store/gameStore';
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
    submissionResult,
  } = useGameStore();

  // Calculate game time for display
  const getGameTime = () => {
    if (!gameStartTime || !gameEndTime) return 0;
    return gameEndTime - gameStartTime;
  };

  // Calculate walls discovered percentage for display
  const getWallsDiscoveredPct = () => {
    const state = useGameStore.getState();
    if (!state.gameState) return 0;
    return calculateWallsDiscoveredPct(state.chamberPaths, state.gameState.discoveredWalls);
  };

  // Live game timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (gameStartTime && !gameEndTime) {
      // Game is active — tick every second
      setElapsedTime(Date.now() - gameStartTime);
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - gameStartTime);
      }, 1000);
    } else if (gameStartTime && gameEndTime) {
      // Game ended — show final time
      setElapsedTime(gameEndTime - gameStartTime);
    } else {
      // Not started yet
      setElapsedTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStartTime, gameEndTime]);

  const formatElapsedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
    <div id="app-root" className="min-h-screen">
      {/* Header */}
      <div id="app-header" className="border-b border-stone-800 bg-black/50">
        <div id="app-header-content" className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Exit to Menu Button */}
          <button
            id="app-header-exit-btn"
            onClick={handleExit}
            className="w-32 sm:w-40 px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            {/* Exit arrow icon */}
            <span id="app-header-exit-arrow">←</span>
            {/* Exit label */}
            <span id="app-header-exit-label" className="hidden sm:inline">Exit to Menu</span>
          </button>
          {/* Game Title */}
          <h1 id="app-header-title" className="text-xl sm:text-2xl font-medieval text-red-500">
            D&D Computer Labyrinth
          </h1>
          {/* Live Game Timer */}
          <div
            id="app-header-timer"
            className="w-32 sm:w-40 px-4 py-2 text-gray-400 flex items-center justify-end gap-2 font-medieval"
          >
            <span id="app-header-timer-label" className="hidden sm:inline text-sm">Time</span>
            <span id="app-header-timer-value" className={`text-lg tabular-nums ${gameStartTime ? 'text-amber-400' : 'text-gray-600'}`}>
              {formatElapsedTime(elapsedTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="app-main-content" className="max-w-[1600px] mx-auto px-2 sm:px-4 py-2 overflow-y-auto" style={{ height: 'calc(100vh - 68px)' }}>
        {/* Layout Container */}
        <div id="app-layout" className="flex flex-col md:flex-row gap-2 sm:gap-4 md:h-full">

          {/* Mobile portrait: Controls above board */}
          <div id="app-mobile-controls" className="md:hidden order-1">
            <RightSidebar onlyControls />
          </div>

          {/* Desktop: Help Sidebar (left column) */}
          <div id="app-help-sidebar-wrapper" className="hidden lg:block lg:w-80 lg:flex-shrink-0 lg:overflow-y-auto lg:order-1">
            <HelpSidebar />
          </div>

          {/* Board (always visible) */}
          <div id="app-board-wrapper" className="flex-1 order-2 md:order-1 lg:order-2 flex items-center justify-center" style={{ minHeight: '300px' }}>
            <Board />
          </div>

          {/* Tablet landscape: Combined sidebar (Controls + Help) */}
          <div id="app-tablet-sidebar" className="hidden md:flex lg:hidden md:flex-col md:w-56 md:flex-shrink-0 md:order-2 md:h-full md:overflow-y-auto">
            <RightSidebar onlyControls />
            <HelpSidebar />
          </div>

          {/* Desktop: Right Sidebar (right column) */}
          <div id="app-right-sidebar-wrapper" className="hidden lg:block lg:w-80 lg:flex-shrink-0 lg:order-3 lg:h-full lg:overflow-hidden">
            <RightSidebar />
          </div>

          {/* Mobile portrait: Help below board */}
          <div id="app-mobile-help" className="md:hidden order-3">
            <HelpSidebar />
          </div>

          {/* Mobile portrait: Sound preview */}
          <div id="app-mobile-sounds" className="md:hidden order-4">
            <RightSidebar onlySounds />
          </div>
        </div>
      </div>

      {/* Player Name Modal - shown after game ends */}
      <PlayerNameModal
        isVisible={showPlayerNameModal}
        gameWon={useGameStore.getState().gameWon}
        gameTime={getGameTime()}
        totalMoves={useGameStore.getState().totalMoves}
        totalDeaths={useGameStore.getState().totalDeaths}
        wallsDiscoveredPct={getWallsDiscoveredPct()}
        onSubmit={submitScore}
        onSkip={skipScoreSubmission}
      />

      {/* Treasure Found Flash Effect */}
      <AnimatePresence>
        {showTreasureFlash && (
          <motion.div
            id="app-effect-treasure-flash"
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
            id="app-effect-door-flash"
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
            id="app-effect-death-flash"
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
            id="app-effect-battle-shake"
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
              id="app-effect-battle-flash"
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
            id="app-effect-victory-fireworks"
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
                id={`app-effect-firework-burst-${i}`}
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
                {/* Firework glow */}
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
                id={`app-effect-sparkle-${i}`}
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
          submissionResult={submissionResult}
        />
      )}
    </div>
  );
}

export default App;
