import sharp from 'sharp';

export function bufferFromPngDataUrl(dataUrl) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('Canvas capture must be a base64 PNG data URL');
  return Buffer.from(match[1], 'base64');
}

export function visualEvidencePasses(pageEvidence, canvasEvidence) {
  return pageEvidence?.passed === true || canvasEvidence?.passed === true;
}

export async function inspectSceneScreenshot(imageBuffer, options = {}) {
  const metadata = await sharp(imageBuffer).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Screenshot has no measurable dimensions');

  const crop = options.crop === 'full'
    ? { left: 0, top: 0, width: metadata.width, height: metadata.height }
    : {
        left: Math.round(metadata.width * 0.15),
        top: Math.round(metadata.height * 0.05),
        width: Math.max(1, Math.round(metadata.width * 0.7)),
        height: Math.max(1, Math.round(metadata.height * 0.75)),
      };
  const { data, info } = await sharp(imageBuffer)
    .extract(crop)
    .resize(96, 96, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let brightPixels = 0;
  let maximumLuminance = 0;
  let luminanceTotal = 0;
  let squaredLuminanceTotal = 0;
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const luminance = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
    if (luminance >= 96) brightPixels += 1;
    maximumLuminance = Math.max(maximumLuminance, luminance);
    luminanceTotal += luminance;
    squaredLuminanceTotal += luminance * luminance;
  }
  const pixelCount = info.width * info.height;
  const meanLuminance = luminanceTotal / pixelCount;
  const luminanceDeviation = Math.sqrt(
    Math.max(0, squaredLuminanceTotal / pixelCount - meanLuminance * meanLuminance),
  );
  const brightPixelFraction = brightPixels / pixelCount;
  return {
    crop,
    sample: { width: info.width, height: info.height },
    brightPixelFraction,
    maximumLuminance,
    meanLuminance,
    luminanceDeviation,
    passed: brightPixelFraction >= 0.01 && maximumLuminance >= 96,
  };
}
