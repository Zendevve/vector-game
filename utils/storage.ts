
import { GameMode } from '../types';

const STORAGE_KEY = 'vector_highscores_v1';

export interface HighScores {
  [GameMode.CLASSIC]: number;
  [GameMode.LAVA]: number;
}

const DEFAULT_SCORES: HighScores = {
  [GameMode.CLASSIC]: 0,
  [GameMode.LAVA]: 0,
};

export const getHighScores = (): HighScores => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Merge with default to handle missing keys if schema changes
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
  if (score > (currentScores[mode] || 0)) {
    const newScores = { ...currentScores, [mode]: score };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScores));
    } catch (e) {
      console.error('Failed to save score', e);
    }
    return newScores;
  }
  return currentScores;
};
