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
      {/* Chamber cell - Stone floor tile */}
      <motion.div
        className={`
          w-full h-full rounded-sm
          transition-all duration-200
          ${isDragonTurn ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        `}
        style={{
          background: `url('/textures/floor-tile.png')`,
          backgroundSize: 'cover',
          boxShadow: 'inset 2px 2px 4px rgba(80,80,80,0.3), inset -2px -2px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
        }}
        whileHover={isDragonTurn ? {} : { scale: 1.02, filter: 'brightness(1.15)' }}
        whileTap={isDragonTurn ? {} : { scale: 0.98 }}
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
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 16px rgba(255, 180, 0, 0.5))',
              }}
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
              style={{
                filter: 'drop-shadow(0 0 10px rgba(255, 100, 0, 0.7)) drop-shadow(0 0 20px rgba(255, 50, 0, 0.4))',
              }}
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
              style={{
                filter: 'drop-shadow(0 0 6px rgba(100, 150, 255, 0.7)) drop-shadow(0 0 12px rgba(50, 100, 255, 0.4))',
              }}
            >
              🗡️
              {/* Treasure icon layered on top if carrying */}
              {gameState.treasure.warrior === 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 text-sm"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
                  }}
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
              style={{
                filter: 'drop-shadow(0 0 6px rgba(200, 100, 255, 0.7)) drop-shadow(0 0 12px rgba(150, 50, 255, 0.4))',
              }}
            >
              ⚔️
              {/* Treasure icon layered on top if carrying */}
              {gameState.treasure.warrior === 1 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-1 -right-1 text-sm"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
                  }}
                >
                  🏆
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Walls - Brick texture */}
      {/* North wall */}
      {/* South wall - horizontal, tiles repeat-x */}
      {paths[Direction.South] === PathType.Wall && row < 7 && isWallDiscovered(Direction.South) && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          className="absolute -bottom-1 left-0 right-0 h-2 rounded-sm"
          style={{
            backgroundImage: 'url(/textures/brick-wall.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'repeat-x',
            boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* East wall - vertical */}
      {paths[Direction.East] === PathType.Wall && col < 7 && isWallDiscovered(Direction.East) && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="absolute -right-1 top-0 bottom-0 w-2 rounded-sm"
          style={{
            backgroundImage: 'url(/textures/brick-wall-v.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'repeat-y',
            boxShadow: '2px 0 4px rgba(0,0,0,0.6)',
          }}
        />
      )}

      {/* Doors (level 2) - Locked doors are solid, unlocked doors have gap */}
      {/* Only render South and East doors to avoid duplicates with adjacent chambers */}
      {gameState.level === 2 && (
        <>
          {/* South Door - horizontal */}
          {paths[Direction.South] === PathType.Door && row < 7 && (
            <>
              {/* Left wall segment (30%) */}
              <div
                className="absolute -bottom-1 left-0 h-2 rounded-sm"
                style={{
                  width: '30%',
                  backgroundImage: 'url(/textures/brick-wall.png)',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'repeat-x',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                }}
              />
              {isDoorLocked(Direction.South) ? (
                /* Locked door: solid 40% bar */
                <div
                  className="absolute -bottom-1 left-[30%] h-2 rounded-sm"
                  style={{
                    width: '40%',
                    background: 'linear-gradient(0deg, #b8860b 0%, #8B6914 50%, #6B4f0a 100%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,180,100,0.3)',
                  }}
                />
              ) : (
                /* Unlocked door: two 8% bars with 24% gap */
                <>
                  <div
                    className="absolute -bottom-1 left-[30%] h-2 rounded-sm"
                    style={{
                      width: '8%',
                      background: 'linear-gradient(0deg, #b8860b 0%, #8B6914 100%)',
                    }}
                  />
                  <div
                    className="absolute -bottom-1 left-[62%] h-2 rounded-sm"
                    style={{
                      width: '8%',
                      background: 'linear-gradient(0deg, #b8860b 0%, #8B6914 100%)',
                    }}
                  />
                </>
              )}
              {/* Right wall segment (30%) */}
              <div
                className="absolute -bottom-1 right-0 h-2 rounded-sm"
                style={{
                  width: '30%',
                  backgroundImage: 'url(/textures/brick-wall.png)',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'repeat-x',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
                }}
              />
            </>
          )}
          {/* East Door - vertical */}
          {paths[Direction.East] === PathType.Door && col < 7 && (
            <>
              {/* Top wall segment (30%) */}
              <div
                className="absolute -right-1 top-0 w-2 rounded-sm"
                style={{
                  height: '30%',
                  backgroundImage: 'url(/textures/brick-wall-v.png)',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'repeat-y',
                  boxShadow: '2px 0 4px rgba(0,0,0,0.6)',
                }}
              />
              {isDoorLocked(Direction.East) ? (
                /* Locked door: solid 40% bar */
                <div
                  className="absolute -right-1 top-[30%] w-2 rounded-sm"
                  style={{
                    height: '40%',
                    background: 'linear-gradient(270deg, #b8860b 0%, #8B6914 50%, #6B4f0a 100%)',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.5), inset -1px 0 0 rgba(200,180,100,0.3)',
                  }}
                />
              ) : (
                /* Unlocked door: two 8% bars with 24% gap */
                <>
                  <div
                    className="absolute -right-1 top-[30%] w-2 rounded-sm"
                    style={{
                      height: '8%',
                      background: 'linear-gradient(270deg, #b8860b 0%, #8B6914 100%)',
                    }}
                  />
                  <div
                    className="absolute -right-1 top-[62%] w-2 rounded-sm"
                    style={{
                      height: '8%',
                      background: 'linear-gradient(270deg, #b8860b 0%, #8B6914 100%)',
                    }}
                  />
                </>
              )}
              {/* Bottom wall segment (30%) */}
              <div
                className="absolute -right-1 bottom-0 w-2 rounded-sm"
                style={{
                  height: '30%',
                  backgroundImage: 'url(/textures/brick-wall-v.png)',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'repeat-y',
                  boxShadow: '2px 0 4px rgba(0,0,0,0.6)',
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
