import * as THREE from "three";
import { GAME_CONFIG, type QualityLevel } from "./config";
import { EventBus } from "./eventBus";
import { InputManager } from "./input";
import { Runner } from "./runner";
import { Track } from "./track";
import { AudioManager } from "./audio";
import { loadAssets, type GameAssets } from "./assets";
import { GameState, type GameSettings, type PowerUpType, type ScoreSnapshot } from "./types";

export class Game {
  private renderer: any;
  private scene: any;
  private camera: any;
  private clock = new THREE.Clock();
  private input = new InputManager();
  private runner = new Runner();
  private track?: Track;
  private assets?: GameAssets;
  private eventBus = new EventBus();
  private audio = new AudioManager();

  private state: GameState = GameState.Loading;
  private speed = GAME_CONFIG.baseSpeed;
  private distance = 0;
  private coins = 0;
  private combo = 0;
  private comboTimer = 0;
  private powerups: Record<PowerUpType, number> = {
    magnet: 0,
    boost: 0,
    shield: 0
  };

  constructor(private canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog("#111018", 10, 80);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 6, 12);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", this.onResize);
    this.scene.add(this.runner.mesh);

    this.setupLights();
  }

  async load(onProgress?: (value: number) => void) {
    this.assets = await loadAssets(onProgress);
    this.track = new Track(this.assets);
    this.scene.add(this.track.group);
    this.setState(GameState.Start);
  }

  on(event: Parameters<EventBus["on"]>[0], handler: any) {
    return this.eventBus.on(event as any, handler);
  }

  start(settings: GameSettings) {
    this.audio.setVolume(settings.volume);
    this.applyQuality(settings.quality);
    this.resetRun();
    this.setState(GameState.Playing);
    this.clock.start();
    this.loop();
  }

  pause() {
    if (this.state !== GameState.Playing) return;
    this.setState(GameState.Paused);
  }

  resume() {
    if (this.state !== GameState.Paused) return;
    this.setState(GameState.Playing);
    this.clock.start();
  }

  stop() {
    this.setState(GameState.Start);
  }

  setState(state: GameState) {
    this.state = state;
    this.eventBus.emit("stateChange", state);
  }

  updateSettings(settings: GameSettings) {
    this.audio.setVolume(settings.volume);
    this.applyQuality(settings.quality);
  }

  private applyQuality(level: QualityLevel) {
    const pixelRatio = level === "high" ? 2 : level === "medium" ? 1.5 : 1;
    this.renderer.setPixelRatio(Math.min(pixelRatio, window.devicePixelRatio));
  }

  private resetRun() {
    this.speed = GAME_CONFIG.baseSpeed;
    this.distance = 0;
    this.coins = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.runner.mesh.position.set(0, 0, 2);
    this.runner.laneIndex = 1;
    this.runner.targetLane = 1;
    this.powerups = { magnet: 0, boost: 0, shield: 0 };
    this.track?.reset();
    this.eventBus.emit("scoreUpdate", this.snapshot());
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight("#707070", 0.6);
    const directional = new THREE.DirectionalLight("#fef1b5", 1.1);
    directional.position.set(6, 12, 6);
    directional.castShadow = true;
    directional.shadow.mapSize.set(1024, 1024);
    this.scene.add(ambient, directional);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private loop = () => {
    if (this.state === GameState.Playing) {
      const dt = Math.min(0.04, this.clock.getDelta());
      this.update(dt);
    }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const { left, right } = this.input.state;
    if (left) {
      this.runner.requestLaneChange(-1);
      this.input.state.left = false;
    }
    if (right) {
      this.runner.requestLaneChange(1);
      this.input.state.right = false;
    }

    const actions = this.input.consumeActions();
    if (actions.jump) this.runner.jump();
    if (actions.slide) this.runner.slide();

    this.runner.update(dt);
    this.speed = Math.min(GAME_CONFIG.maxSpeed, this.speed + GAME_CONFIG.speedRamp * this.speed);
    const speedBoost = this.powerups.boost > 0 ? 1.5 : 1;
    const moveSpeed = this.speed * speedBoost;

    this.distance += moveSpeed * dt;
    this.track?.update(dt, moveSpeed);

    this.updatePowerups(dt);
    this.checkCollisions();
    this.updateCamera(dt);

    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.combo = 0;
    }

    this.eventBus.emit("scoreUpdate", this.snapshot());
  }

  private updateCamera(dt: number) {
    const target = new THREE.Vector3(
      this.runner.mesh.position.x,
      5 + this.runner.mesh.position.y,
      10
    );
    this.camera.position.lerp(target, 1 - Math.pow(0.001, dt));
    this.camera.lookAt(this.runner.mesh.position.x, 2, -8);
  }

  private updatePowerups(dt: number) {
    (Object.keys(this.powerups) as PowerUpType[]).forEach((type) => {
      if (this.powerups[type] > 0) {
        this.powerups[type] = Math.max(0, this.powerups[type] - dt);
      }
    });
  }

  private checkCollisions() {
    const items = this.track?.getItems() ?? [];
    for (const item of items) {
      const dz = Math.abs(item.z);
      if (dz > 1.6) continue;
      if (item.lane !== this.runner.targetLane) continue;

      if (item.type === "obstacle") {
        const kind = item.mesh.userData.kind as "high" | "low" | undefined;
        if (kind === "low" && this.runner.y > 1.1) {
          this.removeItem(item);
          continue;
        }
        if (kind === "high" && this.runner.isSliding) {
          this.removeItem(item);
          continue;
        }
        if (this.powerups.shield > 0) {
          this.powerups.shield = 0;
          this.removeItem(item);
          return;
        }
        this.audio.playHit();
        this.setState(GameState.GameOver);
        return;
      }

      if (item.type === "coin") {
        this.coins += 1;
        this.combo += 1;
        this.comboTimer = GAME_CONFIG.maxComboTime;
        this.audio.playCoin();
        this.removeItem(item);
        continue;
      }

      if (item.type === "powerup" && item.powerupType) {
        this.activatePowerup(item.powerupType);
        this.audio.playPowerup();
        this.removeItem(item);
      }
    }

    if (this.powerups.magnet > 0) {
      for (const item of items) {
        if (item.type !== "coin") continue;
        if (Math.abs(item.z) > 6) continue;
        if (Math.abs(item.lane - this.runner.targetLane) > 1) continue;
        this.coins += 1;
        this.combo += 1;
        this.comboTimer = GAME_CONFIG.maxComboTime;
        this.audio.playCoin();
        this.removeItem(item);
      }
    }
  }

  private removeItem(item: { mesh: any }) {
    item.mesh.visible = false;
  }

  private activatePowerup(type: PowerUpType) {
    switch (type) {
      case "magnet":
        this.powerups.magnet = GAME_CONFIG.magnetDuration;
        break;
      case "boost":
        this.powerups.boost = GAME_CONFIG.boostDuration;
        break;
      case "shield":
        this.powerups.shield = GAME_CONFIG.shieldDuration;
        break;
    }
    this.eventBus.emit("powerup", type);
  }

  private snapshot(): ScoreSnapshot {
    return {
      distance: Math.floor(this.distance),
      coins: this.coins,
      best: 0
    };
  }

  getSnapshot(): ScoreSnapshot {
    return this.snapshot();
  }
}
