export type AssetKind = 'character' | 'sound' | 'music' | 'material' | 'decoration';

export interface AssetManifestEntry {
  id: string;
  url: string;
  kind: AssetKind;
  critical: boolean;
  bytes: number;
  retryCount: number;
}

export interface LoadedAssets {
  status: 'success' | 'critical-failure' | 'aborted';
  assets: Map<string, Uint8Array>;
  muted: boolean;
  skipped: string[];
  failed: string[];
}

export type AssetProgressHandler = (progress: number) => void;
