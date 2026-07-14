import {
  AdditiveBlending,
  InstancedBufferAttribute,
  PointsNodeMaterial,
} from 'three/webgpu';
import {
  color,
  float,
  instancedBufferAttribute,
  length,
  mix,
  normalize,
  oneMinus,
  select,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

export interface ParticleNodeAttributes {
  origins: InstancedBufferAttribute;
  targets: InstancedBufferAttribute;
  seeds: InstancedBufferAttribute;
  sizes: InstancedBufferAttribute;
}

export interface ParticleNodeControls {
  time: { value: number };
  charge: { value: number };
  dissolve: { value: number };
  burstProgress: { value: number };
  mode: { value: number };
  opacity: { value: number };
}

export function createParticleNodeMaterial(
  attributes: ParticleNodeAttributes,
  kind: 'dust' | 'riser' | 'flare',
): { material: PointsNodeMaterial; controls: ParticleNodeControls } {
  const time = uniform(0);
  const charge = uniform(0);
  const dissolve = uniform(0);
  const burstProgress = uniform(0);
  const mode = uniform(0);
  const opacity = uniform(0);
  const origin = instancedBufferAttribute<'vec3'>(attributes.origins, 'vec3');
  const target = instancedBufferAttribute<'vec3'>(attributes.targets, 'vec3');
  const seed = instancedBufferAttribute<'float'>(attributes.seeds, 'float');
  const size = instancedBufferAttribute<'float'>(attributes.sizes, 'float');
  const gatherAmount = smoothstep(float(0), float(1), charge);
  const angle = seed.mul(Math.PI * 2).add(time.mul(0.55));
  const orbit = vec3(
    angle.cos().mul(oneMinus(gatherAmount).mul(0.18).add(0.025)),
    time.mul(1.7).add(seed.mul(9)).sin().mul(0.045),
    angle.sin().mul(oneMinus(gatherAmount).mul(0.12).add(0.018)),
  );
  const gathered = mix(origin, target, gatherAmount).add(orbit);
  const outward = normalize(vec3(gathered.x, float(0.5).add(seed.mul(0.4)), gathered.z));
  const dissolved = gathered.add(outward.mul(dissolve.mul(dissolve).mul(1.7)));

  const burstAngle = seed.mul(Math.PI * 2).add(time.mul(0.25));
  const releasePosition = vec3(
    burstAngle.cos().mul(burstProgress.mul(2.25)),
    float(0.18).add(seed.mul(0.75)).add(burstProgress.mul(1.7)),
    burstAngle.sin().mul(burstProgress.mul(1.1)),
  );
  const fillPosition = vec3(
    seed.sub(0.5).mul(1.15),
    float(-0.05).add(burstProgress.mul(2.75)).add(seed.mul(7).fract().mul(0.3)),
    seed.mul(13).fract().sub(0.5).mul(0.65),
  );
  const settleRadius = oneMinus(burstProgress).mul(0.65).add(0.08);
  const settlePosition = vec3(
    float(1.28).add(burstAngle.cos().mul(settleRadius)),
    float(3.04).add(burstAngle.sin().mul(settleRadius.mul(0.55))),
    seed.mul(17).fract().sub(0.5).mul(settleRadius),
  );
  const burstPosition = select(
    mode.equal(1),
    releasePosition,
    select(mode.equal(2), fillPosition, settlePosition),
  );
  const kindScale = kind === 'dust' ? float(0.72) : kind === 'riser' ? float(1.12) : float(2.1);
  const kindSpeed = kind === 'dust' ? float(0.72) : kind === 'riser' ? float(1.55) : float(0.18);
  const liftClock = time.mul(kindSpeed).mul(oneMinus(dissolve));
  const verticalLift = liftClock.add(seed.mul(13)).fract().mul(kind === 'flare' ? 0.18 : 3.6);
  const semanticGatherPosition = dissolved.add(vec3(
    time.mul(0.31).add(seed.mul(17)).sin().mul(kind === 'dust' ? 0.08 : 0.03),
    verticalLift,
    seed.mul(29).fract().sub(0.5).mul(kind === 'dust' ? 0.22 : 0.08),
  ));
  const renderPosition = select(mode.equal(0), semanticGatherPosition, burstPosition);

  const faceDistance = length(vec2(renderPosition.x.div(0.62), renderPosition.y.sub(3.55).div(0.48)));
  const faceSafety = mix(float(0.15), float(1), smoothstep(float(0.8), float(1.15), faceDistance));
  const chestDistance = length(vec2(renderPosition.x.div(0.82), renderPosition.y.sub(2.95).div(0.62)));
  const chestSafety = mix(float(0.18), float(1), smoothstep(float(0.82), float(1.2), chestDistance));
  const radial = length(uv().sub(vec2(0.5, 0.5)));
  const softEdge = oneMinus(smoothstep(float(0.12), float(0.5), radial));
  const twinkle = time.mul(2.7).add(seed.mul(19)).sin().mul(0.22).add(0.78);

  const material = new PointsNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    sizeAttenuation: false,
    blending: AdditiveBlending,
  });
  material.positionNode = renderPosition;
  material.sizeNode = size.mul(kindScale).mul(twinkle.mul(0.24).add(0.88));
  material.colorNode = kind === 'dust'
    ? mix(color(0xfffdf2), color(0xf4d8a5), seed.mul(0.45))
    : color(kind === 'riser' ? 0xfff8e8 : 0xffffff);
  material.opacityNode = softEdge.mul(opacity).mul(twinkle).mul(faceSafety).mul(chestSafety)
    .mul(kind === 'flare' ? smoothstep(float(0.58), float(1), twinkle) : 1);
  return { material, controls: { time, charge, dissolve, burstProgress, mode, opacity } };
}
