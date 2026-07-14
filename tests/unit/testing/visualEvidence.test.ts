import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import {
  bufferFromPngDataUrl,
  inspectSceneScreenshot,
  visualEvidencePasses,
} from '../../../scripts/testing/visual-evidence.mjs';

describe('visual evidence helpers', () => {
  it('detects visible highlights in a direct canvas capture', async () => {
    const dark = await sharp({
      create: { width: 128, height: 96, channels: 3, background: '#120a2d' },
    }).png().toBuffer();
    const visible = await sharp(dark)
      .composite([{
        input: {
          create: { width: 32, height: 32, channels: 3, background: '#f4eaff' },
        },
        left: 48,
        top: 32,
      }])
      .png()
      .toBuffer();

    expect((await inspectSceneScreenshot(dark, { crop: 'full' })).passed).toBe(false);
    expect((await inspectSceneScreenshot(visible, { crop: 'full' })).passed).toBe(true);
  });

  it('decodes a PNG canvas data URL', () => {
    const source = Buffer.from([1, 2, 3, 4]);
    const dataUrl = `data:image/png;base64,${source.toString('base64')}`;

    expect(bufferFromPngDataUrl(dataUrl)).toEqual(source);
    expect(() => bufferFromPngDataUrl('data:text/plain;base64,SGVsbG8=')).toThrow(/PNG/);
  });

  it('accepts direct canvas evidence when SafariDriver omits the accelerated layer', () => {
    expect(visualEvidencePasses({ passed: false }, { passed: true })).toBe(true);
    expect(visualEvidencePasses({ passed: true }, { passed: false })).toBe(true);
    expect(visualEvidencePasses({ passed: false }, { passed: false })).toBe(false);
  });
});
