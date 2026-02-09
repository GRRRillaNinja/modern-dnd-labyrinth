import React from 'react';
import { useGameStore } from '../store/gameStore';
import { GameState, DragonState } from '@shared/types';
import { audioService } from '../services/AudioService';

export const RightSidebar: React.FC<{ onlyControls?: boolean; onlySounds?: boolean }> = ({ onlyControls, onlySounds }) => {
  const {
    gameState,
    resetGame,
    finishTurn,
    skipWarriorTwo,
    isDragonTurn,
    isCPUMode,
  } = useGameStore();

  // Variant suffix for unique IDs when component is rendered multiple times
  const v = onlyControls ? 'mobile-controls' : onlySounds ? 'mobile-sounds' : 'desktop';
  
  const sounds = [
    { id: 'defeat', name: 'Defeat', description: 'Warrior is defeated' },
    { id: 'door', name: 'Door Locked', description: 'Door is locked (Level 2)' },
    { id: 'dragonAttacks', name: 'Dragon Attacks', description: 'Dragon attacks warrior' },
    { id: 'dragonChime', name: 'Dragon Chime', description: 'Dragon turn notification' },
    { id: 'dragonFlying', name: 'Dragon Flying', description: 'Dragon moves/flies' },
    { id: 'dragonWakes', name: 'Dragon Wakes', description: 'Dragon awakens nearby' },
    { id: 'levelOne', name: 'Level One', description: 'Level 1 Difficulty' },
    { id: 'levelTwo', name: 'Level Two', description: 'Level 2 Difficulty' },
    { id: 'treasure', name: 'Treasure Found', description: 'Warrior finds treasure' },
    { id: 'winner', name: 'Victory', description: 'Warrior wins the game' },
    { id: 'wall', name: 'Wall Hit', description: 'Warrior discovers a wall' },
    { id: 'scuffle', name: 'Warrior Battle', description: 'Players fight over treasure' },
    { id: 'warriorMoves', name: 'Warrior Moves', description: 'Movement sound effect' },
    { id: 'warriorOne', name: 'Warrior One', description: 'Announces Player 1\'s turn' },
    { id: 'warriorTwo', name: 'Warrior Two', description: 'Announces Player 2\'s turn' },
  ] as const;

  if (!gameState) return null;

  const handleNextTurn = () => {
    const state = gameState.state;

    if (state === GameState.WarriorTwoSelectRoom && !isCPUMode) {
      skipWarriorTwo();
    } else if (state === GameState.WarriorOneTurn) {
      finishTurn(0);
    } else if (state === GameState.WarriorTwoTurn && !isCPUMode) {
      finishTurn(1);
    }
  };

  const isNextTurnDisabled =
    gameState.state === GameState.Wait ||
    gameState.state === GameState.GameOver ||
    isDragonTurn || // Disable during dragon's turn
    (isCPUMode && (gameState.state === GameState.WarriorTwoTurn || gameState.state === GameState.WarriorTwoSelectRoom)); // Disable during CPU turn/selection

  const getNextTurnLabel = () => {
    if (gameState.state === GameState.WarriorTwoSelectRoom && !isCPUMode) {
      return 'Skip (Single Player)';
    }
    if (isCPUMode && gameState.state === GameState.WarriorTwoTurn) {
      return 'CPU Turn...';
    }
    return 'Next Turn';
  };

  return (
    <div id={`right-sidebar-${v}-root`} className={`w-full flex-shrink-0 flex flex-col gap-2 lg:gap-4 ${!onlyControls && !onlySounds ? 'md:h-full md:overflow-hidden' : ''}`}>
      {/* Controls Panel */}
      {!onlySounds && (
      <div id={`right-sidebar-${v}-controls-panel`} className="dungeon-panel">
        <div id={`right-sidebar-${v}-controls-content`} className="dungeon-content">
          {/* Controls Title */}
          <h3 id={`right-sidebar-${v}-controls-title`} className="text-amber-500 font-medieval text-sm lg:text-lg mb-2 lg:mb-4 text-center">
            Game Controls
          </h3>

          {/* Button Row - Single row on mobile, column on desktop */}
          <div id={`right-sidebar-${v}-buttons`} className="flex md:flex-col gap-2">
          {/* Next Turn Button - Beveled green */}
          <button
            id={`right-sidebar-${v}-next-turn-btn`}
            onClick={handleNextTurn}
            disabled={isNextTurnDisabled}
            className="flex-1 md:w-full px-3 lg:px-6 py-2 lg:py-3 text-white rounded font-medieval text-sm lg:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5"
            style={{
              background: 'linear-gradient(180deg, #2f7d4a 0%, #246b3a 50%, #1a5a2e 100%)',
              border: '2px solid #3d9960',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)',
            }}
          >
            {/* Next Turn label - full text on sm+ */}
            <span className="hidden sm:inline">{getNextTurnLabel()}</span>
            {/* Next Turn label - short text */}
            <span className="sm:hidden">Next</span>
          </button>

          {/* Reset Game Button - Beveled dark red */}
          <button
            id={`right-sidebar-${v}-reset-btn`}
            onClick={resetGame}
            className="flex-1 md:w-full px-3 lg:px-6 py-2 lg:py-3 text-white rounded font-medieval text-sm lg:text-lg transition-all active:translate-y-0.5"
            style={{
              background: 'linear-gradient(180deg, #7a1f1f 0%, #5c1818 50%, #3d1010 100%)',
              border: '2px solid #8f2828',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)',
            }}
          >
            {/* Reset label - full text */}
            <span className="hidden sm:inline">Reset Game</span>
            {/* Reset label - short text */}
            <span className="sm:hidden">Reset</span>
          </button>
        </div>

        {/* Warrior Info - Compact on Mobile, Full on Desktop */}
        {(gameState.state === GameState.WarriorOneTurn || gameState.state === GameState.WarriorTwoTurn) && (
          <div id={`right-sidebar-${v}-warrior-info`} className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-stone-700">
            {/* Mobile portrait: Single Row Layout */}
            <div id={`right-sidebar-${v}-warrior-mobile`} className="md:hidden">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Current Turn + Icon */}
                <div className="flex items-center gap-2">
                  {/* Warrior icon - mobile */}
                  <span id={`right-sidebar-${v}-warrior-mobile-icon`} className="text-3xl">
                    {gameState.state === GameState.WarriorOneTurn ? '🗡️' : '⚔️'}
                  </span>
                  <div>
                    {/* Turn label - mobile */}
                    <div id={`right-sidebar-${v}-warrior-mobile-turn-label`} className="text-xs text-gray-400">Turn</div>
                    {/* Turn name - mobile */}
                    <div id={`right-sidebar-${v}-warrior-mobile-turn-name`} className="text-amber-400 font-medieval text-sm">
                      {gameState.state === GameState.WarriorOneTurn ? 'Warrior One' : (isCPUMode ? 'CPU' : 'Warrior Two')}
                    </div>
                  </div>
                </div>

                {/* Right: Lives */}
                <div id={`right-sidebar-${v}-warrior-mobile-lives`} className="text-right">
                  <div className="text-xs text-gray-400 mb-1">Lives</div>
                  {/* Hearts - mobile */}
                  <div id={`right-sidebar-${v}-warrior-mobile-hearts`} className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span
                        key={i}
                        id={`right-sidebar-${v}-warrior-mobile-heart-${i}`}
                        className={`text-xl ${
                          i < (gameState.state === GameState.WarriorOneTurn
                            ? gameState.warriors[0].lives
                            : gameState.warriors[1].lives)
                            ? 'text-red-500'
                            : 'text-gray-700'
                        }`}
                      >
                        ♥
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Moves Remaining - Mobile */}
              {(gameState.numberOfWarriors === 2 || gameState.dragon.state === DragonState.Awake) && (
                <div id={`right-sidebar-${v}-warrior-mobile-moves`} className="mt-3 text-center">
                  <span className="text-xs text-gray-400">Moves: </span>
                  <span id={`right-sidebar-${v}-warrior-mobile-moves-value`} className="text-green-400 font-bold text-xl">
                    {gameState.state === GameState.WarriorOneTurn
                      ? gameState.warriors[0].moves
                      : gameState.warriors[1].moves}
                  </span>
                </div>
              )}
            </div>

            {/* Tablet+Desktop: Compact Horizontal Layout */}
            <div id={`right-sidebar-${v}-warrior-desktop`} className="hidden md:flex items-center justify-between gap-2 lg:gap-3">
              {/* Left: Icon + Turn Name */}
              <div className="flex items-center gap-2">
                {/* Warrior icon - desktop */}
                <span id={`right-sidebar-${v}-warrior-desktop-icon`} className="text-2xl lg:text-3xl">
                  {gameState.state === GameState.WarriorOneTurn ? '🗡️' : '⚔️'}
                </span>
                <div>
                  <div className="text-xs text-gray-400">Turn</div>
                  {/* Turn name - tablet/desktop */}
                  <div id={`right-sidebar-${v}-warrior-desktop-turn-name`} className="text-amber-400 font-medieval text-xs lg:text-base">
                    {gameState.state === GameState.WarriorOneTurn ? 'Warrior One' : (isCPUMode ? 'CPU' : 'Warrior Two')}
                  </div>
                </div>
              </div>

              {/* Center: Lives (Hearts) */}
              <div id={`right-sidebar-${v}-warrior-desktop-lives`} className="text-center">
                <div className="text-xs text-gray-400 mb-0.5">Lives</div>
                {/* Hearts - tablet/desktop */}
                <div id={`right-sidebar-${v}-warrior-desktop-hearts`} className="flex gap-0.5 lg:gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      id={`right-sidebar-${v}-warrior-desktop-heart-${i}`}
                      className={`text-base lg:text-xl ${
                        i < (gameState.state === GameState.WarriorOneTurn
                          ? gameState.warriors[0].lives
                          : gameState.warriors[1].lives)
                          ? 'text-red-500'
                          : 'text-gray-700'
                      }`}
                    >
                      ♥
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Moves Remaining */}
              {(gameState.numberOfWarriors === 2 || gameState.dragon.state === DragonState.Awake) && (
                <div id={`right-sidebar-${v}-warrior-desktop-moves`} className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">Moves</div>
                  {/* Moves value - tablet/desktop */}
                  <div id={`right-sidebar-${v}-warrior-desktop-moves-value`} className="text-green-400 font-bold text-lg lg:text-2xl">
                    {gameState.state === GameState.WarriorOneTurn
                      ? gameState.warriors[0].moves
                      : gameState.warriors[1].moves}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
      )}

      {/* Sound Preview Panel */}
      {!onlyControls && (
      <div id={`right-sidebar-${v}-sound-panel`} className="dungeon-panel md:min-h-0 md:flex-1 md:flex md:flex-col">
        <div id={`right-sidebar-${v}-sound-content`} className="dungeon-content md:min-h-0 md:flex-1 md:flex md:flex-col">
          {/* Sound Preview Title */}
          <h3 id={`right-sidebar-${v}-sound-title`} className="text-amber-500 font-medieval text-sm lg:text-lg mb-2 lg:mb-3">
            🔊 Sound Preview
          </h3>
          {/* Sound instructions */}
          <div id={`right-sidebar-${v}-sound-instructions`} className="text-xs text-gray-400 mb-2 lg:mb-3">
            Click to preview each game sound:
          </div>
          {/* Sound button list */}
          <div id={`right-sidebar-${v}-sound-list`} className="space-y-1 lg:space-y-2 max-h-48 md:max-h-none md:flex-1 overflow-y-auto pr-1">
            {sounds.map((sound) => (
              <button
                key={sound.id}
                id={`right-sidebar-${v}-sound-btn-${sound.id}`}
                onClick={() => audioService.play(sound.id as any)}
                className="w-full text-left p-2 lg:p-3 rounded bg-stone-800 hover:bg-stone-700 transition-colors border border-stone-700 hover:border-amber-700"
              >
                {/* Sound name */}
                <div id={`right-sidebar-${v}-sound-name-${sound.id}`} className="text-xs lg:text-sm font-semibold text-amber-300">{sound.name}</div>
                {/* Sound description */}
                <div id={`right-sidebar-${v}-sound-desc-${sound.id}`} className="text-xs text-gray-500 mt-0.5 lg:mt-1 hidden lg:block">{sound.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
