import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface LeaderboardEntry {
  id?: number;
  player_name: string | null;
  session_id: string;
  game_time: number;
  game_result: 'win' | 'loss';
  game_mode: 'solo' | 'multiplayer';
  difficulty_level: 1 | 2;
  created_at?: string;
}

export interface LeaderboardFilters {
  game_result: 'win' | 'loss';
  game_mode: 'solo' | 'multiplayer';
}

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
    
    // Initialize Supabase client if env vars are present
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.client = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('Supabase credentials not found. Leaderboard features will be disabled.');
    }
  }

  /**
   * Get or create a persistent session ID for anonymous tracking
   */
  private getOrCreateSessionId(): string {
    const STORAGE_KEY = 'dnd_labyrinth_session_id';
    
    let sessionId = localStorage.getItem(STORAGE_KEY);
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Check if Supabase is configured
   */
  public isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Submit a score to the leaderboard
   */
  public async submitScore(
    gameTime: number,
    gameResult: 'win' | 'loss',
    gameMode: 'solo' | 'multiplayer',
    difficultyLevel: 1 | 2,
    playerName?: string
  ): Promise<boolean> {
    if (!this.client) {
      console.warn('Cannot submit score: Supabase not configured');
      return false;
    }

    try {
      const entry: LeaderboardEntry = {
        player_name: playerName || null,
        session_id: this.sessionId,
        game_time: gameTime,
        game_result: gameResult,
        game_mode: gameMode,
        difficulty_level: difficultyLevel,
      };

      const { error } = await this.client
        .from('leaderboard')
        .insert(entry);

      if (error) {
        console.error('Error submitting score:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception submitting score:', error);
      return false;
    }
  }

  /**
   * Get fastest wins
   */
  public async getFastestWins(
    filters: LeaderboardFilters,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from('leaderboard')
        .select('*')
        .eq('game_result', filters.game_result)
        .eq('game_mode', filters.game_mode)
        .order('game_time', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching fastest wins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching fastest wins:', error);
      return [];
    }
  }

  /**
   * Get slowest wins
   */
  public async getSlowestWins(
    filters: LeaderboardFilters,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from('leaderboard')
        .select('*')
        .eq('game_result', filters.game_result)
        .eq('game_mode', filters.game_mode)
        .order('game_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching slowest wins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching slowest wins:', error);
      return [];
    }
  }

  /**
   * Get all leaderboards at once
   */
  public async getAllLeaderboards(
    gameMode: 'solo' | 'multiplayer'
  ): Promise<{
    fastestWins: LeaderboardEntry[];
    slowestWins: LeaderboardEntry[];
    fastestLosses: LeaderboardEntry[];
    longestLosses: LeaderboardEntry[];
  }> {
    const [fastestWins, slowestWins, fastestLosses, longestLosses] = await Promise.all([
      this.getFastestWins({ game_result: 'win', game_mode: gameMode }),
      this.getSlowestWins({ game_result: 'win', game_mode: gameMode }),
      this.getFastestWins({ game_result: 'loss', game_mode: gameMode }),
      this.getSlowestWins({ game_result: 'loss', game_mode: gameMode }),
    ]);

    return {
      fastestWins,
      slowestWins,
      fastestLosses,
      longestLosses,
    };
  }

  /**
   * Format time for display (milliseconds to readable format)
   */
  public static formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }
}

// Singleton instance
export const supabaseService = new SupabaseService();
