import {
  Direction,
  PathType,
  Position,
  GameState,
  DragonState,
  GameStateData,
  GameSettings,
  GameEvent,
  DEFAULT_SETTINGS,
  Warrior,
  ChamberPath,
  GameMode,
} from '@shared/types';

export class GameEngine {
  private settings: GameSettings;
  private gameState: GameStateData;
  private chamberPaths: ChamberPath[][] = [];
  private eventListeners: Array<(event: GameEvent) => void> = [];
  private preDragonState: GameStateData | null = null;

  constructor(settings: Partial<GameSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.gameState = this.createInitialState();
  }

  /** Structured one-line action log for debugging turn flow */
  private logAction(actor: string, action: string, extra?: string): void {
    const p = (pos: Position | null) => pos ? `[${pos[0]},${pos[1]}]` : '---';
    const w0 = this.gameState.warriors[0];
    const w1 = this.gameState.warriors[1];
    const d = this.gameState.dragon;
    const turn = ['Wait','W1Select','W2Select','W1Turn','W2Turn','Over'][this.gameState.state];
    const suffix = extra ? ` | ${extra}` : '';
    console.log(
      `%c[${actor}]%c ${action} | W0${p(w0.position)}(${w0.lives}hp,${w0.moves}mv) W1${p(w1.position)}(${w1.lives}hp,${w1.moves}mv) Dragon${p(d.position)} | ${turn}${suffix}`,
      actor === 'Dragon' ? 'color:#ff6b6b;font-weight:bold' : 'color:#4caf50;font-weight:bold',
      'color:inherit'
    );
  }

  /**
   * Initialize game state
   */
  private createInitialState(): GameStateData {
    return {
      state: GameState.Wait,
      level: 1,
      numberOfWarriors: 1,
      warriors: [this.createWarrior(), this.createWarrior()],
      dragon: {
        position: null,
        state: DragonState.Asleep,
        visible: false,
        hasBeenVisible: false,
        lastKnownWarriorPosition: null,
        treasureHintPosition: null,
      },
      treasure: {
        room: null,
        warrior: -1,
        visible: false,
      },
      switchButtonOn: false,
      helpMessage: '',
      mode: GameMode.SinglePlayer,
      discoveredWalls: {},
      lockedDoors: {},
    };
  }

  private createWarrior(): Warrior {
    return {
      lives: this.settings.maxLives,
      secretRoom: null,
      position: null,
      moves: 0,
      skipNextTurn: false,
    };
  }

  /**
   * Start a new game
   */
  public startGame(numberOfWarriors: number = 1): void {
    this.gameState = this.createInitialState();
    this.gameState.numberOfWarriors = numberOfWarriors;
    
    // Both single and multiplayer: dragon starts asleep
    this.gameState.dragon.state = DragonState.Asleep;
    this.gameState.dragon.visible = false;
    
    this.gameState.state = GameState.WarriorOneSelectRoom;
  }

  /**
   * Set the maze
   */
  public setMaze(chamberPaths: ChamberPath[][]): void {
    this.chamberPaths = chamberPaths;
    
    // Initialize locked doors for level 2
    if (this.gameState.level === 2) {
      this.initializeLockedDoors();
    }
  }

