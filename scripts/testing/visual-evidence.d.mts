export interface VisualEvidence {
  readonly passed: boolean;
  readonly [key: string]: unknown;
}

export function bufferFromPngDataUrl(dataUrl: string): Uint8Array;

export function inspectSceneScreenshot(
  imageBuffer: Uint8Array,
  options?: { crop?: 'full' },
): Promise<VisualEvidence>;

export function visualEvidencePasses(
  pageEvidence: VisualEvidence | null | undefined,
  canvasEvidence: VisualEvidence | null | undefined,
): boolean;
