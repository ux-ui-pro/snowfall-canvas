import CSS_TEXT from './snowfall-canvas.css?raw';

export type Range = readonly [min: number, max: number];

export interface SnowConfig {
  amount: number;
  size: Range;
  swingSpeed: Range;
  fallSpeed: Range;
  amplitude: Range;
  color: string;
  dprCap: number;
  maxParticles: number;
  autoInsertStyles: boolean;
}

export type SnowConfigInput = Partial<SnowConfig>;

export const defaultConfig: SnowConfig = {
  amount: 5000,
  size: [0.5, 1.5],
  swingSpeed: [0.1, 1],
  fallSpeed: [40, 100],
  amplitude: [25, 50],
  color: 'rgb(225,225,225)',
  dprCap: 2,
  maxParticles: 4000,
  autoInsertStyles: true,
};

export const snowfallCanvasCssText: string = CSS_TEXT;

const rand = (min: number, max: number): number => Math.random() * (max - min) + min;

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const TWO_PI = Math.PI * 2;
const SIN_TABLE_SIZE = 2048;
const SIN_TABLE = new Float32Array(SIN_TABLE_SIZE);

for (let i = 0; i < SIN_TABLE_SIZE; i += 1) {
  SIN_TABLE[i] = Math.sin((i / SIN_TABLE_SIZE) * TWO_PI);
}

