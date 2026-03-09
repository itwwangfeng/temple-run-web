import * as THREE from "three";
import { GAME_CONFIG } from "./config";

export class Runner {
  mesh: any;
  laneIndex = 1;
  targetLane = 1;
  y = 0;
  velocityY = 0;
  isSliding = false;
  slideTimer = 0;

  constructor() {
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.6, 1.2, 6, 12),
      new THREE.MeshStandardMaterial({ color: "#f1f5f9" })
    );
    body.position.y = 1.2;
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: "#ffb703" })
    );
    visor.position.set(0, 1.7, 0.5);
    this.mesh.add(body, visor);
    this.mesh.position.z = 2;
  }

  requestLaneChange(direction: number) {
    const next = Math.min(2, Math.max(0, this.targetLane + direction));
    this.targetLane = next;
  }

  jump() {
    if (this.y === 0 && !this.isSliding) {
      this.velocityY = GAME_CONFIG.jumpVelocity;
    }
  }

  slide() {
    if (this.y === 0 && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = GAME_CONFIG.slideDuration;
      this.mesh.scale.y = 0.6;
      this.mesh.position.y = 0;
    }
  }

  update(dt: number) {
    const targetX = GAME_CONFIG.lanes[this.targetLane];
    const dx = targetX - this.mesh.position.x;
    this.mesh.position.x += dx * Math.min(1, GAME_CONFIG.laneChangeSpeed * dt);

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.mesh.scale.y = 1;
      }
    }

    this.velocityY -= GAME_CONFIG.gravity * dt;
    this.y += this.velocityY * dt;
    if (this.y < 0) {
      this.y = 0;
      this.velocityY = 0;
    }
    this.mesh.position.y = this.y;
  }
}
