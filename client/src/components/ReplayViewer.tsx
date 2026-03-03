import { useState, useRef, useCallback } from 'react';
import { useReplayStore } from '../store/replayStore';
import { useGameStore } from '../store/gameStore';

export function ReplayViewer() {
  const {
    isReplaying,
    replayData,
    currentFrame,
    isPlaying,
    playbackSpeed,
    togglePlayback,
    stepForward,
    stepBackward,
    seekToFrame,
    restartPlayback,
    setSpeed,
    exitReplay,
  } = useReplayStore();

  // Local slider state to avoid fighting with store updates while dragging
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const wasPlayingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const handleScrubStart = useCallback(() => {
    wasPlayingRef.current = useReplayStore.getState().isPlaying;
    if (wasPlayingRef.current) {
      useReplayStore.getState().pausePlayback();
    }
    setScrubbing(true);
    setScrubValue(useReplayStore.getState().currentFrame);
  }, []);

  const handleScrubChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrubValue(val);
    // Throttle heavy game state updates to one per animation frame
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      seekToFrame(val);
      rafRef.current = null;
    });
  }, [seekToFrame]);

  const handleScrubEnd = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setScrubbing(false);
    seekToFrame(scrubValue);
    if (wasPlayingRef.current) {
      useReplayStore.getState().startPlayback();
    }
  }, [scrubValue, seekToFrame]);

  if (!isReplaying || !replayData) return null;

  const totalFrames = replayData.frames.length;
  const displayFrame = scrubbing ? scrubValue : currentFrame;
  const atEnd = displayFrame >= totalFrames - 1;
  const atStart = displayFrame <= 0;

  const handleExit = () => {
    exitReplay();
    useGameStore.setState({ showPostGameOverlay: true });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(20,15,10,0.85) 0%, rgba(10,8,5,0.95) 100%)',
        borderTop: '1px solid #5a4a3a',
      }}
    >
      <div className="max-w-4xl mx-auto px-3 py-2 flex flex-col gap-1">
        {/* Timeline scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 tabular-nums w-16 text-right">
            {displayFrame + 1} / {totalFrames}
          </span>
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={displayFrame}
            onPointerDown={handleScrubStart}
            onChange={handleScrubChange}
            onPointerUp={handleScrubEnd}
            className="flex-1 h-1 accent-amber-600 cursor-pointer"
          />
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Restart */}
            <TransportBtn onClick={restartPlayback} title="Restart" disabled={atStart && !isPlaying}>
              |&lt;
            </TransportBtn>
            {/* Step back */}
            <TransportBtn onClick={stepBackward} title="Step back" disabled={atStart}>
              &lt;
            </TransportBtn>
            {/* Play/Pause */}
            <TransportBtn onClick={togglePlayback} title={isPlaying ? 'Pause' : 'Play'} primary>
              {isPlaying ? '||' : atEnd ? 'R' : '>'}
            </TransportBtn>
            {/* Step forward */}
            <TransportBtn onClick={stepForward} title="Step forward" disabled={atEnd}>
              &gt;
            </TransportBtn>
          </div>

          {/* Speed toggles */}
          <div className="flex items-center gap-1">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  playbackSpeed === s
                    ? 'bg-amber-900/60 text-amber-400 border border-amber-700'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Exit */}
          <button
            onClick={handleExit}
            className="px-3 py-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Exit Replay
          </button>
        </div>
      </div>
    </div>
  );
}

function TransportBtn({
  onClick,
  children,
  title,
  disabled,
  primary,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm font-mono transition-colors ${
        disabled
          ? 'text-gray-700 cursor-not-allowed'
          : primary
          ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 border border-amber-800'
          : 'text-gray-400 hover:text-white hover:bg-stone-800'
      }`}
    >
      {children}
    </button>
  );
}