export class SnowfallCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private running = false;
  private rafId: number | null = null;
  private lastTime = 0;

  private width = 0;
  private height = 0;
  private dpr = 1;

  private resizeObserver: ResizeObserver | null = null;
  private resizeQueued = false;
  private container: HTMLElement | null = null;
  private fallbackResizeAttached = false;

  private particleCount = 0;
  private posX: Float32Array = new Float32Array(0);
  private posY: Float32Array = new Float32Array(0);
  private originX: Float32Array = new Float32Array(0);
  private dx: Float32Array = new Float32Array(0);
  private size: Float32Array = new Float32Array(0);
  private amplitude: Float32Array = new Float32Array(0);
  private velX: Float32Array = new Float32Array(0);
  private velY: Float32Array = new Float32Array(0);

  private visibilityHandlerAttached = false;
  private autoPausedByVisibility = false;
  private frameTimeAvg = 16;
  private perfCooldownFrames = 0;
  private dprOverride: number | null = null;

  private config: SnowConfig;

  constructor(canvas: HTMLCanvasElement | string, config: SnowConfigInput = {}) {
    this.canvas =
      typeof canvas === 'string'
        ? ((document.getElementById(canvas) as HTMLCanvasElement | null) ??
          (() => {
            throw new Error(`Canvas not found: ${canvas}`);
          })())
        : canvas;

    const ctx = this.canvas.getContext('2d');

    if (!ctx) throw new Error('2D context is not supported');

    this.ctx = ctx;
    this.container = this.canvas.parentElement;
    this.config = { ...defaultConfig, ...config };
  }

  init(): void {
    if (this.config.autoInsertStyles) {
      this.ensureDefaultStyles();
    }

    this.resizeToContainer();
    this.setupResizeWatcher();
    this.setupVisibilityWatcher();
  }

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();

    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);

    this.rafId = null;
  }

  destroy(): void {
    this.stop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.fallbackResizeAttached) {
      window.removeEventListener('resize', this.queueResize);

      this.fallbackResizeAttached = false;
    }

    if (this.visibilityHandlerAttached) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);

      this.visibilityHandlerAttached = false;
    }

    this.container = null;
  }

  private ensureDefaultStyles(): void {
    if (typeof document === 'undefined') return;

    const existing =
      document.querySelector('style[data-snowfall-canvas]') ??
      document.getElementById('snowfall-canvas-style');

    if (existing) return;

    const style = document.createElement('style');

    style.id = 'snowfall-canvas-style';
    style.setAttribute('data-snowfall-canvas', 'true');
    style.textContent = snowfallCanvasCssText;

    document.head.append(style);
  }

  resize(width: number, height: number, nextCount?: number): void {
    const normalizedWidth = Math.max(1, Math.floor(width));
    const normalizedHeight = Math.max(1, Math.floor(height));
    const dpr = this.getTargetDpr();
    const count = nextCount ?? this.particleCount;

    const dimensionsChanged =
      normalizedWidth !== this.width || normalizedHeight !== this.height || dpr !== this.dpr;

    this.width = normalizedWidth;
    this.height = normalizedHeight;
    this.dpr = dpr;

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (count > 0 && (dimensionsChanged || count !== this.particleCount)) {
      this.reseedParticles(count);
    }
  }

  setAmount(amount: number): void {
    const next = Math.max(0, Math.floor(amount));

    this.config = { ...this.config, amount: next };

    const count = this.getDensityAdjustedCount(this.width, this.height);

    this.reseedParticles(count);
  }

  setMaxParticles(max: number): void {
    const capped = Math.max(0, Math.floor(max));

    this.config = { ...this.config, maxParticles: capped };

    const count = this.getDensityAdjustedCount(this.width, this.height);

    this.reseedParticles(count);
  }

  private loop = (t: number): void => {
    if (!this.running) return;

    const frameMs = t - this.lastTime;
    const dt = Math.min(0.05, frameMs / 1000);

    this.lastTime = t;
    this.frameTimeAvg = this.frameTimeAvg * 0.9 + frameMs * 0.1;

    this.clear();
    this.update(dt);
    this.draw();
    this.maybeAdjustPerformance();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private reseedParticles(count: number): void {
    this.particleCount = count;

    const needsResize = this.posX.length !== count;

    if (needsResize) {
      this.posX = new Float32Array(count);
      this.posY = new Float32Array(count);
      this.originX = new Float32Array(count);
      this.dx = new Float32Array(count);
      this.size = new Float32Array(count);
      this.amplitude = new Float32Array(count);
      this.velX = new Float32Array(count);
      this.velY = new Float32Array(count);
    }

    for (let i = 0; i < count; i += 1) {
      this.seedParticle(i);
    }
  }

  private seedParticle(i: number): void {
    this.originX[i] = rand(0, this.width);
    this.posX[i] = this.originX[i];
    this.posY[i] = rand(-this.height, 0);
    this.dx[i] = rand(0, TWO_PI);

    this.velX[i] = rand(this.config.swingSpeed[0], this.config.swingSpeed[1]);
    this.velY[i] = rand(this.config.fallSpeed[0], this.config.fallSpeed[1]);
    this.size[i] = rand(this.config.size[0], this.config.size[1]);
    this.amplitude[i] = rand(this.config.amplitude[0], this.config.amplitude[1]);
  }

  private resetTop(i: number): void {
    this.posY[i] = -this.size[i];

    const x = rand(0, this.width);

    this.posX[i] = x;
    this.originX[i] = x;
    this.dx[i] = rand(0, TWO_PI);
  }

  private update(dt: number): void {
    const { particleCount } = this;
    const height = this.height;
    const posX = this.posX;
    const posY = this.posY;
    const originX = this.originX;
    const dx = this.dx;
    const velX = this.velX;
    const velY = this.velY;
    const amp = this.amplitude;
    const size = this.size;

    for (let i = 0; i < particleCount; i += 1) {
      posY[i] += velY[i] * dt;
      dx[i] += velX[i] * dt;

      if (dx[i] > TWO_PI) dx[i] -= TWO_PI;

      posX[i] = originX[i] + amp[i] * this.fastSin(dx[i]);

      if (posY[i] - size[i] > height) {
        this.resetTop(i);
      }
    }
  }

  private draw(): void {
    const { particleCount } = this;
    const ctx = this.ctx;
    const posX = this.posX;
    const posY = this.posY;
    const size = this.size;

    ctx.fillStyle = this.config.color;

    for (let i = 0; i < particleCount; i += 1) {
      ctx.fillRect(posX[i], posY[i], size[i], size[i]);
    }
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private setupResizeWatcher(): void {
    const target = this.container;

    if (typeof ResizeObserver !== 'undefined' && target) {
      if (this.resizeObserver) return;

      this.resizeObserver = new ResizeObserver(() => this.queueResize());
      this.resizeObserver.observe(target);

      return;
    }

    if (!this.fallbackResizeAttached) {
      window.addEventListener('resize', this.queueResize, { passive: true });

      this.fallbackResizeAttached = true;
    }
  }

  private setupVisibilityWatcher(): void {
    if (typeof document === 'undefined' || this.visibilityHandlerAttached) return;

    document.addEventListener('visibilitychange', this.handleVisibilityChange, { passive: true });

    this.visibilityHandlerAttached = true;
  }

  private fastSin(x: number): number {
    const norm = x < 0 ? x + TWO_PI : x;
    const scaled = norm * (SIN_TABLE_SIZE / TWO_PI);
    const idx = scaled | 0;
    const next = (idx + 1) & (SIN_TABLE_SIZE - 1);
    const frac = scaled - idx;
    const a = SIN_TABLE[idx & (SIN_TABLE_SIZE - 1)];
    const b = SIN_TABLE[next];

    return a + (b - a) * frac;
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      if (this.running) {
        this.autoPausedByVisibility = true;
        this.stop();
      }

      return;
    }

    if (this.autoPausedByVisibility) {
      this.autoPausedByVisibility = false;

      this.start();
    }
  };

  private maybeAdjustPerformance(): void {
    if (this.perfCooldownFrames > 0) {
      this.perfCooldownFrames -= 1;

      return;
    }

    if (this.frameTimeAvg > 22) {
      const loweredDpr = Math.max(1, Math.min(this.dpr, 1.25));
      const reducedCount = Math.max(200, Math.floor(this.particleCount * 0.75));
      const needsDprReduce = loweredDpr < (this.dprOverride ?? this.dpr);
      const needsCountReduce = reducedCount < this.particleCount;

      if (needsDprReduce) {
        this.dprOverride = loweredDpr;
      }

      if (needsDprReduce || needsCountReduce) {
        this.perfCooldownFrames = 90;

        const nextCount = Math.min(
          reducedCount,
          this.getDensityAdjustedCount(this.width, this.height),
        );

        this.resize(this.width, this.height, nextCount);
      }
    }
  }

  private queueResize = (): void => {
    if (this.resizeQueued) return;

    this.resizeQueued = true;

    requestAnimationFrame(() => {
      this.resizeQueued = false;
      this.resizeToContainer();
    });
  };

  private resizeToContainer(): void {
    const target = this.container;
    const width = target?.clientWidth ?? window.innerWidth;
    const height = target?.clientHeight ?? window.innerHeight;
    const nextCount = this.getDensityAdjustedCount(width, height);

    this.resize(width, height, nextCount);
  }

  private getDensityAdjustedCount(width: number, height: number): number {
    if (width <= 0 || height <= 0) return 0;

    const baseArea = BASE_WIDTH * BASE_HEIGHT;
    const density = this.config.amount / baseArea;
    const dprFactor = 1 / this.getTargetDpr();
    const estimated = Math.floor(density * width * height * dprFactor);

    return Math.max(0, Math.min(this.config.maxParticles, estimated));
  }

  private getTargetDpr(): number {
    const rawDpr = window.devicePixelRatio || 1;
    const base = Math.max(1, rawDpr);
    const overridden = this.dprOverride !== null ? Math.min(base, this.dprOverride) : base;

    return Math.min(this.config.dprCap, overridden);
  }
}
