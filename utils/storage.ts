
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

  // Optimistic Local Update
  let newScores = { ...currentScores };
  if (score > (currentScores[mode] || 0)) {
    newScores = { ...currentScores, [mode]: score };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newScores));
    } catch (e) {
      console.error('Failed to save local score', e);
    }
  }

  return newScores;
};
