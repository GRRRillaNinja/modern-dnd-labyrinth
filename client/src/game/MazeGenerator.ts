import {
  Direction,
  PathType,
  Position,
  ChamberPath,
  MazeState,
  GameSettings,
} from '@shared/types';

export class MazeGenerator {
  private settings: GameSettings;
  private chamberPaths: ChamberPath[][] = [];
  private stack: Position[] = [];
  private visited: Record<string, boolean> = {};

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  /**
   * Generate a new maze
   */
  public generate(seed?: number): MazeState {
    // If seed provided, use it for deterministic generation
    if (seed !== undefined) {
      this.seedRandom(seed);
    }

    this.initializeMaze();
    const startPos: Position = [
      Math.floor(Math.random() * 8),
      Math.floor(Math.random() * 8),
    ];
    this.stack = [startPos];
    this.visited = {};

    // Generate maze using depth-first search
    this.travelMaze();
    this.removeWalls();

    return {
      chamberPaths: this.chamberPaths,
      seed,
    };
  }

  /**
   * Initialize the maze grid
   */
  private initializeMaze(): void {
    this.chamberPaths = [];
    for (let r = 0; r < 8; r++) {
      this.chamberPaths.push([]);
      for (let c = 0; c < 8; c++) {
        this.chamberPaths[r].push([
          r === 0 ? PathType.Wall : PathType.Undefined, // North
          c === 7 ? PathType.Wall : PathType.Undefined, // East
          r === 7 ? PathType.Wall : PathType.Undefined, // South
          c === 0 ? PathType.Wall : PathType.Undefined, // West
        ]);
      }
    }
  }

  /**
   * Travel through maze using depth-first search
   */
  private travelMaze(): void {
    while (this.stack.length > 0) {
      const pos = this.stack[this.stack.length - 1];
      const [row, col] = pos;
      const key = `${row}_${col}`;
      this.visited[key] = true;

      // Apply edge wall bias
      if (this.settings.edgeWallBias) {
        this.applyEdgeWallBias(row, col);
      }

      // Find available directions
      const availableDirections = this.getAvailableDirections(row, col);

      if (availableDirections.length === 0) {
        this.stack.pop();
      } else {
        // Choose random direction
        const dir =
          availableDirections[
            Math.floor(Math.random() * availableDirections.length)
          ];
        this.setPath(row, col, dir, this.openOrDoor());

        // Move to next chamber
        const nextPos: Position = [
          row + (dir === Direction.North ? -1 : dir === Direction.South ? 1 : 0),
          col + (dir === Direction.West ? -1 : dir === Direction.East ? 1 : 0),
        ];
        this.stack.push(nextPos);
      }
    }
  }

  /**
   * Apply wall bias near edges to keep exterior walls solid
   */
  private applyEdgeWallBias(row: number, col: number): void {
    const isEdgeCol = col === 0 || col === 7;
    const isEdgeRow = row === 0 || row === 7;

    if (
      row > 0 &&
      this.chamberPaths[row][col][Direction.North] === PathType.Undefined &&
      this.visited[`${row - 1}_${col}`]
    ) {
      this.setPath(
        row,
        col,
        Direction.North,
        this.wallOrNot(isEdgeCol ? 1 : this.settings.wallProb)
      );
    }

    if (
      col < 7 &&
      this.chamberPaths[row][col][Direction.East] === PathType.Undefined &&
      this.visited[`${row}_${col + 1}`]
    ) {
      this.setPath(
        row,
        col,
        Direction.East,
        this.wallOrNot(isEdgeRow ? 1 : this.settings.wallProb)
      );
    }

    if (
      row < 7 &&
      this.chamberPaths[row][col][Direction.South] === PathType.Undefined &&
      this.visited[`${row + 1}_${col}`]
    ) {
      this.setPath(
        row,
        col,
        Direction.South,
        this.wallOrNot(isEdgeCol ? 1 : this.settings.wallProb)
      );
    }

    if (
      col > 0 &&
      this.chamberPaths[row][col][Direction.West] === PathType.Undefined &&
      this.visited[`${row}_${col - 1}`]
    ) {
      this.setPath(
        row,
        col,
        Direction.West,
        this.wallOrNot(isEdgeRow ? 1 : this.settings.wallProb)
      );
    }
  }

