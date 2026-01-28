import { Howl } from 'howler';
import { GameEvent } from '@shared/types';

export type SoundType =
  | 'on'
  | 'levelOne'
  | 'levelTwo'
  | 'dragonFlying'
  | 'defeat'
  | 'dragonAttacks'
  | 'dragonWakes'
  | 'wall'
  | 'door'
  | 'illegalMove'
  | 'warriorMoves'
  | 'warriorOne'
  | 'warriorTwo'
  | 'winner'
  | 'treasure'
  | 'scuffle';

export class AudioService {
  private sounds: Map<SoundType, Howl> = new Map();
  private enabled: boolean = true;
  private currentSound: Howl | null = null;

  constructor() {
    this.loadSounds();
  }

  /**
   * Load all game sounds
   */
  private loadSounds(): void {
    const soundFiles: Record<SoundType, string> = {
      on: '/audio/on.mp3',
      levelOne: '/audio/levelOne.mp3',
      levelTwo: '/audio/levelTwo.mp3',
      dragonFlying: '/audio/dragonFlying.mp3',
      defeat: '/audio/defeat.mp3',
      dragonAttacks: '/audio/dragonAttacks.mp3',
      dragonWakes: '/audio/dragonWakes.mp3',
      wall: '/audio/wall.mp3',
      door: '/audio/door.mp3',
      illegalMove: '/audio/illegalMove.mp3',
      warriorMoves: '/audio/warriorMoves.mp3',
      warriorOne: '/audio/warriorOne.mp3',
      warriorTwo: '/audio/warriorTwo.mp3',
      winner: '/audio/winner.mp3',
      treasure: '/audio/treasure.mp3',
      scuffle: '/audio/scuffle.mp3',
    };

    Object.entries(soundFiles).forEach(([key, src]) => {
      this.sounds.set(key as SoundType, new Howl({ src: [src] }));
    });
  }

  /**
   * Play a sound
   */
  public async play(sound: SoundType): Promise<void> {
    if (!this.enabled) return;

    // Stop current sound if playing
    if (this.currentSound) {
      this.currentSound.stop();
    }

    const howl = this.sounds.get(sound);
    if (!howl) return;

    this.currentSound = howl;

    return new Promise((resolve) => {
      howl.once('end', () => {
        this.currentSound = null;
        resolve();
      });
      howl.play();
    });
  }

  /**
   * Play sound for game event
   */
  public async playForEvent(event: GameEvent): Promise<void> {
    switch (event.type) {
      case 'WARRIOR_MOVED':
        await this.play('warriorMoves');
        break;
      case 'DRAGON_MOVED':
        await this.play('dragonFlying');
        break;
      case 'DRAGON_AWAKE':
        await this.play('dragonWakes');
        break;
      case 'DRAGON_ATTACK':
        await this.play(
          event.warriorNumber === 0 ? 'warriorOne' : 'warriorTwo'
        );
        await this.play('dragonAttacks');
        break;
      case 'TREASURE_FOUND':
        await this.play('treasure');
        break;
      case 'WARRIOR_BATTLE':
        await this.play('scuffle');
        break;
      case 'WARRIOR_KILLED':
        await this.play('defeat');
        break;
      case 'GAME_WON':
        await this.play('winner');
        break;
      case 'WALL_HIT':
        await this.play('wall');
        break;
      case 'DOOR_CLOSED':
        await this.play('door');
        break;
      case 'ILLEGAL_MOVE':
        await this.play('illegalMove');
        break;
    }
  }

  /**
   * Play warrior announcement sound
   */
  public async announceWarrior(warriorNumber: number): Promise<void> {
    await this.play(warriorNumber === 0 ? 'warriorOne' : 'warriorTwo');
  }

  /**
   * Play level announcement
   */
  public async announceLevel(level: number): Promise<void> {
    await this.play(level === 1 ? 'levelOne' : 'levelTwo');
  }

  /**
   * Enable/disable sound
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.currentSound) {
      this.currentSound.stop();
      this.currentSound = null;
    }
  }

  /**
   * Check if sound is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Stop all sounds
   */
  public stopAll(): void {
    this.sounds.forEach((sound) => sound.stop());
    this.currentSound = null;
  }
}

// Singleton instance
export const audioService = new AudioService();
