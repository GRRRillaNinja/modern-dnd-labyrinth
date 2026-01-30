import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Position,
  ChamberPath,
  PathType,
  Direction,
  GameStateData,
} from '@shared/types';
import { ParticleCloud } from './ParticleCloud';
import { HomeIcon } from './HomeIcon';

interface ChamberProps {
  position: Position;
  paths: ChamberPath;
  gameState: GameStateData;
  onClick: () => void;
  isDragonTurn: boolean;
}

export const Chamber: React.FC<ChamberProps> = ({
  position,
  paths,
  gameState,
  onClick,
  isDragonTurn,
}) => {
  const [row, col] = position;

  // Check if a wall has been discovered
  const isWallDiscovered = (dir: Direction): boolean => {
    const key = `${row}-${col}-${dir}`;
    return gameState.discoveredWalls[key] || false;
  };

  // Check if a door is locked
  const isDoorLocked = (dir: Direction): boolean => {
    const key = `${row}-${col}-${dir}`;
    return gameState.lockedDoors[key] || false;
  };

  // Check if this is a secret room
  const isWarrior0Secret =
    gameState.warriors[0].secretRoom &&
    gameState.warriors[0].secretRoom[0] === row &&
    gameState.warriors[0].secretRoom[1] === col;

  const isWarrior1Secret =
    gameState.warriors[1].secretRoom &&
    gameState.warriors[1].secretRoom[0] === row &&
    gameState.warriors[1].secretRoom[1] === col;

  // Check warrior positions
  const hasWarrior0 =
    gameState.warriors[0].position &&
    gameState.warriors[0].position[0] === row &&
    gameState.warriors[0].position[1] === col &&
    gameState.warriors[0].lives > 0;

  const hasWarrior1 =
    gameState.warriors[1].position &&
    gameState.warriors[1].position[0] === row &&
    gameState.warriors[1].position[1] === col &&
    gameState.warriors[1].lives > 0;

  // Check dragon position
  const hasDragon =
    gameState.dragon.visible &&
    gameState.dragon.position &&
    gameState.dragon.position[0] === row &&
    gameState.dragon.position[1] === col;

  // Check treasure
  const hasTreasure =
    gameState.treasure.visible &&
    gameState.treasure.warrior < 0 &&
    gameState.treasure.room &&
    gameState.treasure.room[0] === row &&
    gameState.treasure.room[1] === col;

  // Treasure hint marker (single player only - where dragon was first spotted)
  // Only show if treasure hasn't been found yet
  const showTreasureHint =
    gameState.numberOfWarriors === 1 &&
    gameState.treasure.warrior < 0 &&
    gameState.dragon.treasureHintPosition &&
    gameState.dragon.treasureHintPosition[0] === row &&
    gameState.dragon.treasureHintPosition[1] === col;

  return (
    <div className="relative w-full h-full">
      {/* Chamber cell */}
      <motion.div
        className={`
          w-full h-full rounded-sm
          transition-all duration-200
          ${!isWarrior0Secret && !isWarrior1Secret ? 'bg-stone-800/40 hover:bg-stone-700/50' : ''}
          ${isDragonTurn ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        `}
        whileHover={isDragonTurn ? {} : { scale: 1.05 }}
        whileTap={isDragonTurn ? {} : { scale: 0.95 }}
        onClick={isDragonTurn ? undefined : onClick}
      >
        {/* Secret room background with gradient fade */}
        {isWarrior0Secret && (
          <div className="absolute inset-0 rounded-sm overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, rgba(30, 58, 138, 0.35) 0%, rgba(30, 58, 138, 0.15) 40%, rgba(30, 58, 138, 0.05) 70%, rgba(30, 58, 138, 0) 100%)`
              }}
            />
          </div>
        )}
        {isWarrior1Secret && (
          <div className="absolute inset-0 rounded-sm overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, rgba(88, 28, 135, 0.35) 0%, rgba(88, 28, 135, 0.15) 40%, rgba(88, 28, 135, 0.05) 70%, rgba(88, 28, 135, 0) 100%)`
              }}
            />
          </div>
        )}
        
        {/* Secret room markers - obelisk icons */}
        {isWarrior0Secret && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.5, 0.4]
            }}
            transition={{
              duration: 3.14, // π seconds to match barrier pulse (time * 2 in ParticleCloud)
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <HomeIcon size={32} warriorNumber={0} />
          </motion.div>
        )}
        {isWarrior1Secret && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.5, 0.4]
            }}
            transition={{
              duration: 3.14, // π seconds to match barrier pulse (time * 2 in ParticleCloud)
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <HomeIcon size={32} warriorNumber={1} />
          </motion.div>
        )}
        
        {/* Secret room particle clouds */}
        {isWarrior0Secret && <ParticleCloud color="blue" warriorNumber={0} />}
        {isWarrior1Secret && <ParticleCloud color="purple" warriorNumber={1} />}

        {/* Treasure hint marker (where dragon was first spotted - single player) */}
        {/* Only show BEFORE treasure is found */}
        <AnimatePresence mode="wait">
          {showTreasureHint && !hasDragon && gameState.treasure.warrior < 0 && (
            <motion.div
              key={`treasure-hint-${gameState.treasure.warrior}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.25 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="relative">
                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-full border-2 border-yellow-500 animate-ping opacity-75" />
                {/* Static marker */}
                <div className="w-8 h-8 rounded-full border-2 border-yellow-500 bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-lg">✨</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game pieces */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Treasure */}
          {hasTreasure && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-3xl relative"
            >
              {/* Pulsing ring behind treasure */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full border-2 border-yellow-400 animate-ping opacity-50" />
              </div>
              {/* Treasure icon */}
              <span className="relative z-10">🏆</span>
            </motion.div>
          )}

          {/* Dragon */}
          {hasDragon && (
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-4xl absolute z-30"
            >
              🐉
            </motion.div>
          )}

          {/* Warriors */}
          {hasWarrior0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`relative text-3xl z-20 ${hasWarrior1 ? '-translate-x-2' : ''}`}
            >
              🗡️
              {/* Treasure icon layered on top if carrying */}
              {gameState.treasure.warrior === 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 text-sm"
                >
                  🏆
                </motion.div>
              )}
            </motion.div>
          )}
          {hasWarrior1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`relative text-3xl z-20 ${hasWarrior0 ? 'translate-x-2' : ''}`}
            >
              ⚔️
              {/* Treasure icon layered on top if carrying */}
              {gameState.treasure.warrior === 1 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 text-sm"
                >
                  🏆
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Walls - Only show if discovered */}
      {/* North wall */}
      {paths[Direction.North] === PathType.Wall && row > 0 && isWallDiscovered(Direction.North) && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          className="absolute -top-0.5 left-0 right-0 h-1 bg-red-900 shadow-lg"
        />
      )}

      {/* East wall */}
      {paths[Direction.East] === PathType.Wall && col < 7 && isWallDiscovered(Direction.East) && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="absolute -right-0.5 top-0 bottom-0 w-1 bg-red-900 shadow-lg"
        />
      )}

      {/* South wall */}
      {paths[Direction.South] === PathType.Wall && row < 7 && isWallDiscovered(Direction.South) && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          className="absolute -bottom-0.5 left-0 right-0 h-1 bg-red-900 shadow-lg"
        />
      )}

      {/* West wall */}
      {paths[Direction.West] === PathType.Wall && col > 0 && isWallDiscovered(Direction.West) && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="absolute -left-0.5 top-0 bottom-0 w-1 bg-red-900 shadow-lg"
        />
      )}

      {/* Doors (level 2) - Locked doors are solid, unlocked doors have gap */}
      {/* Wall 30% | Door 40% (solid if locked, split if unlocked) | Wall 30% */}
      {gameState.level === 2 && (
        <>
          {/* South Door */}
          {paths[Direction.South] === PathType.Door && row < 7 && (
            <>
              {/* Left wall segment (30%) */}
              <div className="absolute -bottom-0.5 left-0 h-1 bg-red-900 shadow-lg" style={{ width: '30%' }} />
              {isDoorLocked(Direction.South) ? (
                /* Locked door: solid 40% bar */
                <div className="absolute -bottom-0.5 left-[30%] h-1 bg-amber-700 rounded shadow" style={{ width: '40%' }} />
              ) : (
                /* Unlocked door: two 8% bars with 24% gap */
                <>
                  <div className="absolute -bottom-0.5 left-[30%] h-1 bg-amber-700 rounded shadow" style={{ width: '8%' }} />
                  <div className="absolute -bottom-0.5 left-[62%] h-1 bg-amber-700 rounded shadow" style={{ width: '8%' }} />
                </>
              )}
              {/* Right wall segment (30%) */}
              <div className="absolute -bottom-0.5 right-0 h-1 bg-red-900 shadow-lg" style={{ width: '30%' }} />
            </>
          )}
          {/* East Door */}
          {paths[Direction.East] === PathType.Door && col < 7 && (
            <>
              {/* Top wall segment (30%) */}
              <div className="absolute -right-0.5 top-0 w-1 bg-red-900 shadow-lg" style={{ height: '30%' }} />
              {isDoorLocked(Direction.East) ? (
                /* Locked door: solid 40% bar */
                <div className="absolute -right-0.5 top-[30%] w-1 bg-amber-700 rounded shadow" style={{ height: '40%' }} />
              ) : (
                /* Unlocked door: two 8% bars with 24% gap */
                <>
                  <div className="absolute -right-0.5 top-[30%] w-1 bg-amber-700 rounded shadow" style={{ height: '8%' }} />
                  <div className="absolute -right-0.5 top-[62%] w-1 bg-amber-700 rounded shadow" style={{ height: '8%' }} />
                </>
              )}
              {/* Bottom wall segment (30%) */}
              <div className="absolute -right-0.5 bottom-0 w-1 bg-red-900 shadow-lg" style={{ height: '30%' }} />
            </>
          )}
          {/* North Door */}
          {paths[Direction.North] === PathType.Door && row > 0 && (
            <>
              {/* Left wall segment (30%) */}
              <div className="absolute -top-0.5 left-0 h-1 bg-red-900 shadow-lg" style={{ width: '30%' }} />
              {isDoorLocked(Direction.North) ? (
                /* Locked door: solid 40% bar */
                <div className="absolute -top-0.5 left-[30%] h-1 bg-amber-700 rounded shadow" style={{ width: '40%' }} />
              ) : (
                /* Unlocked door: two 8% bars with 24% gap */
                <>
                  <div className="absolute -top-0.5 left-[30%] h-1 bg-amber-700 rounded shadow" style={{ width: '8%' }} />
                  <div className="absolute -top-0.5 left-[62%] h-1 bg-amber-700 rounded shadow" style={{ width: '8%' }} />
                </>
              )}
              {/* Right wall segment (30%) */}
              <div className="absolute -top-0.5 right-0 h-1 bg-red-900 shadow-lg" style={{ width: '30%' }} />
            </>
          )}
          {/* West Door */}
          {paths[Direction.West] === PathType.Door && col > 0 && (
            <>
              {/* Top wall segment (30%) */}
              <div className="absolute -left-0.5 top-0 w-1 bg-red-900 shadow-lg" style={{ height: '30%' }} />
              {isDoorLocked(Direction.West) ? (
                /* Locked door: solid 40% bar */
                <div className="absolute -left-0.5 top-[30%] w-1 bg-amber-700 rounded shadow" style={{ height: '40%' }} />
              ) : (
                /* Unlocked door: two 8% bars with 24% gap */
                <>
                  <div className="absolute -left-0.5 top-[30%] w-1 bg-amber-700 rounded shadow" style={{ height: '8%' }} />
                  <div className="absolute -left-0.5 top-[62%] w-1 bg-amber-700 rounded shadow" style={{ height: '8%' }} />
                </>
              )}
              {/* Bottom wall segment (30%) */}
              <div className="absolute -left-0.5 bottom-0 w-1 bg-red-900 shadow-lg" style={{ height: '30%' }} />
            </>
          )}
        </>
      )}
    </div>
  );
};
