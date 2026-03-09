export enum GameState {
  Loading = "loading",
  Start = "start",
  Playing = "playing",
  Paused = "paused",
  GameOver = "gameover"
}

export type PowerUpType = "magnet" | "boost" | "shield";

export type LaneIndex = 0 | 1 | 2;

export interface ScoreSnapshot {
  distance: number;
  coins: number;
  best: number;
}

export interface LeaderboardEntry {
  distance: number;
  coins: number;
  date: string;
}

export interface GameSettings {
  volume: number;
  quality: "high" | "medium" | "low";
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  slide: boolean;
}

export type EventMap = {
  stateChange: GameState;
  scoreUpdate: ScoreSnapshot;
  powerup: PowerUpType;
  combo: number;
};
