#!/usr/bin/env node

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PROFILES = {
  'magical-girl': { maxEdge: 3072 },
  'moon-cat': { maxEdge: 1536 },
};

for (const [character, profile] of Object.entries(PROFILES)) {
  const sourceRoot = path.join(ROOT, 'art/source', character);
  const outputRoot = path.join(ROOT, 'public/assets/characters', character);
  const rig = JSON.parse(await readFile(path.join(sourceRoot, 'rig.json'), 'utf8'));
  const scale = Math.min(1, profile.maxEdge / Math.max(rig.canvas.width, rig.canvas.height));
  const width = Math.round(rig.canvas.width * scale);
  const height = Math.round(rig.canvas.height * scale);
  const sourceFiles = (await readdir(path.join(sourceRoot, 'layers')))
    .filter((name) => name.endsWith('.png'))
    .sort();

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  for (const sourceFile of sourceFiles) {
    const outputFile = sourceFile.replace(/\.png$/u, '.webp');
    const outputPath = path.join(outputRoot, outputFile);
    await sharp(path.join(sourceRoot, 'layers', sourceFile))
      .resize(width, height, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
      .webp({ lossless: true, effort: 6, alphaQuality: 100 })
      .toFile(outputPath);
    const metadata = await sharp(outputPath).metadata();
    if (metadata.width !== width || metadata.height !== height || metadata.hasAlpha !== true) {
      throw new Error(`${character}/${outputFile} 导出后尺寸或透明通道不正确`);
    }
  }

  const runtimeRig = {
    ...rig,
    canvas: { width, height },
    sourceCanvas: rig.canvas,
    runtimeScale: scale,
    layers: rig.layers.map((layer) => ({
      ...layer,
      path: layer.path.replace(/^layers\//u, '').replace(/\.png$/u, '.webp'),
    })),
  };
  await writeFile(path.join(outputRoot, 'rig.json'), `${JSON.stringify(runtimeRig, null, 2)}\n`);
  console.log(`${character}: ${sourceFiles.length} 层，${width}×${height}，无损透明 WebP。`);
}
