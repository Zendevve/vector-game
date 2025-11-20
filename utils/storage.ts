import { GameMode } from '../types';

const SCORES_KEY = 'vector_highscores_v1';
const SETTINGS_KEY = 'vector_settings_v1';

export interface HighScores {
  [GameMode.CLASSIC]: number;
  [GameMode.CHALLENGE]: number;
  [GameMode.LAVA]: number;
}

export interface GameSettings {
  volume: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

const DEFAULT_SCORES: HighScores = {
  [GameMode.CLASSIC]: 0,
  [GameMode.CHALLENGE]: 0,
  [GameMode.LAVA]: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  volume: 0.5,
  soundEnabled: true,
  hapticsEnabled: true,
};

export const getHighScores = (): HighScores => {
  try {
    const stored = localStorage.getItem(SCORES_KEY);
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
      localStorage.setItem(SCORES_KEY, JSON.stringify(newScores));
    } catch (e) {
      console.error('Failed to save score', e);
    }
    return newScores;
  }
  return currentScores;
};

export const getSettings = (): GameSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: GameSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};