import { BufferAttribute, BufferGeometry } from 'three/webgpu';

const PILLARS = [
  { x: 0, z: -0.52, width: 0.56, height: 4.8, seed: 0.13, intensity: 1 },
  { x: -1.15, z: -0.18, width: 0.42, height: 3.8, seed: 0.37, intensity: 0.78 },
  { x: 1.08, z: -0.08, width: 0.46, height: 4.2, seed: 0.59, intensity: 0.85 },
  { x: -1.82, z: 0.22, width: 0.34, height: 3.1, seed: 0.76, intensity: 0.62 },
  { x: 1.72, z: 0.28, width: 0.36, height: 3.4, seed: 0.91, intensity: 0.68 },
] as const;

export function createLightPillarGeometry(widthScale: number, heightScale: number): BufferGeometry {
  const positions: number[] = [];
  const pillarUv: number[] = [];
  const pillarSeed: number[] = [];
  const pillarIntensity: number[] = [];
  const pillarCenterX: number[] = [];
  const indices: number[] = [];

  for (const pillar of PILLARS) {
    const half = pillar.width * widthScale * 0.5;
    const base = positions.length / 3;
    positions.push(
      pillar.x - half, 0, pillar.z,
      pillar.x + half, 0, pillar.z,
      pillar.x - half, pillar.height * heightScale, pillar.z,
      pillar.x + half, pillar.height * heightScale, pillar.z,
    );
    pillarUv.push(0, 0, 1, 0, 0, 1, 1, 1);
    pillarSeed.push(pillar.seed, pillar.seed, pillar.seed, pillar.seed);
    pillarIntensity.push(pillar.intensity, pillar.intensity, pillar.intensity, pillar.intensity);
    pillarCenterX.push(pillar.x, pillar.x, pillar.x, pillar.x);
    indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }

  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('pillarUv', new BufferAttribute(new Float32Array(pillarUv), 2));
  geometry.setAttribute('pillarSeed', new BufferAttribute(new Float32Array(pillarSeed), 1));
  geometry.setAttribute('pillarIntensity', new BufferAttribute(new Float32Array(pillarIntensity), 1));
  geometry.setAttribute('pillarCenterX', new BufferAttribute(new Float32Array(pillarCenterX), 1));
  geometry.computeBoundingSphere();
  return geometry;
}
