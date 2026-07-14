import { AdditiveBlending, MeshBasicNodeMaterial } from 'three/webgpu';
import { attribute, color, float, fract, mix, oneMinus, smoothstep, step, uniform } from 'three/tsl';

export interface MagicCircleNodeControls {
  progress: { value: number };
  opacity: { value: number };
  brightness: { value: number };
  flow: { value: number };
  flash: { value: number };
  microMarkFraction: { value: number };
  orbitLightCount: { value: number };
  fieldProgress: { value: number };
  dissolveProgress: { value: number };
}

export function createMagicCircleNodeMaterial(options: { variant: 'core' | 'halo' }) {
  const progress = uniform(0);
  const opacity = uniform(0);
  const brightness = uniform(1);
  const flow = uniform(0);
  const flash = uniform(0);
  const microMarkFraction = uniform(1);
  const orbitLightCount = uniform(6);
  const fieldProgress = uniform(0);
  const dissolveProgress = uniform(0);
  const strokeDraw = attribute<'vec4'>('strokeDraw', 'vec4');
  const strokeMotion = attribute<'vec4'>('strokeMotion', 'vec4');
  const strokeLifecycle = attribute<'vec2'>('strokeLifecycle', 'vec2');
  const arc = strokeDraw.x;
  const localArc = strokeDraw.y;
  const edge = strokeDraw.z;
  const role = strokeDraw.w;
  const microRank = strokeMotion.x;
  const orbitBase = strokeMotion.y;
  const flowSpeed = strokeMotion.z;
  const fieldChannel = strokeLifecycle.x;
  const dissolveRank = strokeLifecycle.y;
  const channelProgress = mix(progress, fieldProgress, fieldChannel);
  const draw = oneMinus(smoothstep(channelProgress, channelProgress.add(0.025), arc));
  const roleFade = mix(float(1), float(0.52), role);
  const flowBand = localArc.mul(18).sub(flow.mul(flowSpeed)).sin().mul(0.08).add(0.92);
  const microVisibility = step(microRank, microMarkFraction);
  const dissolveVisibility = oneMinus(smoothstep(dissolveRank, dissolveRank.add(0.12), dissolveProgress));
  const isOrbit = step(float(0), orbitBase);
  const movingArc = fract(localArc.sub(flow.mul(flowSpeed).mul(0.06)));
  const orbitPointA = oneMinus(smoothstep(float(0.018), float(0.055), movingArc.sub(0.25).abs()))
    .mul(step(orbitBase.add(1), orbitLightCount));
  const orbitPointB = oneMinus(smoothstep(float(0.018), float(0.055), movingArc.sub(0.75).abs()))
    .mul(step(orbitBase.add(2), orbitLightCount));
  const orbitGlow = isOrbit.mul(orbitPointA.add(orbitPointB));
  const haloInnerEdge = mix(float(0.06), float(0.38), fieldProgress);
  const edgeFade = options.variant === 'halo'
    ? oneMinus(smoothstep(haloInnerEdge, float(1), edge))
    : oneMinus(smoothstep(float(0.72), float(1), edge));
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  material.colorNode = options.variant === 'core'
    ? mix(color(0xfffdf2), color(0xf4d8a5), role.mul(0.38)).mul(brightness.add(flash))
    : color(0xf4d8a5).mul(brightness.mul(0.58).add(flash.mul(0.45)));
  material.opacityNode = draw.mul(opacity).mul(roleFade).mul(flowBand.add(orbitGlow.mul(1.4)))
    .mul(edgeFade).mul(microVisibility).mul(dissolveVisibility)
    .mul(options.variant === 'halo' ? 0.42 : 1);
  return {
    material,
    controls: {
      progress,
      opacity,
      brightness,
      flow,
      flash,
      microMarkFraction,
      orbitLightCount,
      fieldProgress,
      dissolveProgress,
    },
  };
}
