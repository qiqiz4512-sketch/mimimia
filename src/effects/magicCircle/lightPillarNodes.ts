import { AdditiveBlending, MeshBasicNodeMaterial } from 'three/webgpu';
import {
  attribute,
  color,
  float,
  oneMinus,
  positionLocal,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';

export interface LightPillarNodeControls {
  opacity: { value: number };
  rise: { value: number };
  time: { value: number };
  convergence: { value: number };
}

export function createLightPillarNodeMaterial(layer: 0 | 1 | 2): {
  material: MeshBasicNodeMaterial;
  controls: LightPillarNodeControls;
} {
  const opacity = uniform(0);
  const rise = uniform(0);
  const time = uniform(0);
  const convergence = uniform(0);
  const uv = attribute<'vec2'>('pillarUv', 'vec2');
  const seed = attribute<'float'>('pillarSeed', 'float');
  const intensity = attribute<'float'>('pillarIntensity', 'float');
  const centerX = attribute<'float'>('pillarCenterX', 'float');
  const horizontal = oneMinus(smoothstep(float(0.05), float(0.5), uv.x.sub(0.5).abs()));
  const vertical = smoothstep(float(0), float(0.08), uv.y)
    .mul(oneMinus(smoothstep(rise.sub(0.28), rise, uv.y)));
  const bands = uv.y.mul(17).sub(time.mul(1.7)).add(seed.mul(11)).sin().mul(0.16).add(0.84);
  const wisps = uv.y.mul(31).add(time.mul(0.63)).add(seed.mul(23)).sin().mul(0.09).add(0.91);
  const layerOpacity = [1, 0.42, 0.18][layer];
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const convergenceScale = oneMinus(convergence.mul(0.18));
  const breath = time.mul(0.48).add(seed.mul(17)).sin().mul(0.025).add(1);
  const sway = time.mul(0.42).add(seed.mul(23)).sin().mul(0.018).mul(uv.y);
  const breathedX = centerX.add(positionLocal.x.sub(centerX).mul(breath));
  material.positionNode = vec3(
    breathedX.mul(convergenceScale).add(sway),
    positionLocal.y,
    positionLocal.z.mul(convergenceScale),
  );
  material.colorNode = layer === 0 ? color(0xfffdf2) : color(0xf4d8a5);
  material.opacityNode = horizontal.mul(vertical).mul(bands).mul(wisps)
    .mul(opacity).mul(intensity).mul(layerOpacity);
  return { material, controls: { opacity, rise, time, convergence } };
}
