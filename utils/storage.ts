import { GameMode } from '../types';

const STORAGE_KEY = 'vector_highscores_v1';

export interface HighScores {
  [GameMode.CLASSIC]: number;
  [GameMode.CHALLENGE]: number;
  [GameMode.LAVA]: number;
}

const DEFAULT_SCORES: HighScores = {
  [GameMode.CLASSIC]: 0,
  [GameMode.CHALLENGE]: 0,
  [GameMode.LAVA]: 0,
};

export const getHighScores = (): HighScores => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SCORES, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load scores', e);
  }
  return DEFAULT_SCORES;
};

export const saveHighScore = (mode: GameMode, score: number): HighScores => {
  const currentScores = getHighScores();
  if (score > currentScores[mode]) {
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