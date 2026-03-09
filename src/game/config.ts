export const GAME_CONFIG = {
  lanes: [-3, 0, 3],
  laneChangeSpeed: 12,
  jumpVelocity: 11,
  gravity: 28,
  slideDuration: 0.7,
  baseSpeed: 16,
  maxSpeed: 32,
  speedRamp: 0.015,
  segmentLength: 24,
  visibleSegments: 12,
  obstacleChance: 0.55,
  coinChance: 0.75,
  powerupChance: 0.08,
  magnetDuration: 6,
  boostDuration: 4,
  shieldDuration: 4,
  maxComboTime: 1.6
};

export type QualityLevel = "high" | "medium" | "low";
