// Enums and Constants
export enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

export enum PathType {
  Undefined = 0,
  Open = 1,
  Wall = 2,
  Door = 3,
}

export enum GameState {
  Wait = 0,
  WarriorOneSelectRoom = 1,
  WarriorTwoSelectRoom = 2,
  WarriorOneTurn = 3,
  WarriorTwoTurn = 4,
  GameOver = 5,
}

export enum DragonState {
  Asleep = 0,
  Awake = 1,
}

export enum GameMode {
  SinglePlayer = 'single',
  LocalMultiplayer = 'local',
  OnlineMultiplayer = 'online',
  VsCPU = 'cpu',
}

// Position type
export type Position = [number, number];

// Chamber path type (4 directions)
export type ChamberPath = [PathType, PathType, PathType, PathType];

// Game settings
export interface GameSettings {
  debug: boolean;
  travelSpeed: number;
  doorProb: number;
  wallProb: number;
  removeWallThreshold: number;
  removeWallProb: number;
  edgeWallBias: boolean;
  treasureRoomDistance: number;
  maxLives: number;
  baseMoves: number;
  movesPerLife: number;
  movesWithTreasure: number;
  doorClosedProb: number;
  dragonWakeDistance: number;
  dragonVisibilityDistance: number;
  dragonFollows: number;
}

// Warrior state
export interface Warrior {
  lives: number;
  secretRoom: Position | null;
  position: Position | null;
  moves: number;
  skipNextTurn: boolean;
}

// Dragon state
export interface Dragon {
  position: Position | null;
  state: DragonState;
  visible: boolean;
  hasBeenVisible: boolean; // Once visible, stays visible
  lastKnownWarriorPosition: Position | null; // Last position where dragon saw an unsafe warrior
  treasureHintPosition: Position | null; // Position where dragon was first spotted (single player hint)
}

// Treasure state
export interface Treasure {
  room: Position | null;
  warrior: number; // -1 if no warrior has it
  visible: boolean;
}

// Complete game state
export interface GameStateData {
  state: GameState;
  level: number;
  numberOfWarriors: number;
  warriors: [Warrior, Warrior];
  dragon: Dragon;
  treasure: Treasure;
  switchButtonOn: boolean;
  helpMessage: string;
  mode: GameMode;
  discoveredWalls: DiscoveredWalls;
  lockedDoors: LockedDoors;
}

// Maze state
export interface MazeState {
  chamberPaths: ChamberPath[][];
  seed?: number;
}

// Discovered walls tracking
export interface DiscoveredWalls {
  [key: string]: boolean; // Format: "row-col-direction"
}

// Locked doors tracking
export interface LockedDoors {
  [key: string]: boolean; // Format: "row-col-direction"
}

// Move action
export interface MoveAction {
  warriorNumber: number;
  position: Position;
}

// Game events
export type GameEvent =
  | { type: 'WARRIOR_MOVED'; warriorNumber: number; position: Position }
  | { type: 'DRAGON_MOVED'; position: Position }
  | { type: 'DRAGON_AWAKE' }
  | { type: 'DRAGON_ATTACK'; warriorNumber: number }
  | { type: 'TREASURE_FOUND'; warriorNumber: number }
  | { type: 'WARRIOR_BATTLE'; winner: number; loser: number }
  | { type: 'WARRIOR_KILLED'; warriorNumber: number }
  | { type: 'GAME_WON'; warriorNumber: number }
  | { type: 'GAME_LOST' }
  | { type: 'WALL_HIT'; warriorNumber: number; position: Position; direction: Direction }
  | { type: 'DOOR_CLOSED'; warriorNumber: number }
  | { type: 'ILLEGAL_MOVE'; warriorNumber: number };

// Default settings
export const DEFAULT_SETTINGS: GameSettings = {
  debug: false,
  travelSpeed: 200,
  doorProb: 0.1,
  wallProb: 0.8,
  removeWallThreshold: 2,
  removeWallProb: 0,
  edgeWallBias: true,
  treasureRoomDistance: 3,
  maxLives: 3,
  baseMoves: 2,
  movesPerLife: 2,
  movesWithTreasure: 4,
  doorClosedProb: 0.35, // 35% chance doors are locked
  dragonWakeDistance: 3, // Multiplayer wake distance
  dragonVisibilityDistance: 5, // Single player visibility distance
  dragonFollows: 1,
};
