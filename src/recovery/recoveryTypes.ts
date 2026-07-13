export type GraphicsRecoveryStatus = 'healthy' | 'recovering' | 'failed';

export interface GraphicsDeviceLostInfo {
  api: string;
  message: string;
  reason: string | null;
  originalEvent?: unknown;
}

export interface GraphicsRecoverySnapshot {
  status: GraphicsRecoveryStatus;
  rebuildCount: number;
  lastIssue: GraphicsDeviceLostInfo | null;
  lastError: string | null;
}
