<p align="center"><strong>SnowfallCanvas</strong></p>

<div align="center">
<p align="center">SnowfallCanvas is a high-performance snowfall effect for any HTMLCanvasElement. It adapts to DPR and runtime performance, recalculates particle density based on the container size, and reacts to tab visibility.</p>

[![npm](https://img.shields.io/npm/v/snowfall-canvas.svg?colorB=brightgreen)](https://www.npmjs.com/package/snowfall-canvas)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/snowfall-canvas.svg)](https://github.com/ux-ui-pro/snowfall-canvas)
[![NPM Downloads](https://img.shields.io/npm/dm/snowfall-canvas.svg?style=flat)](https://www.npmjs.org/package/snowfall-canvas)

<a href="https://codepen.io/ux-ui/pen/zxBGXgm">Demo</a>
</div>
<br>

➠ **Install**

```console
yarn add snowfall-canvas
```
<br>

➠ **Import**

```typescript
import { SnowfallCanvas, snowfallCanvasCssText, defaultConfig } from 'snowfall-canvas';
```
<br>

➠ **Usage**

<sub>HTML: full-screen canvas</sub>
```html
<canvas id="snowfall-canvas"></canvas>
```

<sub>JS: basic start (styles auto-inserted by default)</sub>
```typescript
import { SnowfallCanvas, snowfallCanvasCssText } from 'snowfall-canvas';

const canvas = document.getElementById('snowfall-canvas') as HTMLCanvasElement;
const snow = new SnowfallCanvas(canvas);

// Optional: apply default full-screen layer styles manually
const style = document.createElement('style');
style.textContent = snowfallCanvasCssText;
document.head.append(style);

snow.init();
snow.start();
```

<sub>JS: configuration override + manual styles (disable autoInsertStyles)</sub>
```typescript
import { SnowfallCanvas } from 'snowfall-canvas';

const snow = new SnowfallCanvas('#snowfall-canvas', {
  amount: 3500,           // particle density relative to a base area
  size: [0.8, 1.6],       // particle size range (px)
  swingSpeed: [0.2, 0.8], // sinusoidal horizontal swing speed
  fallSpeed: [50, 110],   // fall speed (px/s)
  amplitude: [20, 45],    // horizontal swing amplitude (px)
  color: 'rgb(240,240,255)',
  dprCap: 1.75,           // upper DPR cap
  maxParticles: 3500,     // hard particle limit
  autoInsertStyles: false // turn off auto styles if you want custom CSS
});

// If autoInsertStyles is false, you should add your own styles:
// position: fixed/absolute; inset: 0; width: 100vw; height: 100vh;
// pointer-events: none; display: block;
snow.init();
snow.start();
```
<br>

➠ **Options**

|     Option     |        Type        |      Default       | Description                                                         |
|:--------------:|:------------------:|:------------------:|:--------------------------------------------------------------------|
|    `amount`    |      `number`      |       `5000`       | Base particle count for a 1920×1080 area (scales with canvas size). |
|     `size`     | `[number, number]` |    `[0.5, 1.5]`    | Particle size range in pixels.                                      |
|  `swingSpeed`  | `[number, number]` |     `[0.1, 1]`     | Horizontal sinusoid speed (rad/s).                                  |
|  `fallSpeed`   | `[number, number]` |    `[40, 100]`     | Fall speed in px/s.                                                 |
|  `amplitude`   | `[number, number]` |     `[25, 50]`     | Horizontal swing amplitude (px).                                    |
|    `color`     |      `string`      | "rgb(225,225,225)" | Particle color (fillStyle).                                         |
|    `dprCap`    |      `number`      |        `2`         | Upper bound for devicePixelRatio.                                   |
| `maxParticles` |      `number`      |       `4000`       | Hard cap for total particles.                                       |
| `autoInsertStyles` | `boolean` | `true` | Automatically injects default canvas styles on `init()`. Disable to supply custom CSS. |
| `initialFill` | `'filled'` | `undefined` | If set to `'filled'`, particles spawn across the full viewport height immediately. If omitted, snowfall starts from top as usual. |

<br>

➠ **API Methods**

| Method                                    | Description                                                               |
|-------------------------------------------|---------------------------------------------------------------------------|
| `new SnowfallCanvas(canvasOrId, config?)` | Creates an instance. `canvasOrId` accepts a DOM element or a string `id`. |
| `init()`                                  | Calculates sizes and subscribes to `resize` and `visibilitychange`.       |
| `start()` / `stop()`                      | Starts or stops the render loop.                                          |
| `destroy()`                               | Stops, removes listeners, and clears references.                          |
| `resize(width, height, nextCount?)`       | Force new dimensions and particle count.                                  |
| `setAmount(amount)`                       | Updates base density and re-seeds particles.                              |
| `setMaxParticles(max)`                    | Adjusts the upper limit and re-seeds particles.                           |

<br>

➠ **Notes**

- Auto-adjusts density to canvas area and current DPR.
- Self-throttles: reduces DPR and particle count if frames get long.
- Works as a full-screen layer or inside a container (`ResizeObserver` with `window.resize` fallback).
- Pauses when the tab is hidden and resumes on return.
- Colors and styles are easy to override via `config.color` and your canvas CSS.
- Default styles are auto-inserted. If you disable `autoInsertStyles`, add equivalent CSS (fixed/absolute, inset:0, 100vw/100vh, pointer-events:none, display:block) to prevent layout growth from the canvas.

<br>

➠ **License**

SnowfallCanvas is released under MIT license
