import * as THREE from "three";

export type GameAssets = {
  groundTexture: any;
  wallTexture: any;
  coinTexture: any;
  obstacleTexture: any;
};

function buildStripedTexture(colorA: string, colorB: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = colorB;
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(i * 16, 0, 8, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export async function loadAssets(onProgress?: (value: number) => void): Promise<GameAssets> {
  if (onProgress) onProgress(0.25);
  const groundTexture = buildStripedTexture("#4b3b2a", "#5c4632");
  if (onProgress) onProgress(0.55);
  const wallTexture = buildStripedTexture("#2b2b35", "#373740");
  if (onProgress) onProgress(0.75);
  const coinTexture = buildStripedTexture("#e4b53e", "#f1c75d");
  const obstacleTexture = buildStripedTexture("#3d1f1f", "#5a2b2b");
  if (onProgress) onProgress(1);
  return {
    groundTexture,
    wallTexture,
    coinTexture,
    obstacleTexture
  };
}
