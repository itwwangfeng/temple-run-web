import type { GameSettings, LeaderboardEntry, ScoreSnapshot } from "./types";

const SETTINGS_KEY = "temple_run_settings_v1";
const LEADERBOARD_KEY = "temple_run_leaderboard_v1";

export function loadSettings(): GameSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { volume: 0.7, quality: "high" };
  }
  try {
    const parsed = JSON.parse(raw) as GameSettings;
    return {
      volume: clamp(parsed.volume, 0, 1),
      quality: parsed.quality ?? "high"
    };
  } catch {
    return { volume: 0.7, quality: "high" };
  }
}

export function saveSettings(settings: GameSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 10)));
}

export function updateLeaderboard(snapshot: ScoreSnapshot) {
  const entries = loadLeaderboard();
  entries.push({
    distance: snapshot.distance,
    coins: snapshot.coins,
    date: new Date().toISOString()
  });
  entries.sort((a, b) => b.distance - a.distance);
  saveLeaderboard(entries);
  return entries;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
