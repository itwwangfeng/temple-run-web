import type { GameSettings, GameState, LeaderboardEntry, ScoreSnapshot } from "./types";
import { loadLeaderboard, loadSettings, saveSettings, updateLeaderboard } from "./storage";

export class GameUI {
  private startScreen = document.getElementById("start-screen")!;
  private pauseScreen = document.getElementById("pause-screen")!;
  private gameoverScreen = document.getElementById("gameover-screen")!;
  private settingsScreen = document.getElementById("settings-screen")!;
  private leaderboardScreen = document.getElementById("leaderboard-screen")!;
  private hud = document.getElementById("hud")!;
  private tutorial = document.getElementById("tutorial")!;
  private loadingScreen = document.getElementById("loading-screen")!;

  private distanceEl = document.getElementById("hud-distance")!;
  private coinsEl = document.getElementById("hud-coins")!;
  private resultDistance = document.getElementById("result-distance")!;
  private resultCoins = document.getElementById("result-coins")!;
  private resultBest = document.getElementById("result-best")!;

  private leaderboardList = document.getElementById("leaderboard-list")!;

  private volumeRange = document.getElementById("volume-range") as HTMLInputElement;
  private qualitySelect = document.getElementById("quality-select") as HTMLSelectElement;

  onStart?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  onQuit?: () => void;
  onPause?: () => void;
  onSettingsChange?: (settings: GameSettings) => void;

  settings: GameSettings = loadSettings();

  constructor() {
    document.getElementById("start-btn")!.addEventListener("click", () => this.onStart?.());
    document.getElementById("resume-btn")!.addEventListener("click", () => this.onResume?.());
    document.getElementById("restart-btn")!.addEventListener("click", () => this.onRestart?.());
    document.getElementById("restart-btn-2")!.addEventListener("click", () => this.onRestart?.());
    document.getElementById("quit-btn")!.addEventListener("click", () => this.onQuit?.());
    document.getElementById("quit-btn-2")!.addEventListener("click", () => this.onQuit?.());
    document.getElementById("pause-btn")!.addEventListener("click", () => this.onPause?.());

    document.getElementById("settings-btn")!.addEventListener("click", () => this.showSettings());
    document.getElementById("settings-back")!.addEventListener("click", () => this.showStart());

    document.getElementById("leaderboard-btn")!.addEventListener("click", () => this.showLeaderboard());
    document.getElementById("leaderboard-back")!.addEventListener("click", () => this.showStart());

    this.volumeRange.value = String(this.settings.volume);
    this.qualitySelect.value = this.settings.quality;

    this.volumeRange.addEventListener("input", () => this.updateSettings());
    this.qualitySelect.addEventListener("change", () => this.updateSettings());
  }

  setLoading(progress: number) {
    const bar = document.querySelector(".loading-progress") as HTMLElement;
    const text = document.querySelector(".loading-text") as HTMLElement;
    bar.style.width = `${Math.round(progress * 100)}%`;
    text.textContent = progress >= 1 ? "加载完成" : "资源加载中...";
  }

  hideLoading() {
    this.loadingScreen.classList.add("hidden");
  }

  updateScore(snapshot: ScoreSnapshot) {
    this.distanceEl.textContent = String(snapshot.distance);
    this.coinsEl.textContent = String(snapshot.coins);
  }

  updateGameOver(snapshot: ScoreSnapshot) {
    this.resultDistance.textContent = String(snapshot.distance);
    this.resultCoins.textContent = String(snapshot.coins);
    this.resultBest.textContent = String(snapshot.best);
  }

  setState(state: GameState) {
    this.startScreen.classList.add("hidden");
    this.pauseScreen.classList.add("hidden");
    this.gameoverScreen.classList.add("hidden");
    this.settingsScreen.classList.add("hidden");
    this.leaderboardScreen.classList.add("hidden");

    if (state === "start") {
      this.showStart();
      return;
    }
    if (state === "paused") {
      this.pauseScreen.classList.remove("hidden");
    }
    if (state === "gameover") {
      this.gameoverScreen.classList.remove("hidden");
    }

    const hudVisible = state === "playing";
    this.hud.classList.toggle("hidden", !hudVisible);
    this.tutorial.classList.toggle("hidden", !hudVisible);
  }

  showStart() {
    this.startScreen.classList.remove("hidden");
    this.hud.classList.add("hidden");
    this.pauseScreen.classList.add("hidden");
    this.gameoverScreen.classList.add("hidden");
    this.settingsScreen.classList.add("hidden");
    this.leaderboardScreen.classList.add("hidden");
  }

  showSettings() {
    this.settingsScreen.classList.remove("hidden");
    this.startScreen.classList.add("hidden");
  }

  showLeaderboard() {
    const entries = loadLeaderboard();
    this.renderLeaderboard(entries);
    this.leaderboardScreen.classList.remove("hidden");
    this.startScreen.classList.add("hidden");
  }

  updateTutorialVisibility(active: boolean) {
    this.tutorial.classList.toggle("hidden", !active);
  }

  storeScore(snapshot: ScoreSnapshot) {
    const entries = updateLeaderboard(snapshot);
    return entries;
  }

  applyBestScore(snapshot: ScoreSnapshot, entries: LeaderboardEntry[]) {
    const best = entries.length ? entries[0].distance : snapshot.distance;
    return { ...snapshot, best };
  }

  private renderLeaderboard(entries: LeaderboardEntry[]) {
    this.leaderboardList.innerHTML = "";
    if (!entries.length) {
      const li = document.createElement("li");
      li.textContent = "暂无记录";
      this.leaderboardList.appendChild(li);
      return;
    }
    for (const entry of entries) {
      const li = document.createElement("li");
      const date = new Date(entry.date).toLocaleDateString();
      li.textContent = `${entry.distance}m · 金币 ${entry.coins} · ${date}`;
      this.leaderboardList.appendChild(li);
    }
  }

  private updateSettings() {
    this.settings = {
      volume: Number(this.volumeRange.value),
      quality: this.qualitySelect.value as GameSettings["quality"]
    };
    saveSettings(this.settings);
    this.onSettingsChange?.(this.settings);
  }
}
