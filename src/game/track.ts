import * as THREE from "three";
import { GAME_CONFIG } from "./config";
import type { PowerUpType } from "./types";
import type { GameAssets } from "./assets";

export type TrackItemType = "obstacle" | "coin" | "powerup";

export type TrackItem = {
  mesh: any;
  type: TrackItemType;
  lane: number;
  z: number;
  powerupType?: PowerUpType;
};

export class Track {
  group: any;
  private segments: any[] = [];
  private items: TrackItem[] = [];
  private assets: GameAssets;

  constructor(assets: GameAssets) {
    this.group = new THREE.Group();
    this.assets = assets;

    for (let i = 0; i < GAME_CONFIG.visibleSegments; i += 1) {
      const segment = this.createSegment(i);
      segment.position.z = -i * GAME_CONFIG.segmentLength;
      this.segments.push(segment);
      this.group.add(segment);
    }
  }

  update(dt: number, speed: number) {
    const move = speed * dt;
    for (const segment of this.segments) {
      segment.position.z += move;
      if (segment.position.z > GAME_CONFIG.segmentLength) {
        segment.position.z -= GAME_CONFIG.segmentLength * GAME_CONFIG.visibleSegments;
        this.populateSegment(segment);
      }
    }

    for (const item of this.items) {
      item.z += move;
    }

    this.items = this.items.filter((item) => item.z < GAME_CONFIG.segmentLength * 2 && item.mesh.visible);
  }

  getItems() {
    return this.items;
  }

  reset() {
    let index = 0;
    for (const segment of this.segments) {
      segment.position.z = -index * GAME_CONFIG.segmentLength;
      this.populateSegment(segment, true);
      index += 1;
    }
  }

  private createSegment(index: number) {
    const segment = new THREE.Group();
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1, GAME_CONFIG.segmentLength),
      new THREE.MeshStandardMaterial({
        map: this.assets.groundTexture
      })
    );
    floor.position.y = -0.5;
    floor.receiveShadow = true;

    const wallMaterial = new THREE.MeshStandardMaterial({ map: this.assets.wallTexture });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, GAME_CONFIG.segmentLength), wallMaterial);
    leftWall.position.set(-6, 1.5, 0);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5, GAME_CONFIG.segmentLength), wallMaterial);
    rightWall.position.set(6, 1.5, 0);

    segment.add(floor, leftWall, rightWall);
    this.populateSegment(segment, index < 2);
    return segment;
  }

  private populateSegment(segment: any, safe = false) {
    while (segment.children.length > 3) {
      const child = segment.children[segment.children.length - 1];
      segment.remove(child);
    }
    this.items = this.items.filter((item) => item.mesh.parent !== segment);

    const segmentZ = segment.position.z;

    if (safe) return;

    const items: TrackItem[] = [];
    for (let lane = 0; lane < 3; lane += 1) {
      const roll = Math.random();
      if (roll < GAME_CONFIG.obstacleChance) {
        const kind = Math.random() > 0.55 ? "high" : "low";
        const obstacle = this.createObstacle(kind);
        obstacle.position.set(GAME_CONFIG.lanes[lane], kind === "high" ? 2.2 : 0, 0);
        segment.add(obstacle);
        items.push({ mesh: obstacle, type: "obstacle", lane, z: segmentZ });
      } else if (roll < GAME_CONFIG.obstacleChance + GAME_CONFIG.coinChance) {
        const coin = this.createCoin();
        coin.position.set(GAME_CONFIG.lanes[lane], 1.2, 0);
        segment.add(coin);
        items.push({ mesh: coin, type: "coin", lane, z: segmentZ });
      }
    }

    if (Math.random() < GAME_CONFIG.powerupChance) {
      const lane = Math.floor(Math.random() * 3);
      const powerupType = this.randomPowerup();
      const powerup = this.createPowerup(powerupType);
      powerup.position.set(GAME_CONFIG.lanes[lane], 1.4, 0);
      segment.add(powerup);
      items.push({ mesh: powerup, type: "powerup", lane, z: segmentZ, powerupType });
    }

    this.items.push(...items);
  }

  private createObstacle(kind: "high" | "low") {
    const geometry = kind === "high" ? new THREE.BoxGeometry(2.2, 0.8, 1.6) : new THREE.BoxGeometry(1.8, 2.4, 1.8);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: this.assets.obstacleTexture }));
    mesh.castShadow = true;
    mesh.userData.kind = kind;
    return mesh;
  }

  private createCoin() {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.2, 18),
      new THREE.MeshStandardMaterial({ map: this.assets.coinTexture, emissive: new THREE.Color("#ffdd55") })
    );
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  private createPowerup(type: PowerUpType) {
    const color = type === "magnet" ? "#3a86ff" : type === "boost" ? "#f72585" : "#80ed99";
    return new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.7, 0),
      new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color) })
    );
  }

  private randomPowerup(): PowerUpType {
    const list: PowerUpType[] = ["magnet", "boost", "shield"];
    return list[Math.floor(Math.random() * list.length)];
  }
}
