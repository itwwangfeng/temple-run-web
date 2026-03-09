import "./style.css";
import { Game } from "./game/game";
import { GameUI } from "./game/ui";
import { GameState, type ScoreSnapshot } from "./game/types";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const ui = new GameUI();
const game = new Game(canvas);

let tutorialTimer: number | null = null;

ui.onStart = () => {
  ui.setState(GameState.Playing);
  game.start(ui.settings);
  if (tutorialTimer) window.clearTimeout(tutorialTimer);
  ui.updateTutorialVisibility(true);
  tutorialTimer = window.setTimeout(() => ui.updateTutorialVisibility(false), 10000);
};

ui.onResume = () => {
  ui.setState(GameState.Playing);
  game.resume();
};

ui.onRestart = () => {
  ui.setState(GameState.Playing);
  game.start(ui.settings);
};

ui.onQuit = () => {
  game.stop();
  ui.showStart();
};

ui.onPause = () => {
  game.pause();
};

ui.onSettingsChange = (settings) => {
  game.updateSettings(settings);
};

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    game.pause();
  }
});

game.on("stateChange", (state: GameState) => {
  ui.setState(state);
  if (state === GameState.GameOver) {
    const snapshot = game.getSnapshot();
    const entries = ui.storeScore(snapshot);
    const updated = ui.applyBestScore(snapshot, entries);
    ui.updateGameOver(updated);
  }
});

game.on("scoreUpdate", (snapshot: ScoreSnapshot) => {
  ui.updateScore(snapshot);
});

game
  .load((progress) => ui.setLoading(progress))
  .then(() => ui.hideLoading())
  .catch((error) => {
    console.error(error);
    alert("资源加载失败，请刷新重试");
  });
