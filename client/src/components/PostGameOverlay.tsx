import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useReplayStore } from '../store/replayStore';
import { GameState } from '@shared/types';

interface PostGameOverlayProps {
  isVisible: boolean;
}

export function PostGameOverlay({ isVisible }: PostGameOverlayProps) {
  const { gameState, replayFrames, showScoreSubmission } = useGameStore();
  const { loadFromData, isReplaying } = useReplayStore();

  if (!isVisible || isReplaying) return null;

  const isWin = gameState?.state === GameState.GameOver && useGameStore.getState().gameWon;
  const outcome = isWin ? 'Victory' : 'Defeat';
  const hasReplay = replayFrames.length > 0;

  const handleWatchReplay = () => {
    const store = useGameStore.getState();
    if (store.replayFrames.length === 0) return;

    const data = {
      version: 1 as const,
      metadata: {
        id: 'current',
        date: Date.now(),
        mode: gameState!.mode,
        level: gameState!.level,
        dungeonSize: gameState!.dungeonSize,
        numberOfWarriors: gameState!.numberOfWarriors,
        outcome: (isWin ? 'win' : 'loss') as 'win' | 'loss',
        duration: store.gameEndTime && store.gameStartTime ? store.gameEndTime - store.gameStartTime : 0,
        totalMoves: store.totalMoves,
        totalDeaths: store.totalDeaths,
        totalFrames: store.replayFrames.length,
      },
      chamberPaths: store.chamberPaths,
      frames: store.replayFrames,
    };

    loadFromData(data);
  };

  const handleSubmitScore = () => {
    showScoreSubmission();
  };

  const handleSkip = () => {
    useGameStore.setState({ showPostGameOverlay: false });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="dungeon-panel max-w-md w-full"
      >
        <div className="dungeon-content p-6 text-center">
          {/* Outcome */}
          <h2
            className={`text-3xl font-medieval mb-2 ${isWin ? 'text-amber-400' : 'text-red-500'}`}
          >
            {outcome}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {isWin ? 'The treasure has been claimed!' : 'The dungeon claims another soul...'}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {hasReplay && (
              <button
                onClick={handleWatchReplay}
                className="w-full px-4 py-3 rounded font-medieval text-lg transition-colors"
                style={{
                  background: 'linear-gradient(180deg, #4a3728 0%, #3a2a1d 50%, #2a1e14 100%)',
                  border: '1px solid #8f6d3d',
                  color: '#c9a24d',
                }}
              >
                Watch Replay
              </button>
            )}

            <button
              onClick={handleSubmitScore}
              className="w-full px-4 py-3 rounded font-medieval text-lg transition-colors"
              style={{
                background: 'linear-gradient(180deg, #7a1f1f 0%, #5c1818 50%, #3d1010 100%)',
                border: '1px solid #8f2828',
                color: '#e8c4c4',
              }}
            >
              Submit Score
            </button>

            <button
              onClick={handleSkip}
              className="w-full px-3 py-2 rounded text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