  /**
   * Get available directions from current position
   */
  private getAvailableDirections(row: number, col: number): Direction[] {
    const paths = this.chamberPaths[row][col];
    const opts: Direction[] = [];
    const isEdgeCol = col === 0 || col === 7;
    const isEdgeRow = row === 0 || row === 7;

    if (paths[Direction.North] === PathType.Undefined) {
      opts.push(Direction.North);
    } else if (
      this.settings.edgeWallBias &&
      row === 0 &&
      paths[Direction.South] === PathType.Undefined
    ) {
      opts.push(Direction.South, Direction.South);
    }

    if (paths[Direction.East] === PathType.Undefined) {
      opts.push(Direction.East);
    } else if (
      this.settings.edgeWallBias &&
      col === 7 &&
      paths[Direction.West] === PathType.Undefined
    ) {
      opts.push(Direction.West, Direction.West);
    }

    if (paths[Direction.South] === PathType.Undefined) {
      opts.push(Direction.South);
    } else if (
      this.settings.edgeWallBias &&
      row === 7 &&
      paths[Direction.North] === PathType.Undefined
    ) {
      opts.push(Direction.North, Direction.North);
    }

    if (paths[Direction.West] === PathType.Undefined) {
      opts.push(Direction.West);
    } else if (
      this.settings.edgeWallBias &&
      col === 0 &&
      paths[Direction.East] === PathType.Undefined
    ) {
      opts.push(Direction.East, Direction.East);
    }

    return opts;
  }

  /**
   * Set path type between chambers
   */
  private setPath(
    row: number,
    col: number,
    dir: Direction,
    type: PathType
  ): void {
    this.chamberPaths[row][col][dir] = type;

    // Update adjacent chamber
    if (dir === Direction.North && row !== 0) {
      this.chamberPaths[row - 1][col][Direction.South] = type;
    } else if (dir === Direction.East && col !== 7) {
      this.chamberPaths[row][col + 1][Direction.West] = type;
    } else if (dir === Direction.South && row !== 7) {
      this.chamberPaths[row + 1][col][Direction.North] = type;
    } else if (dir === Direction.West && col !== 0) {
      this.chamberPaths[row][col - 1][Direction.East] = type;
    }
  }

  /**
   * Randomly remove some walls to create more open paths
   */
  private removeWalls(): void {
    if (
      this.settings.removeWallProb > 0 &&
      this.settings.removeWallThreshold < 4
    ) {
      for (let r = 1; r < 7; r++) {
        for (let c = 1; c < 7; c++) {
          const wallDirs: Direction[] = [];
          for (let dir = 0; dir < 4; dir++) {
            if (this.chamberPaths[r][c][dir] === PathType.Wall) {
              wallDirs.push(dir);
            }
          }

          if (
            wallDirs.length >= this.settings.removeWallThreshold &&
            Math.random() <= this.settings.removeWallProb
          ) {
            const removeDir =
              wallDirs[Math.floor(Math.random() * wallDirs.length)];
            this.setPath(r, c, removeDir, this.openOrDoor());
          }
        }
      }
    }
  }

  /**
   * Decide if a path should be a wall or not
   */
  private wallOrNot(wallProb?: number): PathType {
    const prob = wallProb ?? this.settings.wallProb;
    return Math.random() <= prob ? PathType.Wall : this.openOrDoor();
  }

  /**
   * Decide if a path should be open or have a door
   */
  private openOrDoor(): PathType {
    return Math.random() <= this.settings.doorProb
      ? PathType.Door
      : PathType.Open;
  }

  /**
   * Seed random for deterministic generation
   */
  private seedRandom(seed: number): void {
    // Simple seeded random using mulberry32
    let state = seed;
    Math.random = () => {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
