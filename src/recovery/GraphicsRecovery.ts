import type { GraphicsDeviceLostInfo, GraphicsRecoverySnapshot } from './recoveryTypes';

export interface GraphicsRendererPort {
  onDeviceLost: (info: GraphicsDeviceLostInfo) => void;
}

export interface GraphicsRecoveryOptions {
  canvas: EventTarget | (() => EventTarget);
  getRenderer: () => GraphicsRendererPort | null;
  rebuildRuntime: () => Promise<void>;
  onLoss?: (issue: GraphicsDeviceLostInfo) => void;
  onStateChange?: (snapshot: GraphicsRecoverySnapshot) => void;
  onFailure?: (error: unknown) => void;
}

const webGlIssue = (event: Event): GraphicsDeviceLostInfo => ({
  api: 'WebGL',
  message: 'Graphics context lost',
  reason: null,
  originalEvent: event,
});

export class GraphicsRecovery {
  readonly #options: GraphicsRecoveryOptions;
  #watchedRenderer: GraphicsRendererPort | null = null;
  #originalDeviceLost: GraphicsRendererPort['onDeviceLost'] | null = null;
  #watchedCanvas: EventTarget | null = null;
  #disposed = false;
  #rebuildPromise: Promise<void> | null = null;
  #rebuilding = false;
  #pendingWebGlIssue: GraphicsDeviceLostInfo | null = null;
  #snapshot: GraphicsRecoverySnapshot = {
    status: 'healthy',
    rebuildCount: 0,
    lastIssue: null,
    lastError: null,
  };

  constructor(options: GraphicsRecoveryOptions) {
    this.#options = options;
  }

  watch(): void {
    if (this.#disposed) return;
    const canvas = typeof this.#options.canvas === 'function' ? this.#options.canvas() : this.#options.canvas;
    if (canvas !== this.#watchedCanvas) {
      this.#removeCanvasListeners();
      this.#watchedCanvas = canvas;
      canvas.addEventListener('webglcontextlost', this.#onContextLost);
      canvas.addEventListener('webglcontextrestored', this.#onContextRestored);
    }
    const renderer = this.#options.getRenderer();
    if (!renderer || renderer === this.#watchedRenderer) return;
    this.#restoreRendererCallback();
    this.#watchedRenderer = renderer;
    this.#originalDeviceLost = renderer.onDeviceLost;
    renderer.onDeviceLost = this.#onDeviceLost;
  }

  rebuild(issue: GraphicsDeviceLostInfo = {
    api: 'Unknown', message: 'Render loop failure', reason: null,
  }): Promise<void> {
    if (this.#disposed) return Promise.resolve();
    if (this.#rebuildPromise) return this.#rebuildPromise;
    this.#markRecovering(issue);
    this.#rebuilding = true;
    this.#pendingWebGlIssue = null;
    // Detach before intentionally disposing the failed renderer so its own
    // shutdown callback cannot be mistaken for a second device loss.
    this.#restoreRendererCallback();
    this.#removeCanvasListeners();
    this.#rebuildPromise = Promise.resolve()
      .then(() => this.#options.rebuildRuntime())
      .then(() => {
        this.#snapshot = {
          ...this.#snapshot,
          status: 'healthy',
          rebuildCount: this.#snapshot.rebuildCount + 1,
          lastError: null,
        };
        this.watch();
        this.#emit();
      })
      .catch((error: unknown) => {
        this.#snapshot = {
          ...this.#snapshot,
          status: 'failed',
          lastError: error instanceof Error ? error.message : String(error),
        };
        this.#emit();
        this.#options.onFailure?.(error);
      })
      .finally(() => {
        this.#rebuilding = false;
        this.#rebuildPromise = null;
      });
    return this.#rebuildPromise;
  }

  whenSettled(): Promise<void> {
    return this.#rebuildPromise ?? Promise.resolve();
  }

  getSnapshot(): GraphicsRecoverySnapshot {
    return {
      ...this.#snapshot,
      lastIssue: this.#snapshot.lastIssue ? { ...this.#snapshot.lastIssue } : null,
    };
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#removeCanvasListeners();
    this.#restoreRendererCallback();
  }

  readonly #onDeviceLost = (info: GraphicsDeviceLostInfo): void => {
    if (this.#rebuilding) return;
    if (info.api === 'WebGL') {
      this.#pendingWebGlIssue = info;
      this.#markRecovering(info);
    } else {
      void this.rebuild(info);
    }
  };

  readonly #onContextLost = (event: Event): void => {
    event.preventDefault();
    if (this.#rebuilding) return;
    const issue = this.#pendingWebGlIssue ?? webGlIssue(event);
    this.#pendingWebGlIssue = issue;
    this.#markRecovering(issue);
  };

  readonly #onContextRestored = (): void => {
    const issue = this.#pendingWebGlIssue;
    if (!issue || this.#rebuildPromise) return;
    this.#pendingWebGlIssue = null;
    void this.rebuild(issue);
  };

  #restoreRendererCallback(): void {
    if (this.#watchedRenderer && this.#originalDeviceLost && this.#watchedRenderer.onDeviceLost === this.#onDeviceLost) {
      this.#watchedRenderer.onDeviceLost = this.#originalDeviceLost;
    }
    this.#watchedRenderer = null;
    this.#originalDeviceLost = null;
  }

  #removeCanvasListeners(): void {
    this.#watchedCanvas?.removeEventListener('webglcontextlost', this.#onContextLost);
    this.#watchedCanvas?.removeEventListener('webglcontextrestored', this.#onContextRestored);
    this.#watchedCanvas = null;
  }

  #emit(): void {
    this.#options.onStateChange?.(this.getSnapshot());
  }

  #markRecovering(issue: GraphicsDeviceLostInfo): void {
    const wasRecovering = this.#snapshot.status === 'recovering';
    this.#snapshot = { ...this.#snapshot, status: 'recovering', lastIssue: issue, lastError: null };
    if (!wasRecovering) this.#options.onLoss?.(issue);
    this.#emit();
  }
}
