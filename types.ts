
export enum ViewState {
  MENU = 'MENU',
  GAME = 'GAME',
  GAME_OVER = 'GAME_OVER',
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  LAVA = 'LAVA',
  FRAGILE = 'FRAGILE',
}

export interface TileData {
  id: number;
  type: TileType;
}

export enum TileType {
  EMPTY = 'EMPTY',
  PLAYER = 'PLAYER',
  TARGET = 'TARGET',
  WALL = 'WALL',
}

export interface HighScore {
  score: number;
  date: string;
}