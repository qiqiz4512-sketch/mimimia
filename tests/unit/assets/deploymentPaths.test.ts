import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../../', import.meta.url);
const runtimeSources = [
  'src/assets/assetManifest.ts',
  'src/character/MagicalGirlRig.ts',
  'src/summon/MoonCatRig.ts',
  'src/main.ts',
] as const;

describe('public deployment paths', () => {
  it('keeps runtime assets relative to the deployed page directory', async () => {
    for (const sourcePath of runtimeSources) {
      const source = await readFile(new URL(sourcePath, projectRoot), 'utf8');
      expect(source, sourcePath).not.toMatch(/["']\/assets\//u);
    }
  });
});
