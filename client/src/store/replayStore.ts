import { create } from 'zustand';
import { ReplayData, ChamberPath, ReplayFrame, GameState } from '@shared/types';
import { useGameStore } from './gameStore';
import { audioService } from '../services/AudioService';

interface ReplayStore {
  isReplaying: boolean;
  replayData: ReplayData | null;
  currentFrame: number;
  isPlaying: boolean;
  playbackSpeed: number; // 1, 2, or 4
  playbackTimer: ReturnType<typeof setInterval> | null;

  loadFromData: (data: ReplayData) => void;
  startPlayback: () => void;
  pausePlayback: () => void;
  togglePlayback: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  seekToFrame: (index: number) => void;
  restartPlayback: () => void;
  setSpeed: (speed: number) => void;
  exitReplay: () => void;
}

const BASE_FRAME_DELAY = 1000; // ms between frames at 1x speed

export const useReplayStore = create<ReplayStore>((set, get) => ({
  isReplaying: false,
  replayData: null,
  currentFrame: 0,
  isPlaying: false,
  playbackSpeed: 1,
  playbackTimer: null,

  loadFromData: (data: ReplayData) => {
    const { playbackTimer, playbackSpeed } = get();
    if (playbackTimer) clearInterval(playbackTimer);

    set({
      isReplaying: true,
      replayData: data,
      currentFrame: 0,
      isPlaying: false,
      playbackTimer: null,
    });

    const firstFrame = data.frames[0];
    pushFrameToGameStore(firstFrame, data.chamberPaths);
    playFrameSounds(null, firstFrame, playbackSpeed);
  },

  startPlayback: () => {
    const { playbackTimer, playbackSpeed, replayData, currentFrame } = get();
    if (playbackTimer) clearInterval(playbackTimer);
    if (!replayData) return;

    if (currentFrame >= replayData.frames.length - 1) return;

    const timer = setInterval(() => {
      const { currentFrame: cf, replayData: rd } = get();
      if (!rd || cf >= rd.frames.length - 1) {
        // Reached the end — stop the timer but let sounds finish naturally
        const { playbackTimer: pt } = get();
        if (pt) clearInterval(pt);
        set({ isPlaying: false, playbackTimer: null });
        return;
      }
      get().stepForward();
    }, BASE_FRAME_DELAY / playbackSpeed);

    set({ isPlaying: true, playbackTimer: timer });
  },

  pausePlayback: () => {
    const { playbackTimer } = get();
    if (playbackTimer) clearInterval(playbackTimer);
    audioService.stopAllHtml5Audio();
    set({ isPlaying: false, playbackTimer: null });
  },

  togglePlayback: () => {
    const { isPlaying, replayData, currentFrame } = get();
    if (isPlaying) {
      get().pausePlayback();
    } else {
      if (replayData && currentFrame >= replayData.frames.length - 1) {
        get().restartPlayback();
      } else {
        get().startPlayback();
      }
    }
  },

  stepForward: () => {
    const { replayData, currentFrame, playbackSpeed } = get();
    if (!replayData || currentFrame >= replayData.frames.length - 1) return;

    const nextFrame = currentFrame + 1;
    set({ currentFrame: nextFrame });
    const prevFrame = replayData.frames[currentFrame];
    const frame = replayData.frames[nextFrame];
    pushFrameToGameStore(frame, replayData.chamberPaths);
    playFrameSounds(prevFrame, frame, playbackSpeed);
  },

  stepBackward: () => {
    const { replayData, currentFrame, playbackSpeed } = get();
    if (!replayData || currentFrame <= 0) return;

    const prevIdx = currentFrame - 1;
    set({ currentFrame: prevIdx });
    const before = prevIdx > 0 ? replayData.frames[prevIdx - 1] : null;
    const frame = replayData.frames[prevIdx];
    pushFrameToGameStore(frame, replayData.chamberPaths);
    playFrameSounds(before, frame, playbackSpeed);
  },

  seekToFrame: (index: number) => {
    const { replayData } = get();
    if (!replayData) return;

    const clamped = Math.max(0, Math.min(index, replayData.frames.length - 1));
    set({ currentFrame: clamped });
    const frame = replayData.frames[clamped];
    pushFrameToGameStore(frame, replayData.chamberPaths);
    // No sounds — scrubbing should be silent
  },

  restartPlayback: () => {
    const { playbackTimer, replayData, playbackSpeed } = get();
    if (playbackTimer) clearInterval(playbackTimer);

    set({ currentFrame: 0, isPlaying: false, playbackTimer: null });

    if (replayData && replayData.frames.length > 0) {
      const firstFrame = replayData.frames[0];
      pushFrameToGameStore(firstFrame, replayData.chamberPaths);
      playFrameSounds(null, firstFrame, playbackSpeed);
    }

    get().startPlayback();
  },

  setSpeed: (speed: number) => {
    const { isPlaying } = get();
    set({ playbackSpeed: speed });

    if (isPlaying) {
      get().pausePlayback();
      get().startPlayback();
    }
  },

  exitReplay: () => {
    const { playbackTimer } = get();
    if (playbackTimer) clearInterval(playbackTimer);
    audioService.stopAllHtml5Audio();

    set({
      isReplaying: false,
      replayData: null,
      currentFrame: 0,
      isPlaying: false,
      playbackTimer: null,
    });
  },
}));

/**
 * Push a replay frame's state into the game store so Board renders it.
 */
function pushFrameToGameStore(frame: ReplayFrame, chamberPaths: ChamberPath[][]): void {
  useGameStore.setState({
    gameState: JSON.parse(JSON.stringify(frame.gameState)),
    chamberPaths,
    helpMessage: frame.helpMessage,
    isDragonTurn: false,
    isRecording: false,
  });
}

/**
 * Play sounds for a frame: both event-based sounds and state-transition sounds.
 * Compares previous frame's gameState to detect transitions that trigger sounds
 * outside the event system (e.g. waystone selection, turn announcements).
 */
function playFrameSounds(prevFrame: ReplayFrame | null, frame: ReplayFrame, playbackSpeed: number): void {
  // Play event-based sounds, deduplicated by type to avoid double sounds
  // (during live play, audioService.play() stops previous sounds naturally)
  const playedTypes = new Set<string>();
  for (const event of frame.events) {
    if (playedTypes.has(event.type)) continue;
    playedTypes.add(event.type);
    audioService.playForEventAtRate(event, playbackSpeed);
  }

  // Play state-transition sounds not captured by events
  const prevState = prevFrame?.gameState?.state;
  const curState = frame.gameState.state;

  if (prevState !== curState) {
    switch (curState) {
      case GameState.WarriorTwoSelectRoom:
        // Warrior 1 just placed their waystone — announce warrior 2
        audioService.playAtRate('warriorTwo', playbackSpeed);
        break;
      case GameState.WarriorOneTurn:
        // Both waystones placed (or solo game) — announce level + warrior 1
        if (prevState === GameState.WarriorTwoSelectRoom || prevState === GameState.WarriorOneSelectRoom) {
          audioService.playAtRate(frame.gameState.level === 1 ? 'levelOne' : 'levelTwo', playbackSpeed);
        }
        audioService.playAtRate('warriorOne', playbackSpeed);
        break;
      case GameState.WarriorTwoTurn:
        // Turn changed to warrior 2
        if (prevState === GameState.WarriorOneTurn) {
          audioService.playAtRate('warriorTwo', playbackSpeed);
        }
        break;
    }
  }
}
