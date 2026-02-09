import {
  Position,
  Direction,
  GameStateData,
  GameState,
} from '@shared/types';

// --- Utility functions ---

function edgeKey(row: number, col: number, dir: Direction): string {
  return `${row}-${col}-${dir}`;
}

function tileKey(row: number, col: number): string {
  return `${row},${col}`;
}

function getAdjacentPosition(pos: Position, dir: Direction): Position | null {
  const [row, col] = pos;
  switch (dir) {
    case Direction.North: return row > 0 ? [row - 1, col] : null;
    case Direction.South: return row < 7 ? [row + 1, col] : null;
    case Direction.East: return col < 7 ? [row, col + 1] : null;
    case Direction.West: return col > 0 ? [row, col - 1] : null;
    default: return null;
  }
}

function oppositeDir(dir: Direction): Direction {
  switch (dir) {
    case Direction.North: return Direction.South;
    case Direction.South: return Direction.North;
    case Direction.East: return Direction.West;
    case Direction.West: return Direction.East;
  }
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

const ALL_DIRS: Direction[] = [
  Direction.North, Direction.East, Direction.South, Direction.West,
];

// --- AI Phase enum ---

enum AIPhase {
  Explore,
  SeekTreasure,
  SeekHint,
  ReturnToBase,
  EvadeDragon,
  HuntPlayer,
}

// --- Debug logging ---
const AI_DEBUG = true;
function aiLog(...args: unknown[]): void {
  if (AI_DEBUG) console.log('%c[AI]', 'color: #00bcd4; font-weight: bold', ...args);
}

// --- AI Controller ---

export class AIController {
  /** Edges the AI has successfully traversed (format: "row-col-dir") */
  private knownPassable = new Set<string>();
  /** Tiles the AI has visited (format: "row,col") */
  private visitedTiles = new Set<string>();
  /** Tiles confirmed as dead ends — entire corridors with no useful exits */
  private deadEndTiles = new Set<string>();
  /** Recent positions to detect oscillation (last ~12 moves) */
  private recentPositions: string[] = [];
  /** Abort controller for cancelling mid-turn */
  private abortController: AbortController | null = null;
  /** Whether AI is currently executing a turn */
  private _isExecuting = false;

  get isExecuting(): boolean {
    return this._isExecuting;
  }

  /** Reset AI state for a new game */
  reset(): void {
    this.knownPassable = new Set();
    this.visitedTiles = new Set();
    this.deadEndTiles = new Set();
    this.recentPositions = [];
    this.abort();
  }

  /** Track a position in recent history (keeps last 12) */
  private trackPosition(pos: Position): void {
    const key = tileKey(pos[0], pos[1]);
    this.recentPositions.push(key);
    if (this.recentPositions.length > 12) {
      this.recentPositions.shift();
    }
  }

  /** Check if AI is oscillating (same 2 tiles repeating) */
  private isOscillating(): boolean {
    const r = this.recentPositions;
    if (r.length < 4) return false;
    // Check A-B-A-B pattern in last 4 positions
    return r[r.length - 1] === r[r.length - 3]
      && r[r.length - 2] === r[r.length - 4]
      && r[r.length - 1] !== r[r.length - 2];
  }

  /**
   * Check if AI is stuck in a small area (dead-end corridor).
   * If the last 12 positions only cover ≤ 4 unique tiles, the AI is stuck
   * and should become "brave" — push through the dragon's zone.
   */
  private isStuck(): boolean {
    if (this.recentPositions.length < 8) return false;
    const unique = new Set(this.recentPositions);
    return unique.size <= 5;
  }

  /** Count how many times a tile appears in recent history */
  private recentVisitCount(pos: Position): number {
    const key = tileKey(pos[0], pos[1]);
    return this.recentPositions.filter(k => k === key).length;
  }

  /**
   * Frontier score: how many of a tile's neighbors are unvisited.
   * Higher = deeper into unexplored territory (better for exploration).
   */
  private frontierScore(pos: Position): number {
    let unvisitedNeighbors = 0;
    for (const dir of ALL_DIRS) {
      const adj = getAdjacentPosition(pos, dir);
      if (adj && !this.visitedTiles.has(tileKey(adj[0], adj[1]))) {
        unvisitedNeighbors++;
      }
    }
    return unvisitedNeighbors;
  }

  /**
   * Scan the entire 8x8 board and mark confirmed dead-end tiles.
   * A tile is a dead end if all its edges are resolved (no unknowns)
   * and it has at most 1 useful exit (passages to non-dead-end tiles).
   * Propagates through corridors: terminal → corridor → corridor...
   * Never marks the AI's Waystone (always needs to be reachable).
   */
  private updateDeadEnds(state: GameStateData): void {
    const waystoneKey = state.warriors[1].secretRoom
      ? tileKey(state.warriors[1].secretRoom[0], state.warriors[1].secretRoom[1])
      : null;

    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const key = tileKey(r, c);
          if (this.deadEndTiles.has(key)) continue;
          if (key === waystoneKey) continue;

          const pos: Position = [r, c];
          let usefulExits = 0;
          let unknowns = 0;

          for (const dir of ALL_DIRS) {
            const neighbor = getAdjacentPosition(pos, dir);
            if (!neighbor) continue; // Board edge = no exit

            if (this.isEdgeKnownBlocked(state, pos, dir)) continue;

            if (this.isEdgeUnknown(state, pos, dir)) {
              unknowns++;
              continue;
            }

            // Known passable — but does it lead anywhere useful?
            const nKey = tileKey(neighbor[0], neighbor[1]);
            if (this.deadEndTiles.has(nKey)) continue; // Leads to dead end
            usefulExits++;
          }

          // Dead end: all edges resolved AND at most 1 way out
          if (unknowns === 0 && usefulExits <= 1) {
            this.deadEndTiles.add(key);
            changed = true;
            aiLog(`Dead end marked: [${r},${c}] (${usefulExits} exit${usefulExits === 1 ? '' : 's'}, total mapped: ${this.deadEndTiles.size})`);
          }
        }
      }
    }
  }

  /** Abort the current AI turn execution */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this._isExecuting = false;
  }

  /**
   * Select a Waystone position for warrior 2.
   * Picks a tile far from center and far from warrior 1's Waystone, preferring corners.
   */
  selectRoom(gameState: GameStateData): Position {
    const w1Room = gameState.warriors[0].secretRoom;
    const candidates: { pos: Position; score: number }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (w1Room && w1Room[0] === r && w1Room[1] === c) continue;

        const pos: Position = [r, c];
        const centerDist = manhattanDistance(pos, [3, 3]);
        const w1Dist = w1Room ? manhattanDistance(pos, w1Room) : 0;
        const isCorner = (r === 0 || r === 7) && (c === 0 || c === 7);
        const isEdge = r === 0 || r === 7 || c === 0 || c === 7;

        let score = centerDist + w1Dist * 1.5;
        if (isCorner) score += 3;
        else if (isEdge) score += 1;

        candidates.push({ pos, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const topN = candidates.slice(0, 5);
    const chosen = topN[Math.floor(Math.random() * topN.length)].pos;
    aiLog('selectRoom: chose', chosen, 'from top5:', topN.map(c => `[${c.pos}] score=${c.score.toFixed(1)}`));
    return chosen;
  }

  /**
   * Execute the AI's full turn with animated delays between each move.
   * The AI calls the same moveWarrior/finishTurn functions as a human player.
   */
  async executeTurn(
    getState: () => GameStateData | null,
    moveWarrior: (warriorNumber: number, position: Position) => void,
    finishTurn: (warriorNumber: number) => void,
    isDragonTurnActive: () => boolean,
  ): Promise<void> {
    if (this._isExecuting) return;
    this._isExecuting = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      // Wait for dragon turn animation to finish
      while (!signal.aborted) {
        if (!isDragonTurnActive()) break;
        await this.delay(200, signal);
      }

      // Initial pause before AI starts moving
      aiLog('=== AI TURN START ===');

      // Update board memory: scan for dead-end corridors before making decisions
      const initialState = getState();
      if (initialState) this.updateDeadEnds(initialState);

      await this.delay(800, signal);

      while (!signal.aborted) {
        const state = getState();
        if (!state) break;
        if (state.state !== GameState.WarriorTwoTurn) break;

        const warrior = state.warriors[1];
        if (!warrior.position || warrior.lives <= 0) break;

        // In 2-player mode, moves are always tracked
        if (warrior.moves <= 0) break;

        // Block during dragon turn (door close sets this immediately)
        if (isDragonTurnActive()) {
          await this.delay(200, signal);
          continue;
        }

        // Mark current tile as visited and track for oscillation detection
        this.visitedTiles.add(tileKey(warrior.position[0], warrior.position[1]));
        this.trackPosition(warrior.position);

        aiLog(`--- Move step | pos=[${warrior.position}] | moves=${warrior.moves} | lives=${warrior.lives} | visited=${this.visitedTiles.size} | knownPassable=${this.knownPassable.size} | recent=[${this.recentPositions.join(' → ')}]`);

        // Determine phase and get next move
        const phase = this.determinePhase(state);
        let targetPos: Position | null;
        let usedAntiOscillation = false;

        // If oscillating, force a random unexplored move to break the loop
        if (this.isOscillating()) {
          aiLog('OSCILLATION DETECTED! Forcing anti-oscillation move');
          targetPos = this.getAntiOscillationMove(state);
          aiLog('Anti-oscillation target:', targetPos);
          usedAntiOscillation = true;
        } else {
          targetPos = this.getNextMove(state, phase);
        }

        // 15% random move chance (makes AI less robotic)
        // NEVER override: anti-oscillation moves, goal-directed phases, or early exploration
        // (ReturnToBase, SeekTreasure, HuntPlayer have BFS paths — random moves are harmful)
        // When dragon is asleep, every move is precious for mapping the maze — don't waste any
        const isGoalDirected = phase === AIPhase.ReturnToBase
          || phase === AIPhase.SeekTreasure
          || phase === AIPhase.SeekHint
          || phase === AIPhase.HuntPlayer;
        const isDragonAsleep = state.dragon.state === 0; // DragonState.Asleep
        if (targetPos && !usedAntiOscillation && !isGoalDirected && !isDragonAsleep && Math.random() < 0.15) {
          const randomMove = this.getRandomAdjacentMove(state);
          if (randomMove) {
            aiLog('Random 15% override:', targetPos, '->', randomMove);
            targetPos = randomMove;
          }
        }

        // Last-move dragon safety: if this is the last move and dragon is awake,
        // avoid ending the turn within Chebyshev distance 1 of the dragon
        // (dragon moves diagonally and would land on us → attack)
        if (targetPos && warrior.moves === 1 && state.dragon.position && state.dragon.visible) {
          const safeResult = this.lastMoveDragonSafety(
            state, warrior.position, targetPos
          );
          if (safeResult === 'skip') {
            aiLog('Last-move safety: skipping final move to stay safe. Finishing turn early.');
            finishTurn(1);
            break;
          } else if (safeResult) {
            targetPos = safeResult;
          }
        }

        if (!targetPos) {
          // No valid move found, finish turn early
          aiLog('No valid move found - finishing turn early');
          finishTurn(1);
          break;
        }

        aiLog(`Moving to [${targetPos}]`);

        // Record position before move
        const posBefore: Position = [warrior.position[0], warrior.position[1]];

        // Make the move (same call as human player)
        moveWarrior(1, targetPos);

        // Check result immediately — engine state updates are synchronous,
        // so by the time moveWarrior returns, all state changes are applied.
        // No delay needed (the old 50ms delay caused AI logs to appear
        // during dragon animation, making it look like the AI was still moving).
        const stateAfter = getState();
        if (!stateAfter) break;

        const posAfter = stateAfter.warriors[1].position;

        if (posAfter && (posAfter[0] !== posBefore[0] || posAfter[1] !== posBefore[1])) {
          // Move succeeded - record the edge as passable
          const dir = this.getDirection(posBefore, posAfter);
          if (dir !== null) {
            this.knownPassable.add(edgeKey(posBefore[0], posBefore[1], dir));
            this.knownPassable.add(edgeKey(posAfter[0], posAfter[1], oppositeDir(dir)));
          }
          this.visitedTiles.add(tileKey(posAfter[0], posAfter[1]));
          aiLog(`✓ Move succeeded: [${posBefore}] → [${posAfter}]`);
        } else {
          // wall hit or door closed - discoveredWalls/lockedDoors updated by engine
          aiLog(`✗ Move BLOCKED (wall/door): [${posBefore}] → tried [${targetPos}], still at [${posAfter}]`);
        }

        // Re-scan board for dead ends after each move (new walls may complete dead-end corridors)
        this.updateDeadEnds(stateAfter);

        // If turn ended (state changed or dragon animation started), stop immediately.
        // Don't run any more AI code during the dragon's animation phase.
        if (stateAfter.state !== GameState.WarriorTwoTurn) break;
        if (isDragonTurnActive()) break;

        // Delay between moves (animated, human can watch)
        await this.delay(500 + Math.random() * 300, signal);
      }
      aiLog('=== AI TURN END ===');
    } catch (e) {
      // AbortError is expected when game is reset mid-turn
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        console.error('AI turn error:', e);
      } else {
        aiLog('AI turn aborted (game reset)');
      }
    } finally {
      this._isExecuting = false;
      this.abortController = null;
    }
  }

  // --- Phase determination ---

  private determinePhase(state: GameStateData): AIPhase {
    const warrior = state.warriors[1];

    // If AI has the treasure, return to Waystone
    if (state.treasure.warrior === 1) {
      aiLog('Phase: RETURN_TO_BASE (AI has treasure, heading to Waystone', warrior.secretRoom, ')');
      return AIPhase.ReturnToBase;
    }

    // If Player 1 has the treasure, hunt them down to fight for it
    if (state.treasure.warrior === 0 && state.warriors[0].position && warrior.position) {
      const playerPos = state.warriors[0].position;
      const playerDist = manhattanDistance(warrior.position, playerPos);

      // Check how close the player is to winning (reaching their waystone with treasure)
      const playerWaystone = state.warriors[0].secretRoom;
      const playerToWin = playerWaystone ? manhattanDistance(playerPos, playerWaystone) : 99;
      const isUrgent = playerToWin <= 3; // Player is close to winning!

      // Always evade dragon if it's right on top of us — walking into dragon = death
      if (state.dragon.visible && state.dragon.position) {
        const dragonDist = manhattanDistance(warrior.position, state.dragon.position);
        if (dragonDist === 0) {
          aiLog(`Phase: EVADE_DRAGON (dragon ON us at`, state.dragon.position, `- must evade even while hunting)`);
          return AIPhase.EvadeDragon;
        }
      }

      if (isUrgent) {
        aiLog(`Phase: HUNT_PLAYER [URGENT] (Player ${playerToWin} steps from winning! At`, playerPos, `waystone at`, playerWaystone, `)`);
      } else {
        aiLog('Phase: HUNT_PLAYER (Player 1 has treasure at', playerPos, 'dist=', playerDist, 'playerToWin=', playerToWin, ')');
      }
      return AIPhase.HuntPlayer;
    }

    // If treasure is visible on ground (was dropped), go get it
    if (state.treasure.visible && state.treasure.warrior < 0 && state.treasure.room) {
      aiLog('Phase: SEEK_TREASURE (treasure visible at', state.treasure.room, ')');
      return AIPhase.SeekTreasure;
    }

    // If treasure hint exists and treasure hasn't been found yet,
    // searching the hint area is top priority — treasure is within 2 tiles of the hint
    if (state.dragon.treasureHintPosition && state.treasure.warrior < 0 && !state.treasure.visible) {
      if (state.dragon.visible && state.dragon.position && warrior.position) {
        const dragonDist = manhattanDistance(warrior.position, state.dragon.position);
        // Only evade if dragon is on our tile, or adjacent with 1 life left
        if (dragonDist === 0 || (dragonDist <= 1 && warrior.lives <= 1)) {
          aiLog(`Phase: EVADE_DRAGON (seeking hint but dragon too close: dist=${dragonDist}, lives=${warrior.lives})`);
          return AIPhase.EvadeDragon;
        }
      }
      const hintDist = warrior.position
        ? manhattanDistance(warrior.position, state.dragon.treasureHintPosition)
        : 99;
      aiLog('Phase: SEEK_HINT (treasure hint at', state.dragon.treasureHintPosition, 'dist=', hintDist, ')');
      return AIPhase.SeekHint;
    }

    // Evade dragon if dangerously close (and we don't have treasure)
    // When stuck in a dead-end, reduce evade threshold to dist ≤ 1 (only evade if adjacent)
    // so the AI can push through the dragon's zone to escape
    const stuck = this.isStuck();
    const evadeThreshold = stuck ? 1 : 2;
    if (state.dragon.visible && state.dragon.position && warrior.position) {
      const dragonDist = manhattanDistance(warrior.position, state.dragon.position);
      if (dragonDist <= evadeThreshold) {
        aiLog(`Phase: EVADE_DRAGON (dragon at`, state.dragon.position, `dist=`, dragonDist, stuck ? '| STUCK: reduced threshold)' : ')');
        return AIPhase.EvadeDragon;
      }
      const hintInfo = state.dragon.treasureHintPosition
        ? `treasureHint=[${state.dragon.treasureHintPosition}]` : 'no hint';
      aiLog('Phase: EXPLORE (dragon visible at', state.dragon.position, 'dist=', dragonDist, `- safe, ${hintInfo})`);
    } else {
      const hintInfo = state.dragon.treasureHintPosition
        ? `treasureHint=[${state.dragon.treasureHintPosition}]` : 'no hint';
      aiLog('Phase: EXPLORE (dragon not visible, treasure.visible=', state.treasure.visible, `,`, hintInfo, ')');
    }

    return AIPhase.Explore;
  }

  // --- Move selection per phase ---

  private getNextMove(state: GameStateData, phase: AIPhase): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;

    switch (phase) {
      case AIPhase.ReturnToBase:
        return this.returnToBase(state);

      case AIPhase.HuntPlayer:
        return this.huntPlayer(state);

      case AIPhase.SeekTreasure:
        return this.moveToward(state, warrior.position, state.treasure.room!);

      case AIPhase.SeekHint:
        return this.seekHint(state);

      case AIPhase.EvadeDragon:
        return this.evadeDragon(state);

      case AIPhase.Explore:
        return this.explore(state);

      default:
        return this.getRandomAdjacentMove(state);
    }
  }

  // --- Hint area search ---

  /**
   * Navigate to the treasure hint area and systematically search tiles
   * within 2 Manhattan distance of the hint. The treasure is guaranteed
   * to be in this area. Avoids walking onto the dragon's tile.
   */
  private seekHint(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;
    const hintPos = state.dragon.treasureHintPosition;
    if (!hintPos) return null;

    const hintDist = manhattanDistance(warrior.position, hintPos);

    let target: Position;
    if (hintDist > 2) {
      // Not in the hint area yet — head straight for it
      target = hintPos;
    } else {
      // In the hint area — find the next unvisited tile within 2 of the hint
      const hintTarget = this.findHintAreaTarget(state, warrior.position, hintPos);
      if (!hintTarget) {
        // All reachable hint-area tiles visited — fall back to general explore
        aiLog('seekHint: All hint-area tiles searched, falling back to explore');
        return this.explore(state);
      }
      target = hintTarget;
    }

    const move = this.moveToward(state, warrior.position, target);

    // Safety: never walk onto the dragon's exact tile
    if (move && state.dragon.position &&
        move[0] === state.dragon.position[0] && move[1] === state.dragon.position[1]) {
      aiLog(`seekHint: moveToward [${target}] would land on dragon at [${move}], finding alternative`);
      // Try adjacent moves that get closer to the target but avoid the dragon
      const alternatives: { pos: Position; dist: number }[] = [];
      for (const dir of ALL_DIRS) {
        const alt = getAdjacentPosition(warrior.position, dir);
        if (!alt) continue;
        if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;
        if (alt[0] === state.dragon.position[0] && alt[1] === state.dragon.position[1]) continue;
        alternatives.push({ pos: alt, dist: manhattanDistance(alt, target) });
      }
      if (alternatives.length > 0) {
        alternatives.sort((a, b) => a.dist - b.dist);
        aiLog(`seekHint: using alternative [${alternatives[0].pos}] (dist=${alternatives[0].dist} to target)`);
        return alternatives[0].pos;
      }
      // No safe move available — skip this move
      return null;
    }

    return move;
  }

  // --- Return to base (dragon-aware) ---

  /**
   * Return to Waystone while avoiding the dragon.
   * The dragon is actively chasing the treasure carrier, so this is critical.
   * Strategy: try the safest route first, fall back to riskier routes.
   */
  private returnToBase(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position || !warrior.secretRoom) return null;
    const dragonPos = state.dragon.position;

    if (dragonPos) {
      // 1. Safest: path that stays Chebyshev > 1 from dragon at every step
      const safePath = this.bfsSafePath(state, warrior.position, warrior.secretRoom, dragonPos, 1);
      if (safePath && safePath.length > 1) {
        aiLog(`returnToBase: Safe path found (${safePath.length - 1} steps, avoids dragon Chebyshev > 1)`);
        return safePath[1];
      }

      // 2. Riskier: path that only avoids dragon's exact tile
      const riskyPath = this.bfsSafePath(state, warrior.position, warrior.secretRoom, dragonPos, 0);
      if (riskyPath && riskyPath.length > 1) {
        aiLog(`returnToBase: Risky path found (${riskyPath.length - 1} steps, passes near dragon)`);
        return riskyPath[1];
      }

      // 3. Try BFS ignoring dragon safety — find ANY known route home
      //    But never step directly onto the dragon's tile (that's suicide)
      const anyPath = this.bfsKnownPath(state, warrior.position, warrior.secretRoom);
      if (anyPath && anyPath.length > 1) {
        const nextStep = anyPath[1];
        if (nextStep[0] !== dragonPos[0] || nextStep[1] !== dragonPos[1]) {
          aiLog(`returnToBase: Path through dragon zone (${anyPath.length - 1} steps, next step safe)`);
          return nextStep;
        }
        aiLog(`returnToBase: Path through dragon zone exists but next step [${nextStep}] IS the dragon — skipping`);
      }

      // 4. No known path at all — probe toward Waystone, but only if it makes progress
      aiLog('returnToBase: No known path, probing toward Waystone');
      const currentDist = manhattanDistance(warrior.position, warrior.secretRoom);
      const probe = this.probeToward(state, warrior.position, warrior.secretRoom);
      if (probe && !(probe[0] === dragonPos[0] && probe[1] === dragonPos[1])) {
        const probeDist = manhattanDistance(probe, warrior.secretRoom);
        if (probeDist < currentDist) {
          return probe;
        }
        aiLog(`returnToBase: Probe doesn't get closer (dist ${currentDist} → ${probeDist}), exploring toward Waystone`);
      }

      // 5. Explore to discover new passages toward Waystone
      const exploreMove = this.exploreToward(state, warrior.secretRoom);
      if (exploreMove) return exploreMove;

      // 6. Last resort — evade to create space
      aiLog('returnToBase: All routes blocked, evading first');
      return this.evadeDragon(state);
    }

    // Dragon position unknown — try direct path, then explore toward Waystone
    const direct = this.moveToward(state, warrior.position, warrior.secretRoom);
    if (direct) return direct;

    aiLog('returnToBase: No known path to Waystone, exploring toward it');
    return this.exploreToward(state, warrior.secretRoom);
  }

  // --- Hunt player (dragon-aware) ---

  /**
   * Chase Player 1 who has the treasure, while avoiding the dragon.
   * The dragon is chasing Player 1 too, so it may be near the target.
   */
  private huntPlayer(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    const playerPos = state.warriors[0].position;
    if (!warrior.position || !playerPos) return null;
    const dragonPos = state.dragon.position;
    const currentDist = manhattanDistance(warrior.position, playerPos);

    if (dragonPos) {
      // 1. Try safe path avoiding Chebyshev ≤ 1 from dragon
      const safePath = this.bfsSafePath(state, warrior.position, playerPos, dragonPos, 1);
      if (safePath && safePath.length > 1) {
        aiLog(`huntPlayer: Safe path found (${safePath.length - 1} steps)`);
        return safePath[1];
      }

      // 2. Try path avoiding only dragon's exact tile
      const riskyPath = this.bfsSafePath(state, warrior.position, playerPos, dragonPos, 0);
      if (riskyPath && riskyPath.length > 1) {
        aiLog(`huntPlayer: Risky path found (passes near dragon)`);
        return riskyPath[1];
      }

      // 3. Try BFS ignoring dragon safety — find ANY known route to the player
      //    But never step directly onto the dragon's tile (that's suicide)
      const anyPath = this.bfsKnownPath(state, warrior.position, playerPos);
      if (anyPath && anyPath.length > 1) {
        const nextStep = anyPath[1];
        if (nextStep[0] !== dragonPos[0] || nextStep[1] !== dragonPos[1]) {
          aiLog(`huntPlayer: Path through dragon zone (${anyPath.length - 1} steps, next step safe)`);
          return nextStep;
        }
        aiLog(`huntPlayer: Path through dragon zone exists but next step [${nextStep}] IS the dragon — skipping`);
      }

      // 4. No known path exists at all — probe toward player (never onto dragon)
      const probe = this.probeToward(state, warrior.position, playerPos);
      if (probe) {
        const probeDist = manhattanDistance(probe, playerPos);
        const probeOnDragon = probe[0] === dragonPos[0] && probe[1] === dragonPos[1];

        if (!probeOnDragon && probeDist < currentDist) {
          aiLog(`huntPlayer: Probe makes progress toward player (dist ${currentDist} → ${probeDist})`);
          return probe;
        }

        if (!probeOnDragon) {
          aiLog(`huntPlayer: Probe [${probe}] doesn't get closer (dist ${currentDist} → ${probeDist}), exploring to find new routes`);
        } else {
          aiLog('huntPlayer: Probe lands on dragon, exploring to find new routes');
        }
      } else {
        aiLog('huntPlayer: No probe available, exploring to find new routes');
      }

      // 5. Fall back to exploration — discover new passages toward the player
      return this.exploreToward(state, playerPos);
    }

    // Dragon position unknown — try direct path, then explore toward player
    const direct = this.moveToward(state, warrior.position, playerPos);
    if (direct) return direct;

    aiLog('huntPlayer: No known path to player, exploring toward them');
    return this.exploreToward(state, playerPos);
  }

  // --- Dragon-aware BFS ---

  /**
   * BFS on known-passable edges, but skip tiles within `avoidRadius`
   * (Chebyshev distance) of `avoidPos`. This finds routes around the dragon.
   * avoidRadius 0 = only skip the dragon's exact tile
   * avoidRadius 1 = skip tiles the dragon can reach in one diagonal move
   */
  private bfsSafePath(
    state: GameStateData, from: Position, target: Position,
    avoidPos: Position, avoidRadius: number,
  ): Position[] | null {
    const queue: Position[][] = [[from]];
    const visited = new Set<string>();
    visited.add(tileKey(from[0], from[1]));

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current[0] === target[0] && current[1] === target[1]) {
        return path;
      }

      for (const dir of ALL_DIRS) {
        const neighbor = getAdjacentPosition(current, dir);
        if (!neighbor) continue;

        const nKey = tileKey(neighbor[0], neighbor[1]);
        if (visited.has(nKey)) continue;

        if (!this.isEdgeKnownPassable(state, current, dir)) continue;

        // Skip tiles too close to the danger position (but always allow the target itself)
        if (this.chebyshevDistance(neighbor, avoidPos) <= avoidRadius &&
            !(neighbor[0] === target[0] && neighbor[1] === target[1])) {
          continue;
        }

        visited.add(nKey);
        queue.push([...path, neighbor]);
      }
    }

    return null;
  }

  // --- Targeted exploration (when no known path exists) ---

  /**
   * Explore toward a target when no known BFS path exists.
   * Unlike general explore(), this specifically seeks unknown edges
   * in the direction of the target to discover new routes.
   * Falls back to general explore if nothing target-directed is available.
   */
  private exploreToward(state: GameStateData, target: Position): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;
    const currentDist = manhattanDistance(warrior.position, target);

    // 1. Check for unknown edges from current tile that point toward the target
    const unknownToward: { pos: Position; dist: number; deadEnd: number }[] = [];
    const unknownAway: { pos: Position; dist: number; deadEnd: number }[] = [];
    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(warrior.position, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;
      if (!this.isEdgeUnknown(state, warrior.position, dir)) continue;

      const dist = manhattanDistance(neighbor, target);
      const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
      if (dist < currentDist) {
        unknownToward.push({ pos: neighbor, dist, deadEnd });
      } else {
        unknownAway.push({ pos: neighbor, dist, deadEnd });
      }
    }

    // Prefer unknown edges that get closer, sorted by distance then avoid dead-ends
    if (unknownToward.length > 0) {
      unknownToward.sort((a, b) => a.deadEnd !== b.deadEnd ? a.deadEnd - b.deadEnd : a.dist - b.dist);
      aiLog(`exploreToward [${target}]: Found unknown edge toward target: [${unknownToward[0].pos}] (dist ${currentDist} → ${unknownToward[0].dist})`);
      return unknownToward[0].pos;
    }

    // 2. BFS through known passages to find the nearest tile with unknown edges toward the target
    const queue: Position[] = [warrior.position];
    const visited = new Set<string>();
    visited.add(tileKey(warrior.position[0], warrior.position[1]));
    let bestTile: Position | null = null;
    let bestScore = -Infinity;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const tileDist = manhattanDistance(current, target);
      const stepsFromStart = manhattanDistance(warrior.position, current);

      for (const dir of ALL_DIRS) {
        const neighbor = getAdjacentPosition(current, dir);
        if (!neighbor) continue;

        if (this.isEdgeUnknown(state, current, dir) && !this.isEdgeKnownBlocked(state, current, dir)) {
          const neighborDist = manhattanDistance(neighbor, target);
          // Only count unknown edges that point toward the target
          if (neighborDist < tileDist) {
            const score = -stepsFromStart + (currentDist - neighborDist) * 3;
            if (score > bestScore) {
              bestScore = score;
              bestTile = current;
            }
          }
        }

        const nKey = tileKey(neighbor[0], neighbor[1]);
        if (!visited.has(nKey) && this.isEdgeKnownPassable(state, current, dir)) {
          visited.add(nKey);
          queue.push(neighbor);
        }
      }
    }

    if (bestTile && (bestTile[0] !== warrior.position[0] || bestTile[1] !== warrior.position[1])) {
      const move = this.moveToward(state, warrior.position, bestTile);
      if (move) {
        aiLog(`exploreToward [${target}]: Heading to tile [${bestTile}] which has unknown edges toward target`);
        return move;
      }
    }

    // 3. No target-directed unknown edges at all — try any unknown edge
    if (unknownAway.length > 0) {
      unknownAway.sort((a, b) => a.deadEnd !== b.deadEnd ? a.deadEnd - b.deadEnd : a.dist - b.dist);
      aiLog(`exploreToward [${target}]: No edges toward target, trying lateral unknown [${unknownAway[0].pos}]`);
      return unknownAway[0].pos;
    }

    // 4. Fall back to general exploration
    aiLog(`exploreToward [${target}]: No unknown edges found, falling back to general explore`);
    return this.explore(state);
  }

  // --- Pathfinding ---

  /**
   * Move toward a target: first try BFS on known passages,
   * then fall back to probing unknown edges toward the target.
   */
  private moveToward(
    state: GameStateData, from: Position, target: Position,
  ): Position | null {
    const bfsPath = this.bfsKnownPath(state, from, target);
    if (bfsPath && bfsPath.length > 1) {
      aiLog(`moveToward [${target}]: BFS path found (${bfsPath.length} steps): ${bfsPath.map(p => `[${p}]`).join('→')}`);
      return bfsPath[1]; // Next step on shortest known path
    }
    aiLog(`moveToward [${target}]: No BFS path, probing...`);
    return this.probeToward(state, from, target);
  }

  /**
   * BFS on known-passable edges to find shortest path from `from` to `target`.
   * Returns the full path (array of positions) or null if no known path exists.
   */
  private bfsKnownPath(
    state: GameStateData, from: Position, target: Position,
  ): Position[] | null {
    const queue: Position[][] = [[from]];
    const visited = new Set<string>();
    visited.add(tileKey(from[0], from[1]));

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current[0] === target[0] && current[1] === target[1]) {
        return path;
      }

      for (const dir of ALL_DIRS) {
        const neighbor = getAdjacentPosition(current, dir);
        if (!neighbor) continue;

        const nKey = tileKey(neighbor[0], neighbor[1]);
        if (visited.has(nKey)) continue;

        if (this.isEdgeKnownPassable(state, current, dir)) {
          visited.add(nKey);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null;
  }

  /**
   * An edge is known passable if the AI successfully traversed it
   * AND it's not currently a locked door (level 2).
   */
  private isEdgeKnownPassable(
    state: GameStateData, pos: Position, dir: Direction,
  ): boolean {
    const key = edgeKey(pos[0], pos[1], dir);
    if (!this.knownPassable.has(key)) return false;

    // In level 2, a previously passable door may now be locked
    if (state.level === 2) {
      const doorKey = `${pos[0]}-${pos[1]}-${dir}`;
      if (state.lockedDoors[doorKey] === true) return false;
    }

    return true;
  }

  /**
   * Check if moving from pos in direction dir goes through a locked door.
   * Locked doors have a 50% chance of failure (staying in place, wasting a move).
   * The lockedDoors map is pre-populated for all doors at game start:
   * true = locked, false = unlocked, undefined = not a door.
   */
  private isLockedDoor(state: GameStateData, pos: Position, dir: Direction): boolean {
    if (state.level !== 2) return false;
    const key = `${pos[0]}-${pos[1]}-${dir}`;
    return state.lockedDoors[key] === true;
  }

  /** An edge is known blocked if it's a discovered wall. */
  private isEdgeKnownBlocked(
    state: GameStateData, pos: Position, dir: Direction,
  ): boolean {
    const key = `${pos[0]}-${pos[1]}-${dir}`;
    // Discovered walls are permanent blocks
    if (state.discoveredWalls[key]) return true;
    // Locked doors are NOT treated as permanent blocks - AI can retry (50% success)
    return false;
  }

  /** Edge is unknown if neither known passable nor known blocked. */
  private isEdgeUnknown(
    state: GameStateData, pos: Position, dir: Direction,
  ): boolean {
    return !this.isEdgeKnownPassable(state, pos, dir)
      && !this.isEdgeKnownBlocked(state, pos, dir);
  }

  /**
   * Check how deep a known dead-end corridor is when entering a tile from a given direction.
   * First checks the persistent deadEndTiles set (updated by updateDeadEnds each move).
   * Falls back to on-the-fly corridor traversal for tiles with unknown edges.
   * Returns 0 if not a dead-end, or the corridor depth (1 = terminal, 2+ = corridor).
   */
  private getDeadEndDepth(pos: Position, entryDir: Direction, state: GameStateData): number {
    // Quick check: persistent dead-end memory (handles corridor propagation)
    if (this.deadEndTiles.has(tileKey(pos[0], pos[1]))) return 99;
    let depth = 0;
    let current = pos;
    let cameFrom = entryDir;
    let confirmedDeadEnd = false;
    const checked = new Set<string>();

    while (true) {
      const key = tileKey(current[0], current[1]);
      if (checked.has(key)) break;
      checked.add(key);

      const exits: { pos: Position; dir: Direction }[] = [];
      let hasUnknownEdge = false;

      for (const dir of ALL_DIRS) {
        if (dir === cameFrom) continue;
        const neighbor = getAdjacentPosition(current, dir);
        if (!neighbor) continue; // Board edge = blocked

        if (this.isEdgeKnownBlocked(state, current, dir)) continue;

        if (this.isEdgeUnknown(state, current, dir)) {
          hasUnknownEdge = true;
        }

        exits.push({ pos: neighbor, dir });
      }

      // Unknown edges mean we can't confirm this is a dead-end —
      // there could be an exit we haven't discovered yet
      if (hasUnknownEdge) break;

      if (exits.length === 0) {
        // Terminal dead-end: all non-entry edges are confirmed blocked
        depth++;
        confirmedDeadEnd = true;
        break;
      } else if (exits.length === 1) {
        // Corridor: exactly one way forward, keep following
        depth++;
        current = exits[0].pos;
        cameFrom = oppositeDir(exits[0].dir);
      } else {
        // Junction: multiple exits, not a dead-end
        break;
      }
    }

    // Only report dead-end depth if the corridor actually terminates at a
    // confirmed dead-end. If we stopped due to unknown edges or a junction,
    // the corridor might lead somewhere — return 0.
    return confirmedDeadEnd ? depth : 0;
  }

  /**
   * Probe toward a target through unknown or door edges.
   * Picks the adjacent tile that gets closest to the target,
   * but penalizes recently visited tiles to avoid oscillation.
   */
  private probeToward(
    state: GameStateData, from: Position, target: Position,
  ): Position | null {
    const candidates: { pos: Position; dist: number; unknown: boolean; recentPenalty: number; deadEnd: number }[] = [];

    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(from, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, from, dir)) continue;

      const dist = manhattanDistance(neighbor, target);
      const unknown = this.isEdgeUnknown(state, from, dir);
      const recentPenalty = this.recentVisitCount(neighbor);
      const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
      candidates.push({ pos: neighbor, dist, unknown, recentPenalty, deadEnd });
    }

    if (candidates.length === 0) {
      aiLog('probeToward: no candidates (all edges blocked)');
      return null;
    }

    // Prefer: avoid dead-ends > less recently visited > closer to target > unknown edges
    candidates.sort((a, b) => {
      // Strongly avoid known dead-ends
      if (a.deadEnd !== b.deadEnd) return a.deadEnd - b.deadEnd;
      // Strongly penalize recently visited tiles
      if (a.recentPenalty !== b.recentPenalty) return a.recentPenalty - b.recentPenalty;
      if (a.dist !== b.dist) return a.dist - b.dist;
      if (a.unknown !== b.unknown) return a.unknown ? -1 : 1;
      return 0;
    });

    aiLog(`probeToward [${target}]: candidates:`, candidates.map(c =>
      `[${c.pos}] dist=${c.dist} recent=${c.recentPenalty} deadEnd=${c.deadEnd} ${c.unknown ? 'UNKNOWN' : 'known'}`
    ).join(' | '), '→ chose', `[${candidates[0].pos}]`);

    return candidates[0].pos;
  }

  // --- Exploration ---

  /**
   * Check if a move would put the AI in the dragon's evade zone.
   * Uses reduced threshold (dist ≤ 1) when stuck in a dead-end,
   * so the AI can push through to escape.
   */
  private wouldTriggerEvade(pos: Position, state: GameStateData): boolean {
    if (!state.dragon.visible || !state.dragon.position) return false;
    const threshold = this.isStuck() ? 1 : 2;
    return manhattanDistance(pos, state.dragon.position) <= threshold;
  }

  /**
   * Explore the maze to discover passages and find the treasure.
   * If the dragon is visible, biases toward the dragon area (treasure is nearby).
   */
  private explore(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;

    // Treasure hint position: where dragon was first spotted (treasure within 2 tiles)
    // This is the AI's best clue for where the treasure is hidden
    const hintPos = state.dragon.treasureHintPosition;

    // If treasure hint exists, head toward it (strongest signal for treasure location)
    if (hintPos) {
      const hintDist = manhattanDistance(warrior.position, hintPos);
      if (hintDist > 2) {
        aiLog(`explore: Treasure hint at [${hintPos}] (dist=${hintDist}), heading toward hint area`);
        const move = this.moveToward(state, warrior.position, hintPos);
        // Prevent explore/evade oscillation: don't move into the evade zone
        // unless we're already in it (need to commit one direction)
        if (move && !this.wouldTriggerEvade(move, state)) {
          return move;
        }
        if (move) {
          aiLog(`explore: moveToward hint would enter evade zone at [${move}], looking for safe hint-directed move`);
          // Try to find a safe move that still gets us closer to the hint
          const safeHintMove = this.getSafeHintDirectedMove(state, hintPos);
          if (safeHintMove) return safeHintMove;
          aiLog('explore: No safe hint-directed move, falling through');
        } else {
          aiLog('explore: Could not find path toward treasure hint, falling through');
        }
      } else {
        aiLog(`explore: Already near treasure hint [${hintPos}] (dist=${hintDist}), searching hint area systematically`);
        // Actively search unvisited tiles within the hint radius
        const hintAreaTarget = this.findHintAreaTarget(state, warrior.position, hintPos);
        if (hintAreaTarget) {
          const move = this.moveToward(state, warrior.position, hintAreaTarget);
          if (move) {
            // Hint area search is high priority — even enter evade zone to find treasure
            aiLog(`explore: hint-area search targeting [${hintAreaTarget}], moving to [${move}]`);
            return move;
          }
        }
        aiLog('explore: All reachable hint-area tiles visited, falling through to general explore');
      }
    }
    // Fallback: if no hint but dragon visible and far, head toward dragon
    else if (state.dragon.visible && state.dragon.position) {
      const dragonDist = manhattanDistance(warrior.position, state.dragon.position);
      if (dragonDist > 4) {
        aiLog(`explore: No hint, dragon visible & far (dist=${dragonDist}), heading toward dragon at [${state.dragon.position}]`);
        const move = this.moveToward(state, warrior.position, state.dragon.position);
        if (move) return move;
        aiLog('explore: Could not find path toward dragon, falling through to exploration');
      }
    }

    // Priority: if current tile has unknown edges, probe one directly
    // (don't walk to another tile just to probe from there)
    const unknownNeighbors: { pos: Position; visited: boolean; hintBonus: number; entersEvade: boolean; deadEnd: number; frontier: number }[] = [];
    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(warrior.position, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;
      if (this.isEdgeUnknown(state, warrior.position, dir)) {
        const visited = this.visitedTiles.has(tileKey(neighbor[0], neighbor[1]));
        const entersEvade = this.wouldTriggerEvade(neighbor, state);
        const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
        const frontier = this.frontierScore(neighbor);
        // Bonus for tiles closer to the treasure hint area
        let hintBonus = 0;
        if (hintPos) {
          const hDist = manhattanDistance(neighbor, hintPos);
          if (hDist <= 4) hintBonus = (5 - hDist) * 2;
        } else if (state.dragon.visible && state.dragon.position) {
          const dDist = manhattanDistance(neighbor, state.dragon.position);
          if (dDist <= 4) hintBonus = 5 - dDist;
        }
        unknownNeighbors.push({ pos: neighbor, visited, hintBonus, entersEvade, deadEnd, frontier });
      }
    }

    if (unknownNeighbors.length > 0) {
      // Prefer: avoid dead-ends > safe over evade-zone > unvisited > frontier (deeper into unexplored) > hint > random
      unknownNeighbors.sort((a, b) => {
        if (a.deadEnd !== b.deadEnd) return a.deadEnd - b.deadEnd;
        if (a.entersEvade !== b.entersEvade) return a.entersEvade ? 1 : -1;
        if (a.visited !== b.visited) return a.visited ? 1 : -1;
        // Prefer tiles deeper into unexplored territory (more unvisited neighbors)
        if (a.frontier !== b.frontier) return b.frontier - a.frontier;
        if (a.hintBonus !== b.hintBonus) return b.hintBonus - a.hintBonus;
        return Math.random() - 0.5;
      });
      aiLog(`explore: Current tile has ${unknownNeighbors.length} unknown edges, probing directly:`,
        unknownNeighbors.map(n => `[${n.pos}] visited=${n.visited} frontier=${n.frontier} hintBonus=${n.hintBonus} evade=${n.entersEvade} deadEnd=${n.deadEnd}`).join(' | '),
        '→ chose', `[${unknownNeighbors[0].pos}]`);
      return unknownNeighbors[0].pos;
    }

    aiLog('explore: All edges from current tile are known, searching via BFS...');

    // All edges from current tile are known - BFS to find nearest tile with unknown edges
    const target = this.findExplorationTarget(state, warrior.position);
    if (target) {
      aiLog(`explore: Best exploration target = [${target}]`);
      const move = this.moveToward(state, warrior.position, target);
      // Prevent phase oscillation: don't move into evade zone during explore
      if (move && !this.wouldTriggerEvade(move, state)) {
        return move;
      }
      if (move) {
        aiLog(`explore: BFS target move [${move}] would enter evade zone, trying safe alternatives`);
        // Try any safe adjacent move instead
        const safeMove = this.getSafeExploreMove(state);
        if (safeMove) return safeMove;
        aiLog('explore: No safe alternatives, accepting evade-zone move');
        return move;
      }
    }

    // Fallback: prefer least-visited adjacent tile
    aiLog('explore: No exploration target found, using anti-oscillation fallback');
    return this.getAntiOscillationMove(state);
  }

  /**
   * BFS through known passages to find the best tile to explore next.
   * Scores tiles by number of unknown adjacent edges, unvisited status,
   * and proximity to treasure hint / dragon area.
   */
  private findExplorationTarget(
    state: GameStateData, from: Position,
  ): Position | null {
    const queue: Position[] = [from];
    const visited = new Set<string>();
    visited.add(tileKey(from[0], from[1]));

    let bestTarget: Position | null = null;
    let bestScore = -Infinity;

    // Use treasure hint as primary target area, fall back to live dragon position
    const hintPos = state.dragon.treasureHintPosition;

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Count unknown edges from this tile
      let unknownEdges = 0;
      for (const dir of ALL_DIRS) {
        const neighbor = getAdjacentPosition(current, dir);
        if (!neighbor) continue;
        if (this.isEdgeUnknown(state, current, dir)) unknownEdges++;
      }

      const isVisited = this.visitedTiles.has(tileKey(current[0], current[1]));
      const distFromStart = manhattanDistance(from, current);

      // Bonus for tiles near the treasure hint (treasure within 2 tiles of hint)
      // If no hint, fall back to live dragon position
      let hintBonus = 0;
      if (hintPos) {
        const hintDist = manhattanDistance(current, hintPos);
        // Massive bonus for tiles within treasure range (dist ≤ 2), strong for nearby
        if (hintDist <= 2) hintBonus = (3 - hintDist) * 10 + 10;  // 10-30 bonus
        else if (hintDist <= 4) hintBonus = (5 - hintDist) * 3;   // 3-6 bonus
      } else if (state.dragon.visible && state.dragon.position) {
        const dragonDist = manhattanDistance(current, state.dragon.position);
        if (dragonDist <= 4) hintBonus = (5 - dragonDist) * 2;
      }

      // Penalize recently visited tiles to encourage exploring new areas
      const recentPenalty = this.recentVisitCount(current) * 4;

      // Frontier bonus: tiles on the edge of explored territory have more
      // unvisited neighbors — these lead deeper into unexplored areas
      const frontier = this.frontierScore(current);

      let score = unknownEdges * 3 + hintBonus + frontier * 2;
      if (!isVisited) score += 5;
      score -= distFromStart * 0.5; // Slight penalty for distance
      score -= recentPenalty; // Avoid re-exploring recent tiles

      // Only consider tiles with unknown edges (something to discover) that aren't current pos
      if (unknownEdges > 0 && (current[0] !== from[0] || current[1] !== from[1])) {
        if (score > bestScore) {
          bestScore = score;
          bestTarget = current;
        }
      }

      // Expand BFS through known passable edges
      for (const dir of ALL_DIRS) {
        const neighbor = getAdjacentPosition(current, dir);
        if (!neighbor) continue;
        const nKey = tileKey(neighbor[0], neighbor[1]);
        if (visited.has(nKey)) continue;
        if (this.isEdgeKnownPassable(state, current, dir)) {
          visited.add(nKey);
          queue.push(neighbor);
        }
      }
    }

    if (bestTarget) {
      aiLog(`findExplorationTarget: best=[${bestTarget}] score=${bestScore.toFixed(1)} (BFS searched ${visited.size} tiles)`);
      return bestTarget;
    }

    aiLog(`findExplorationTarget: No target via BFS (searched ${visited.size} tiles). Trying unknown adjacent edges...`);

    // Fallback: try any adjacent tile through unknown edge
    const shuffled = [...ALL_DIRS].sort(() => Math.random() - 0.5);
    for (const dir of shuffled) {
      const neighbor = getAdjacentPosition(from, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, from, dir)) continue;
      if (!this.visitedTiles.has(tileKey(neighbor[0], neighbor[1]))) {
        aiLog(`findExplorationTarget: fallback to unvisited neighbor [${neighbor}] via ${dir}`);
        return neighbor;
      }
    }

    aiLog('findExplorationTarget: NOTHING found - all adjacent edges blocked or visited');

    // Log edge status for all adjacent directions to diagnose
    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(from, dir);
      if (!neighbor) { aiLog(`  ${dir}: out of bounds`); continue; }
      const blocked = this.isEdgeKnownBlocked(state, from, dir);
      const passable = this.isEdgeKnownPassable(state, from, dir);
      const unknown = this.isEdgeUnknown(state, from, dir);
      const visited2 = this.visitedTiles.has(tileKey(neighbor[0], neighbor[1]));
      aiLog(`  ${dir} → [${neighbor}]: blocked=${blocked} passable=${passable} unknown=${unknown} visited=${visited2}`);
    }

    return null;
  }

  // --- Dragon safety ---

  /**
   * Chebyshev distance: max of row and col distance.
   * The dragon moves diagonally (both axes at once), so Chebyshev distance
   * represents how many turns the dragon needs to reach a tile.
   */
  private chebyshevDistance(a: Position, b: Position): number {
    return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  }

  /**
   * Last-move dragon safety check.
   * If the proposed last move puts the AI within Chebyshev distance 1 of
   * the dragon (dragon can reach us in one diagonal step → attack), try
   * to find a safer alternative. Returns:
   * - null: original target is safe, proceed normally
   * - Position: use this safer alternative instead
   * - 'skip': finish the turn early (stay put to remain safe)
   */
  private lastMoveDragonSafety(
    state: GameStateData, currentPos: Position, proposedTarget: Position,
  ): Position | 'skip' | null {
    const dragonPos = state.dragon.position;
    if (!dragonPos) return null;

    const proposedCheby = this.chebyshevDistance(proposedTarget, dragonPos);
    const currentCheby = this.chebyshevDistance(currentPos, dragonPos);

    // Check if the proposed move goes through a locked door (50% failure = stay in place)
    const proposedDir = this.getDirection(currentPos, proposedTarget);
    const proposedIsLockedDoor = proposedDir !== null && this.isLockedDoor(state, currentPos, proposedDir);

    // Move is risky if:
    // 1. Target itself is in dragon range (cheby ≤ 1), OR
    // 2. Move goes through a locked door AND current pos is in dragon range
    //    (because 50% chance of staying at current pos → dragon attack)
    const targetDangerous = proposedCheby <= 1;
    const doorDangerous = proposedIsLockedDoor && currentCheby <= 1;

    if (!targetDangerous && !doorDangerous) {
      return null; // Safe move — proceed normally
    }

    if (targetDangerous) {
      aiLog(`Last-move safety: target [${proposedTarget}] is Chebyshev dist ${proposedCheby} from dragon [${dragonPos}] - DANGEROUS!`);
    }
    if (doorDangerous) {
      aiLog(`Last-move safety: target [${proposedTarget}] goes through LOCKED DOOR. Current pos [${currentPos}] cheby=${currentCheby} from dragon - door failure = DEATH RISK!`);
    }

    // Find all adjacent move options, scored by safety
    const candidates: { pos: Position; cheby: number; known: boolean; deadEnd: number; lockedDoor: boolean }[] = [];

    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(currentPos, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, currentPos, dir)) continue;

      const cheby = this.chebyshevDistance(neighbor, dragonPos);
      const known = this.isEdgeKnownPassable(state, currentPos, dir);
      const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
      const lockedDoor = this.isLockedDoor(state, currentPos, dir);
      candidates.push({ pos: neighbor, cheby, known, deadEnd, lockedDoor });
    }

    // Sort: farthest from dragon, avoid locked doors when in danger zone, avoid dead-ends, prefer known
    candidates.sort((a, b) => {
      if (b.cheby !== a.cheby) return b.cheby - a.cheby;
      // When current pos is in dragon range, prefer non-door moves (door failure = stay in danger)
      if (currentCheby <= 1 && a.lockedDoor !== b.lockedDoor) return a.lockedDoor ? 1 : -1;
      if (a.deadEnd !== b.deadEnd) return a.deadEnd - b.deadEnd;
      if (a.known !== b.known) return a.known ? -1 : 1;
      return 0;
    });

    // Safe moves: target cheby > 1 AND (not a locked door OR current pos is also safe)
    const safeMoves = candidates.filter(c =>
      c.cheby > 1 && (!c.lockedDoor || currentCheby > 1)
    );
    if (safeMoves.length > 0) {
      aiLog(`Last-move safety: found ${safeMoves.length} safe alternatives:`,
        safeMoves.map(c => `[${c.pos}] cheby=${c.cheby} deadEnd=${c.deadEnd} door=${c.lockedDoor} ${c.known ? 'known' : 'unknown'}`).join(' | '),
        '→ chose', `[${safeMoves[0].pos}]`);
      return safeMoves[0].pos;
    }

    // No safe move exists. If we're currently safe, always stay put.
    if (currentCheby > 1) {
      aiLog(`Last-move safety: no safe moves available. Current pos cheby=${currentCheby} is safe, staying put.`);
      return 'skip';
    }

    // We're already in the danger zone (cheby ≤ 1). Try to move AWAY
    // from the dragon — pick the candidate that maximizes distance.
    if (candidates.length > 0) {
      const best = candidates[0]; // Already sorted farthest first
      if (best.cheby > currentCheby) {
        aiLog(`Last-move safety: already in danger (cheby=${currentCheby}), moving away to [${best.pos}] (cheby=${best.cheby})`);
        return best.pos;
      }
      // All moves are equally dangerous or worse — stay put
      aiLog(`Last-move safety: already in danger (cheby=${currentCheby}), all moves equally bad or worse. Staying put.`);
      return 'skip';
    }

    // Completely boxed in with no moves at all — stay put
    aiLog(`Last-move safety: no moves available at all. Staying put.`);
    return 'skip';
  }

  // --- Dragon evasion ---

  /**
   * Move away from the dragon. Prefer known-passable edges that increase
   * distance from the dragon.
   */
  private evadeDragon(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position || !state.dragon.position) return null;

    // If Waystone is reachable via known path, head there (safe zone)
    // BUT only if the Waystone itself is far enough from the dragon to be safe
    // (Chebyshev > 1 means dragon can't reach it in one move)
    if (warrior.secretRoom) {
      const waystoneCheby = this.chebyshevDistance(warrior.secretRoom, state.dragon.position);
      if (waystoneCheby > 1) {
        const pathToHome = this.bfsKnownPath(state, warrior.position, warrior.secretRoom);
        if (pathToHome && pathToHome.length > 1 && pathToHome.length <= 4) {
          aiLog(`evadeDragon: Waystone reachable in ${pathToHome.length - 1} steps (cheby=${waystoneCheby} from dragon), heading there`);
          return pathToHome[1];
        }
      } else {
        aiLog(`evadeDragon: Waystone at [${warrior.secretRoom}] is too close to dragon (cheby=${waystoneCheby}), not using as escape`);
      }
    }

    const candidates: { pos: Position; dragonDist: number; known: boolean; recentCount: number; deadEnd: number }[] = [];

    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(warrior.position, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;

      const dragonDist = manhattanDistance(neighbor, state.dragon.position);
      const known = this.isEdgeKnownPassable(state, warrior.position, dir);
      const recentCount = this.recentVisitCount(neighbor);
      const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
      candidates.push({ pos: neighbor, dragonDist, known, recentCount, deadEnd });
    }

    if (candidates.length === 0) {
      aiLog('evadeDragon: No escape routes!');
      return null;
    }

    // Sort: farther from dragon first, then avoid dead-ends (trap!), then less recently visited, then prefer known-passable
    candidates.sort((a, b) => {
      if (b.dragonDist !== a.dragonDist) return b.dragonDist - a.dragonDist;
      // Among equal dragon distances, avoid dead-ends (evading into a dead-end = cornered)
      if (a.deadEnd !== b.deadEnd) return a.deadEnd - b.deadEnd;
      if (a.recentCount !== b.recentCount) return a.recentCount - b.recentCount;
      if (a.known !== b.known) return a.known ? -1 : 1;
      return 0;
    });

    aiLog(`evadeDragon: candidates:`, candidates.map(c =>
      `[${c.pos}] dragonDist=${c.dragonDist} deadEnd=${c.deadEnd} recent=${c.recentCount} ${c.known ? 'known' : 'unknown'}`
    ).join(' | '), '→ chose', `[${candidates[0].pos}]`);

    return candidates[0].pos;
  }

  // --- Utility ---

  /**
   * Find an adjacent move that stays outside the dragon's evade zone.
   * Prefers unknown edges and unvisited tiles.
   */
  private getSafeExploreMove(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;

    const candidates: { pos: Position; recentCount: number; unknown: boolean; deadEnd: number }[] = [];

    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(warrior.position, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;
      if (this.wouldTriggerEvade(neighbor, state)) continue; // Skip evade-zone tiles

      const recentCount = this.recentVisitCount(neighbor);
      const unknown = this.isEdgeUnknown(state, warrior.position, dir);
      const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
      candidates.push({ pos: neighbor, recentCount, unknown, deadEnd });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      if (a.deadEnd !== b.deadEnd) return a.deadEnd - b.deadEnd;
      if (a.recentCount !== b.recentCount) return a.recentCount - b.recentCount;
      if (a.unknown !== b.unknown) return a.unknown ? -1 : 1;
      return Math.random() - 0.5;
    });

    aiLog(`getSafeExploreMove: ${candidates.length} safe candidates:`,
      candidates.map(c => `[${c.pos}] deadEnd=${c.deadEnd} recent=${c.recentCount} ${c.unknown ? 'UNKNOWN' : 'known'}`).join(' | '),
      '→ chose', `[${candidates[0].pos}]`);
    return candidates[0].pos;
  }

  /**
   * Find a safe move (outside evade zone) that still gets us closer to the hint.
   * Used when the direct path toward the hint enters the dragon's evade zone.
   */
  private getSafeHintDirectedMove(state: GameStateData, hintPos: Position): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;

    const currentHintDist = manhattanDistance(warrior.position, hintPos);
    const candidates: { pos: Position; hintDist: number; recentCount: number; unknown: boolean; deadEnd: number }[] = [];

    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(warrior.position, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;
      if (this.wouldTriggerEvade(neighbor, state)) continue; // Must be safe

      const hintDist = manhattanDistance(neighbor, hintPos);
      const recentCount = this.recentVisitCount(neighbor);
      const unknown = this.isEdgeUnknown(state, warrior.position, dir);
      const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
      candidates.push({ pos: neighbor, hintDist, recentCount, unknown, deadEnd });
    }

    if (candidates.length === 0) return null;

    // Prefer: avoid dead-ends > closer to hint > less recently visited > unknown edges
    candidates.sort((a, b) => {
      if (a.deadEnd !== b.deadEnd) return a.deadEnd - b.deadEnd;
      if (a.hintDist !== b.hintDist) return a.hintDist - b.hintDist;
      if (a.recentCount !== b.recentCount) return a.recentCount - b.recentCount;
      if (a.unknown !== b.unknown) return a.unknown ? -1 : 1;
      return 0;
    });

    // Only use if it actually gets us closer (or at least same distance)
    if (candidates[0].hintDist <= currentHintDist) {
      aiLog(`getSafeHintDirectedMove: ${candidates.length} safe candidates:`,
        candidates.map(c => `[${c.pos}] hintDist=${c.hintDist} recent=${c.recentCount} ${c.unknown ? 'UNKNOWN' : 'known'}`).join(' | '),
        '→ chose', `[${candidates[0].pos}]`);
      return candidates[0].pos;
    }

    aiLog('getSafeHintDirectedMove: no safe move gets closer to hint');
    return null;
  }

  /**
   * Find the best unvisited tile within the treasure hint area (Manhattan dist ≤ 2 of hint).
   * The treasure is guaranteed within 2 tiles of the hint, so systematically checking
   * this area is the fastest way to find it.
   */
  private findHintAreaTarget(state: GameStateData, from: Position, hintPos: Position): Position | null {
    const candidates: { pos: Position; dist: number; reachable: boolean }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === from[0] && c === from[1]) continue;
        const pos: Position = [r, c];
        if (manhattanDistance(pos, hintPos) > 2) continue;
        if (this.visitedTiles.has(tileKey(r, c))) continue;

        // Check if reachable via known passages (BFS)
        const path = this.bfsKnownPath(state, from, pos);
        const reachable = path !== null;
        const dist = reachable ? path!.length - 1 : manhattanDistance(from, pos);
        candidates.push({ pos, dist, reachable });
      }
    }

    if (candidates.length === 0) return null;

    // Prefer reachable tiles, then closer ones
    candidates.sort((a, b) => {
      if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
      return a.dist - b.dist;
    });

    aiLog(`findHintAreaTarget: ${candidates.length} unvisited hint-area tiles:`,
      candidates.map(c => `[${c.pos}] dist=${c.dist} ${c.reachable ? 'reachable' : 'unreachable'}`).join(' | '),
      '→ chose', `[${candidates[0].pos}]`);

    return candidates[0].pos;
  }

  /**
   * Anti-oscillation move: pick the adjacent tile that the AI has visited
   * least recently, preferring unknown edges. Breaks A-B-A-B loops.
   */
  private getAntiOscillationMove(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;

    const candidates: { pos: Position; recentCount: number; unknown: boolean; deadEnd: number }[] = [];

    for (const dir of ALL_DIRS) {
      const neighbor = getAdjacentPosition(warrior.position, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;

      const recentCount = this.recentVisitCount(neighbor);
      const unknown = this.isEdgeUnknown(state, warrior.position, dir);
      const deadEnd = this.getDeadEndDepth(neighbor, oppositeDir(dir), state);
      candidates.push({ pos: neighbor, recentCount, unknown, deadEnd });
    }

    if (candidates.length === 0) {
      aiLog('getAntiOscillationMove: no candidates!');
      return null;
    }

    // Sort: avoid dead-ends > least recently visited > prefer unknown edges
    candidates.sort((a, b) => {
      if (a.deadEnd !== b.deadEnd) return a.deadEnd - b.deadEnd;
      if (a.recentCount !== b.recentCount) return a.recentCount - b.recentCount;
      if (a.unknown !== b.unknown) return a.unknown ? -1 : 1;
      return Math.random() - 0.5; // Random tiebreaker
    });

    aiLog(`getAntiOscillationMove: candidates:`, candidates.map(c =>
      `[${c.pos}] deadEnd=${c.deadEnd} recent=${c.recentCount} ${c.unknown ? 'UNKNOWN' : 'known'}`
    ).join(' | '), '→ chose', `[${candidates[0].pos}]`);

    return candidates[0].pos;
  }

  /** Get a random adjacent move that's not known to be blocked. */
  private getRandomAdjacentMove(state: GameStateData): Position | null {
    const warrior = state.warriors[1];
    if (!warrior.position) return null;

    const shuffled = [...ALL_DIRS].sort(() => Math.random() - 0.5);
    for (const dir of shuffled) {
      const neighbor = getAdjacentPosition(warrior.position, dir);
      if (!neighbor) continue;
      if (this.isEdgeKnownBlocked(state, warrior.position, dir)) continue;
      return neighbor;
    }

    return null;
  }

  /** Get direction from one position to an adjacent position. */
  private getDirection(from: Position, to: Position): Direction | null {
    const dy = to[0] - from[0];
    const dx = to[1] - from[1];
    if (dy === -1 && dx === 0) return Direction.North;
    if (dy === 1 && dx === 0) return Direction.South;
    if (dy === 0 && dx === 1) return Direction.East;
    if (dy === 0 && dx === -1) return Direction.West;
    return null;
  }

  /** Promise-based delay with AbortSignal support. */
  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }
}