  /**
   * Initialize locked doors randomly when game starts (level 2 only)
   */
  private initializeLockedDoors(): void {
    this.gameState.lockedDoors = {};
    
    // Go through all chambers and their doors
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const chamberPath = this.chamberPaths[row][col];
        
        // Check each direction for doors
        for (let dir = 0; dir < 4; dir++) {
          if (chamberPath[dir] === PathType.Door) {
            const key = `${row}-${col}-${dir}`;
            
            // Skip if we've already processed this door from the other side
            if (this.gameState.lockedDoors[key] !== undefined) {
              continue;
            }
            
            // Randomly determine if door is locked
            const isLocked = Math.random() <= this.settings.doorClosedProb;
            
            // Set locked status for this side
            this.gameState.lockedDoors[key] = isLocked;
            
            // Also set for the opposite side (same physical door)
            const adjacentPos = this.getAdjacentPosition([row, col], dir);
            if (adjacentPos) {
              const oppositeDir = this.getOppositeDirection(dir);
              const oppositeKey = `${adjacentPos[0]}-${adjacentPos[1]}-${oppositeDir}`;
              this.gameState.lockedDoors[oppositeKey] = isLocked;
            }
          }
        }
      }
    }
  }

  /**
   * Set warrior secret room
   */
  public setWarriorSecretRoom(warriorNumber: number, position: Position): boolean {
    // Check if room is already taken by other warrior
    if (warriorNumber === 1) {
      const warrior0Room = this.gameState.warriors[0].secretRoom;
      if (
        warrior0Room &&
        warrior0Room[0] === position[0] &&
        warrior0Room[1] === position[1]
      ) {
        this.emitEvent({ type: 'ILLEGAL_MOVE', warriorNumber });
        return false;
      }
    }

    this.gameState.warriors[warriorNumber].secretRoom = position;
    this.gameState.warriors[warriorNumber].position = position;

    // Move to next state
    if (this.gameState.state === GameState.WarriorOneSelectRoom) {
      // If single player, go directly to game start
      if (this.gameState.numberOfWarriors === 1) {
        this.startTurns();
      } else {
        // Multiplayer: move to warrior 2 selection
        this.gameState.state = GameState.WarriorTwoSelectRoom;
      }
    } else if (this.gameState.state === GameState.WarriorTwoSelectRoom) {
      this.startTurns();
    }

    return true;
  }

  /**
   * Skip warrior 2 and start single player game
   */
  public skipWarriorTwo(): void {
    if (this.gameState.state === GameState.WarriorTwoSelectRoom) {
      this.gameState.numberOfWarriors = 1;
      this.startTurns();
    }
  }

  /**
   * Start the turns phase
   */
  private startTurns(): void {
    this.setTreasureRoom();
    this.gameState.state = GameState.WarriorOneTurn;
    this.resetWarriorMoves(0);
  }

  /**
   * Mark a door as locked when warrior encounters it
   */
  private lockDoor(position: Position, direction: Direction): void {
    const key = `${position[0]}-${position[1]}-${direction}`;
    this.gameState.lockedDoors[key] = true;
    
    // Also mark the opposite side as locked (same physical door)
    const adjacentPos = this.getAdjacentPosition(position, direction);
    const oppositeDir = this.getOppositeDirection(direction);
    
    if (adjacentPos) {
      const oppositeKey = `${adjacentPos[0]}-${adjacentPos[1]}-${oppositeDir}`;
      this.gameState.lockedDoors[oppositeKey] = true;
    }
  }
  
  /**
   * Unlock a door when warrior successfully unlocks it
   */
  private unlockDoor(position: Position, direction: Direction): void {
    const key = `${position[0]}-${position[1]}-${direction}`;
    this.gameState.lockedDoors[key] = false;
    
    // Also mark the opposite side as unlocked (same physical door)
    const adjacentPos = this.getAdjacentPosition(position, direction);
    const oppositeDir = this.getOppositeDirection(direction);
    
    if (adjacentPos) {
      const oppositeKey = `${adjacentPos[0]}-${adjacentPos[1]}-${oppositeDir}`;
      this.gameState.lockedDoors[oppositeKey] = false;
    }
  }
  
  /**
   * Reveal a wall when discovered (from both sides)
   */
  private revealWall(position: Position, direction: Direction): void {
    // Mark this side as discovered
    const key = `${position[0]}-${position[1]}-${direction}`;
    this.gameState.discoveredWalls[key] = true;
    
    // Also mark the opposite side as discovered (same physical wall)
    const adjacentPos = this.getAdjacentPosition(position, direction);
    const oppositeDir = this.getOppositeDirection(direction);
    
    if (adjacentPos) {
      const oppositeKey = `${adjacentPos[0]}-${adjacentPos[1]}-${oppositeDir}`;
      this.gameState.discoveredWalls[oppositeKey] = true;
    }
  }
  
  /**
   * Get the adjacent position in a given direction
   */
  private getAdjacentPosition(position: Position, direction: Direction): Position | null {
    const [row, col] = position;
    
    switch (direction) {
      case Direction.North:
        return row > 0 ? [row - 1, col] : null;
      case Direction.South:
        return row < 7 ? [row + 1, col] : null;
      case Direction.East:
        return col < 7 ? [row, col + 1] : null;
      case Direction.West:
        return col > 0 ? [row, col - 1] : null;
      default:
        return null;
    }
  }
  
  /**
   * Get the opposite direction
   */
  private getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.North:
        return Direction.South;
      case Direction.South:
        return Direction.North;
      case Direction.East:
        return Direction.West;
      case Direction.West:
        return Direction.East;
      default:
        return direction;
    }
  }

  /**
   * Move warrior to adjacent chamber
   */
  public moveWarrior(warriorNumber: number, position: Position): boolean {
    const warrior = this.gameState.warriors[warriorNumber];
    if (!warrior.position) return false;
    
    // Don't allow moves if warrior is dead
    if (warrior.lives <= 0) return false;
    
    // Don't allow moves if game is over
    if (this.gameState.state === GameState.GameOver) return false;

    const dir = this.getMoveDirection(warrior.position, position);
    if (dir === null) {
      this.emitEvent({ type: 'ILLEGAL_MOVE', warriorNumber });
      return false;
    }

    // Only decrement moves in multiplayer OR in solo after dragon wakes
    const shouldTrackMoves = this.gameState.numberOfWarriors === 2 || this.gameState.dragon.state === DragonState.Awake;
    if (shouldTrackMoves) {
      warrior.moves--;
      // Don't allow moves to go negative
      if (warrior.moves < 0) {
        warrior.moves = 0;
        return false;
      }
    }
    
    const pathType = this.getPathType(warrior.position, dir);

    // Handle wall collision
    if (pathType === PathType.Wall) {
      // Reveal the wall
      this.revealWall(warrior.position, dir);
      
      this.emitEvent({
        type: 'WALL_HIT',
        warriorNumber,
        position: warrior.position,
        direction: dir,
      });
      
      // Don't finish turn - just cost 1 move
      // If no moves left (and tracking moves), finish turn
      if (shouldTrackMoves && warrior.moves === 0) {
        this.finishWarriorTurn(warriorNumber);
      }
      
      return false;
    }

    // Handle door (level 2 only)
    if (this.gameState.level === 2 && pathType === PathType.Door) {
      const key = `${warrior.position[0]}-${warrior.position[1]}-${dir}`;
      const isLocked = this.gameState.lockedDoors[key] || false;
      
      if (isLocked) {
        // Door is locked - 50/50 chance to unlock it
        if (Math.random() <= 0.5) {
          // Successfully unlocked! Allow passage and leave door unlocked
          this.unlockDoor(warrior.position, dir);
          // Continue with movement (don't return false)
        } else {
          // Failed to unlock - door remains locked
          this.emitEvent({ type: 'DOOR_CLOSED', warriorNumber });
          // Don't finish turn here - let the store handle it after door sound plays
          return false;
        }
      } else {
        // Door is unlocked - can pass through
        // Lock the door behind the warrior after they pass
        this.lockDoor(warrior.position, dir);
        // Continue with movement (don't return false)
      }
    }

    // Move successful
    warrior.position = position;
    this.emitEvent({ type: 'WARRIOR_MOVED', warriorNumber, position });

    // Check if warrior moved ONTO dragon's tile (suicide move)
    if (this.gameState.dragon.position &&
        this.getDistance(position, this.gameState.dragon.position) === 0 &&
        !this.isWarriorSafe(warriorNumber)) {
      // Warrior walked right into the dragon!
      this.dragonAttack(warriorNumber);
      // Dragon attack ends turn immediately - forfeit all remaining moves
      this.finishWarriorTurn(warriorNumber);
      return true;
    }

    // Check for treasure
    if (this.checkTreasureFound(warriorNumber)) {
      // Treasure found - DON'T end turn, just continue with remaining moves
      // Turn will end naturally when moves run out or player clicks "Next Turn"
      return true;
    }

    // Check for warrior battle
    this.checkWarriorBattle();

    // Check if dragon wakes
    this.checkDragonWakes(warriorNumber);

    // Dragon attacks are ONLY checked during dragon's turn when dragon moves
    // Exception: If warrior moves ONTO dragon (handled above)
    // This prevents unfair immediate attacks when exploring NEAR dragon (distance = 1)

    // Check win condition
    if (
      this.gameState.treasure.warrior === warriorNumber &&
      this.getDistance(position, warrior.secretRoom!) === 0
    ) {
      this.emitEvent({ type: 'GAME_WON', warriorNumber });
      this.gameState.state = GameState.GameOver;
      return true;
    }

    // Finish turn if no moves left (but only when tracking moves)
    if (shouldTrackMoves && warrior.moves === 0) {
      this.finishWarriorTurn(warriorNumber);
    }

    return true;
  }

  /**
   * Finish warrior's turn
   */
  public finishWarriorTurn(currentWarrior: number): void {
    this.logAction(currentWarrior === 0 ? 'W0' : 'W1', 'finishWarriorTurn');
    if (this.gameState.state === GameState.GameOver) return;
    
    // Don't continue if current warrior is dead
    if (this.gameState.warriors[currentWarrior].lives <= 0) {
      // If current warrior just died, check if game should end
      const allDead = this.gameState.warriors[0].lives <= 0 &&
        (this.gameState.numberOfWarriors === 1 || this.gameState.warriors[1].lives <= 0);
      if (allDead) {
        return; // Game over will be set by removeLife after delay
      }
    }

    // Determine if dragon should move
    let shouldMoveDragon = false;
    
    // Single player: dragon moves after player turn ONLY if awake
    if (this.gameState.numberOfWarriors === 1) {
      shouldMoveDragon = this.gameState.dragon.state === DragonState.Awake;
    }
    // Multiplayer: dragon only moves after BOTH players and only if awake
    else {
      const bothPlayersHaveMoved = currentWarrior === 1;
      const warrior2Dead = this.gameState.warriors[1].lives === 0;
      const dragonIsAwake = this.gameState.dragon.state === DragonState.Awake;
      
      shouldMoveDragon = (bothPlayersHaveMoved || warrior2Dead) && dragonIsAwake;
    }

    if (shouldMoveDragon) {
      // Snapshot state AFTER warrior actions but BEFORE dragon moves.
      // The store uses this to show warrior moves immediately during dragon chime.
      this.preDragonState = JSON.parse(JSON.stringify(this.gameState));
      this.moveDragon();
    } else {
      this.preDragonState = null;
    }

    // Determine next turn
    // If warrior 2 exists and is alive, and we just finished warrior 1's turn
    if (
      currentWarrior === 0 &&
      this.gameState.numberOfWarriors === 2 &&
      this.gameState.warriors[1].lives > 0
    ) {
      this.gameState.state = GameState.WarriorTwoTurn;
      this.resetWarriorMoves(1);
    }
    // Otherwise go back to warrior 1 (if alive)
    else if (this.gameState.warriors[0].lives > 0) {
      this.gameState.state = GameState.WarriorOneTurn;
      this.resetWarriorMoves(0);
    }
    // Or warrior 2 (if warrior 1 is dead and warrior 2 is alive)
    else if (
      this.gameState.numberOfWarriors === 2 &&
      this.gameState.warriors[1].lives > 0
    ) {
      this.gameState.state = GameState.WarriorTwoTurn;
      this.resetWarriorMoves(1);
    }
  }

  /**
   * Check if treasure is found
   */
  private checkTreasureFound(warriorNumber: number): boolean {
    const warrior = this.gameState.warriors[warriorNumber];
    const treasureRoom = this.gameState.treasure.room;

    if (
      this.gameState.treasure.warrior < 0 &&
      treasureRoom &&
      warrior.position &&
      this.getDistance(warrior.position, treasureRoom) === 0
    ) {
      this.gameState.treasure.warrior = warriorNumber;
      this.gameState.treasure.visible = true;
      
      // Clear the hint position (no longer needed)
      this.gameState.dragon.treasureHintPosition = null;
      
      // Set moves to treasure carrying amount (always full amount when treasure is found)
      warrior.moves = this.settings.movesWithTreasure;
      
      this.emitEvent({ type: 'TREASURE_FOUND', warriorNumber });
      return true;
    }

    return false;
  }

  /**
   * Check for warrior battle (if both on same square with treasure)
   */
  private checkWarriorBattle(): void {
    if (
      this.gameState.numberOfWarriors === 2 &&
      this.gameState.warriors[0].lives > 0 &&
      this.gameState.warriors[1].lives > 0 &&
      this.gameState.treasure.warrior >= 0
    ) {
      const pos0 = this.gameState.warriors[0].position;
      const pos1 = this.gameState.warriors[1].position;

      if (pos0 && pos1 && this.getDistance(pos0, pos1) === 0) {
        // Random warrior wins the treasure
        const previousOwner = this.gameState.treasure.warrior;
        const winner = Math.floor(Math.random() * 2);
        const loser = winner === 0 ? 1 : 0;
        
        // Only emit event if treasure changed hands
        if (winner !== previousOwner) {
          this.gameState.treasure.warrior = winner;
          this.emitEvent({ type: 'WARRIOR_BATTLE', winner, loser });
        }
      }
    }
  }

  /**
   * Check if dragon should wake up or become visible
   */
  private checkDragonWakes(warriorNumber: number): void {
    const warrior = this.gameState.warriors[warriorNumber];
    if (!warrior.position || !warrior.secretRoom) return;

    // Skip if warrior is in secret room
    if (this.getDistance(warrior.position, warrior.secretRoom) === 0) return;

    const dragonDistance = this.getDistance(
      warrior.position,
      this.gameState.dragon.position!
    );

    // Both single and multiplayer: dragon wakes when within 3 tiles
    if (this.gameState.dragon.state === DragonState.Asleep) {
      if (dragonDistance <= this.settings.dragonWakeDistance) {
        this.gameState.dragon.state = DragonState.Awake;
        this.gameState.dragon.visible = true;
        this.gameState.dragon.hasBeenVisible = true;

        // Mark dragon's position as treasure hint (treasure is within 2 tiles)
        this.gameState.dragon.treasureHintPosition = this.gameState.dragon.position;

        // Single player only: reset moves when dragon wakes (moves now matter!)
        if (this.gameState.numberOfWarriors === 1) {
          this.resetWarriorMoves(warriorNumber);
        }

        this.emitEvent({ type: 'DRAGON_AWAKE' });
      }
    }
    // Single player: after waking, update visibility based on distance
    else if (this.gameState.numberOfWarriors === 1) {
      if (dragonDistance <= this.settings.dragonVisibilityDistance) {
        this.gameState.dragon.visible = true;
      }
    }
  }

  /**
   * Move the dragon
   */
  private moveDragon(): void {
    if (this.gameState.dragon.state !== DragonState.Awake) return;

    const dragonFrom = this.gameState.dragon.position ? [...this.gameState.dragon.position] as Position : null;

    let targetPos: Position | null = null;
    let followWarrior = -1;

    // Follow treasure if a warrior has it
    if (this.gameState.treasure.warrior >= 0) {
      followWarrior = this.gameState.treasure.warrior;
      targetPos = this.gameState.warriors[followWarrior].position;
      // Update last known position (but never set it to a secret room)
      if (targetPos && !this.isAnySecretRoom(targetPos)) {
        this.gameState.dragon.lastKnownWarriorPosition = targetPos;
      }
    } else {
      // Follow closest unsafe warrior
      const unsafeWarriors = this.getUnsafeWarriors();
      if (unsafeWarriors.length > 0) {
        if (unsafeWarriors.length === 1) {
          followWarrior = unsafeWarriors[0];
        } else {
          const dist0 = this.getDistance(
            this.gameState.dragon.position!,
            this.gameState.warriors[0].position!
          );
          const dist1 = this.getDistance(
            this.gameState.dragon.position!,
            this.gameState.warriors[1].position!
          );
          followWarrior =
            dist0 < dist1 ? 0 : dist0 > dist1 ? 1 : Math.floor(Math.random() * 2);
        }
        targetPos = this.gameState.warriors[followWarrior].position;
        // Update last known position (but never set it to a secret room)
        if (targetPos && !this.isAnySecretRoom(targetPos)) {
          this.gameState.dragon.lastKnownWarriorPosition = targetPos;
        }
      } else {
        // All warriors are safe in their secret rooms
        // Patrol around the last known position where we saw a warrior
        if (this.gameState.dragon.lastKnownWarriorPosition) {
          const lastKnown = this.gameState.dragon.lastKnownWarriorPosition;
          const currentPos = this.gameState.dragon.position!;
          const distanceFromLastKnown = this.getDistance(currentPos, lastKnown);
          
          // Move towards last known position, but stop when we reach it
          if (distanceFromLastKnown > 0) {
            targetPos = lastKnown;
          } else {
            // At the last known position, stay put
            targetPos = null;
          }
        } else {
          // No last known position yet, move to treasure room
          targetPos = this.gameState.treasure.room;
        }
      }
    }

    if (targetPos && this.gameState.dragon.position) {
      const currentPos = this.gameState.dragon.position;

      // Check if target is a secret room - don't move onto it
      const isTargetSecretRoom = this.isAnySecretRoom(targetPos);

      if (!isTargetSecretRoom || this.getDistance(currentPos, targetPos) > 1) {
        const moveY = Math.sign(targetPos[0] - currentPos[0]);
        const moveX = Math.sign(targetPos[1] - currentPos[1]);

        const newPos: Position = [currentPos[0] + moveY, currentPos[1] + moveX];
        
        // Don't move directly onto a secret room
        const isNewPosSecretRoom = this.isAnySecretRoom(newPos);
        
        if (!isNewPosSecretRoom) {
          this.gameState.dragon.position = newPos;
          this.logAction('Dragon', `moved [${dragonFrom}]→[${newPos}]`, `target=W${followWarrior}`);

          // Once dragon has been visible, it stays visible permanently
          if (this.gameState.dragon.hasBeenVisible) {
            this.gameState.dragon.visible = true;
          }

          this.emitEvent({ type: 'DRAGON_MOVED', position: newPos });
          this.checkDragonAttacks();
        } else {
          this.logAction('Dragon', 'blocked (secret room)', `tried=[${newPos}]`);
        }
        // If newPos is a secret room, don't move (stay in place)
      }
    }
  }

  /**
   * Check if dragon attacks any warriors
   */
  private checkDragonAttacks(): boolean {
    const unsafeWarriors = this.getUnsafeWarriors();


    const threatenedWarriors = unsafeWarriors.filter(
      (w) =>
        this.getDistance(
          this.gameState.dragon.position!,
          this.gameState.warriors[w].position!
        ) === 0
    );

    if (threatenedWarriors.length === 0) {
      return false;
    }

    let attackWarrior =
      threatenedWarriors.length === 1 ? threatenedWarriors[0] : -1;

    if (threatenedWarriors.length === 2) {
      attackWarrior =
        this.gameState.treasure.warrior >= 0
          ? this.gameState.treasure.warrior
          : Math.floor(Math.random() * 2);
    }

    if (attackWarrior >= 0) {
      this.dragonAttack(attackWarrior);
      return true;
    }

    return false;
  }

  /**
   * Dragon attacks warrior
   */
  private dragonAttack(warriorNumber: number): void {
    this.logAction('Dragon', `attacks W${warriorNumber}`, `lives=${this.gameState.warriors[warriorNumber].lives}→${this.gameState.warriors[warriorNumber].lives - 1}`);
    this.emitEvent({ type: 'DRAGON_ATTACK', warriorNumber });
    this.gameState.dragon.visible = true;

    // Drop treasure if warrior has it
    if (this.gameState.treasure.warrior === warriorNumber) {
      // Move treasure to warrior's current position (death location)
      this.gameState.treasure.room = this.gameState.warriors[warriorNumber].position;
      this.gameState.treasure.warrior = -1;
    }

    // Remove life
    this.removeLife(warriorNumber);
  }

  /**
   * Get a random position on the map (not a secret room, not the treasure room)
   */
  private getRandomRespawnPosition(): Position {
    const validPositions: Position[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pos: Position = [row, col];
        
        // Skip if it's a secret room
        if (this.isSecretRoom(pos, 0) || this.isSecretRoom(pos, 1)) {
          continue;
        }
        
        // Skip if it's the treasure room
        if (this.gameState.treasure.room && 
            pos[0] === this.gameState.treasure.room[0] && 
            pos[1] === this.gameState.treasure.room[1]) {
          continue;
        }
        
        // Skip if dragon is on this position
        if (this.gameState.dragon.position &&
            pos[0] === this.gameState.dragon.position[0] &&
            pos[1] === this.gameState.dragon.position[1]) {
          continue;
        }
        
        validPositions.push(pos);
      }
    }
    
    // Return random valid position
    return validPositions[Math.floor(Math.random() * validPositions.length)];
  }

  /**
   * Remove a life from warrior
   */
  private removeLife(warriorNumber: number): void {
    const warrior = this.gameState.warriors[warriorNumber];
    warrior.lives--;

    if (warrior.lives < 1) {
      this.emitEvent({ type: 'WARRIOR_KILLED', warriorNumber });

      // Check game over
      const allDead = this.gameState.warriors[0].lives < 1 &&
        (this.gameState.numberOfWarriors === 1 || this.gameState.warriors[1].lives < 1);
      // In VS CPU mode, if the human player (warrior 0) dies, CPU wins
      const playerDeadInCPUMode = this.gameState.mode === GameMode.VsCPU &&
        warriorNumber === 0 && this.gameState.warriors[0].lives < 1;

      if (allDead || playerDeadInCPUMode) {
        // Delay game over state to allow dragon movement animation to complete
        setTimeout(() => {
          this.gameState.state = GameState.GameOver;
          if (playerDeadInCPUMode && !allDead) {
            // CPU wins by default — player lost all lives
            this.emitEvent({ type: 'GAME_WON', warriorNumber: 1 });
          } else {
            this.emitEvent({ type: 'GAME_LOST' });
          }
        }, 1500); // 1.5 second delay
      }
    } else {
      // Respawn at random position (not secret room, not treasure, not dragon)
      const oldPosition = warrior.position;
      warrior.position = this.getRandomRespawnPosition();
      this.logAction('Dragon', `W${warriorNumber} respawned [${oldPosition}]→[${warrior.position}]`);
    }
  }

  /**
   * Get warriors not in their secret rooms
   */
  private getUnsafeWarriors(): number[] {
    const warriors: number[] = [];
    if (
      this.gameState.warriors[0].lives > 0 &&
      !this.isWarriorSafe(0)
    ) {
      warriors.push(0);
    }
    if (
      this.gameState.numberOfWarriors === 2 &&
      this.gameState.warriors[1].lives > 0 &&
      !this.isWarriorSafe(1)
    ) {
      warriors.push(1);
    }
    return warriors;
  }

  /**
   * Check if a position is ANY warrior's secret room
   */
  private isAnySecretRoom(position: Position): boolean {
    return this.isSecretRoom(position, 0) || this.isSecretRoom(position, 1);
  }

  /**
   * Check if a position is a warrior's secret room
   */
  private isSecretRoom(position: Position, warriorNumber: number): boolean {
    const secretRoom = this.gameState.warriors[warriorNumber].secretRoom;
    if (!secretRoom) return false;
    return secretRoom[0] === position[0] && secretRoom[1] === position[1];
  }

  /**
   * Check if warrior is safe in secret room
   */
  private isWarriorSafe(warriorNumber: number): boolean {
    const warrior = this.gameState.warriors[warriorNumber];
    return (
      warrior.position !== null &&
      warrior.secretRoom !== null &&
      this.getDistance(warrior.position, warrior.secretRoom) === 0
    );
  }

  /**
   * Set treasure room location
   */
  private setTreasureRoom(): void {
    const opts: Position[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pos: Position = [row, col];
        const validForWarrior0 =
          this.getDistance(pos, this.gameState.warriors[0].secretRoom!) >
          this.settings.treasureRoomDistance;

        const validForWarrior1 =
          this.gameState.numberOfWarriors === 1 ||
          this.getDistance(pos, this.gameState.warriors[1].secretRoom!) >
            this.settings.treasureRoomDistance;

        if (validForWarrior0 && validForWarrior1) {
          opts.push(pos);
        }
      }
    }

    // Select dragon's lair position (where dragon starts)
    const dragonPos = opts[Math.floor(Math.random() * opts.length)];
    this.gameState.dragon.position = dragonPos;
    
    // Now find treasure room within 2 tiles of dragon (but not at dragon's position)
    const nearbyPositions: Position[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pos: Position = [row, col];
        const distanceToDragon = this.getDistance(pos, dragonPos);
        
        // Must be within 2 tiles but NOT at dragon's position
        if (distanceToDragon > 0 && distanceToDragon <= 2) {
          // Also check it's not a secret room
          if (!this.isAnySecretRoom(pos)) {
            nearbyPositions.push(pos);
          }
        }
      }
    }
    
    // Select random treasure position from nearby positions
    if (nearbyPositions.length > 0) {
      const treasurePos = nearbyPositions[Math.floor(Math.random() * nearbyPositions.length)];
      this.gameState.treasure.room = treasurePos;
    } else {
      // Fallback: if no nearby positions available, place treasure at dragon position
      this.gameState.treasure.room = dragonPos;
    }
  }

  /**
   * Reset warrior moves for their turn
   */
  private resetWarriorMoves(warriorNumber: number): void {
    const warrior = this.gameState.warriors[warriorNumber];
    let moves =
      this.settings.baseMoves + warrior.lives * this.settings.movesPerLife;

    if (this.gameState.treasure.warrior === warriorNumber) {
      moves = this.settings.movesWithTreasure;
    }

    warrior.moves = moves;
  }

  /**
   * Get direction between two adjacent positions
   */
  private getMoveDirection(from: Position, to: Position): Direction | null {
    const distance = this.getDistance(from, to);
    if (distance !== 1) return null;

    const dy = from[0] - to[0];
    const dx = from[1] - to[1];

    if (dy === 1) return Direction.North;
    if (dy === -1) return Direction.South;
    if (dx === 1) return Direction.West;
    if (dx === -1) return Direction.East;

    return null;
  }

  /**
   * Get path type between positions
   */
  private getPathType(position: Position, dir: Direction): PathType {
    return this.chamberPaths[position[0]][position[1]][dir];
  }

  /**
   * Calculate Manhattan distance between positions
   */
  public getDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1[0] - pos2[0]) + Math.abs(pos1[1] - pos2[1]);
  }

  /**
   * Toggle game level
   */
  public toggleLevel(): void {
    this.gameState.level = this.gameState.level === 1 ? 2 : 1;
    
    // Reinitialize locked doors if switching to level 2
    if (this.gameState.level === 2 && this.chamberPaths.length > 0) {
      this.initializeLockedDoors();
    } else {
      // Clear locked doors if switching to level 1
      this.gameState.lockedDoors = {};
    }
  }

  /**
   * Get current game state
   */
  public getState(): GameStateData {
    return this.gameState;
  }

  /**
   * Get the state snapshot from right before the dragon moved (after warrior actions).
   * Used by the store to show warrior moves immediately while hiding dragon changes during chime.
   */
  public getPreDragonState(): GameStateData | null {
    return this.preDragonState;
  }

  /**
   * Get chamber paths
   */
  public getChamberPaths(): ChamberPath[][] {
    return this.chamberPaths;
  }

  /**
   * Subscribe to game events
   */
  public on(callback: (event: GameEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit game event
   */
  private emitEvent(event: GameEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }
}
