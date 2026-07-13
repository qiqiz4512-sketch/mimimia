import { Color, Scene } from 'three/webgpu';

import type { FrameSignals } from '../app/frameSignals';
import type { QualityTier } from '../quality/qualityProfiles';
import { CameraRig } from './CameraRig';
import { createProceduralBackdrop } from './proceduralBackdrop';

export class Stage {
  readonly scene = new Scene();
  readonly cameraRig = new CameraRig();
  readonly #backdrop = createProceduralBackdrop();

  constructor() {
    this.scene.background = new Color(0x0a061b);
    this.scene.add(this.#backdrop.group);
  }

  update(signals: FrameSignals, quality: QualityTier): void {
    if (signals.state === 'charging' || signals.state === 'charged') {
      this.cameraRig.setChargeProgress(signals.charge);
    } else if (signals.state === 'dissolving') {
      this.cameraRig.setDissolveProgress(signals.dissolve);
    } else if (signals.state === 'summoning') {
      this.cameraRig.setSummonProgress(signals.summon);
    } else {
      this.cameraRig.reset();
    }
    this.#backdrop.update(signals.nowMs, quality);
  }

  resize(width: number, height: number): void {
    this.cameraRig.resize(width, height);
  }

  dispose(): void {
    this.#backdrop.dispose();
    this.scene.clear();
  }
}
