
import { GameMode } from '../types';
import { supabase } from './supabase';

const STORAGE_KEY = 'vector_highscores_v1';
const IDENTITY_KEY = 'vector_user_id_v1';

export interface HighScores {
  [GameMode.CLASSIC]: number;
  [GameMode.LAVA]: number;
}

const DEFAULT_SCORES: HighScores = {
  [GameMode.CLASSIC]: 0,
  [GameMode.LAVA]: 0,
};

// Get or create a persistent user ID for this browser
const getUserId = (): string => {
  let id = localStorage.getItem(IDENTITY_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(IDENTITY_KEY, id);
  }
  return id;
};

export const getHighScores = (): HighScores => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { 
        [GameMode.CLASSIC]: parsed[GameMode.CLASSIC] || 0,
        [GameMode.LAVA]: parsed[GameMode.LAVA] || 0,
      };
    }
  } catch (e) {
    console.error('Failed to load scores', e);
  }
  return DEFAULT_SCORES;
};

export const saveHighScore = (mode: GameMode, score: number): HighScores => {
  const currentScores = getHighScores();
  const userId = getUserId();

  // 1. Optimistic Local Update
  let newScores = { ...currentScores };
  if (score > (currentScores[mode] || 0)) {
    newScores = { ...currentScores, [mode]: score };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScores));
    } catch (e) {
      console.error('Failed to save local score', e);
    }
  }

  // 2. Async Supabase Sync
  // We send the score record regardless of whether it's a PB, to track history.
  // The function is synchronous to UI, but triggers async DB write.
  (async () => {
    try {
        // Don't attempt if no URL configured
        if (!supabase.supabaseUrl) return;

        await supabase
          .from('scores')
          .insert([
            { user_id: userId, mode: mode, score: score }
          ]);
    } catch (err) {
        console.warn('Supabase sync failed:', err);
    }
  })();

  return newScores;
};

// Syncs local storage with the best scores found in Supabase for this user
export const syncScoresFromCloud = async (): Promise<HighScores | null> => {
  const userId = getUserId();
  const currentLocal = getHighScores();
  
  if (!supabase.supabaseUrl) return null;

  try {
    // Fetch max scores for this user
    const { data, error } = await supabase
      .from('scores')
      .select('mode, score')
      .eq('user_id', userId);

    if (error) throw error;

    if (data && data.length > 0) {
       const cloudScores = { ...currentLocal };
       let changed = false;
       
       // Find max for each mode
       const maxClassic = Math.max(0, ...data.filter((r: any) => r.mode === GameMode.CLASSIC).map((r: any) => r.score));
       const maxLava = Math.max(0, ...data.filter((r: any) => r.mode === GameMode.LAVA).map((r: any) => r.score));

       if (maxClassic > cloudScores[GameMode.CLASSIC]) {
           cloudScores[GameMode.CLASSIC] = maxClassic;
           changed = true;
       }
       if (maxLava > cloudScores[GameMode.LAVA]) {
           cloudScores[GameMode.LAVA] = maxLava;
           changed = true;
       }

       if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudScores));
          return cloudScores;
       }
    }
  } catch (err) {
    console.warn('Failed to sync from cloud:', err);
  }
  
  return null;
};
