<p align="center"><strong>SnowfallCanvas</strong></p>

<div align="center">
<p align="center">SnowfallCanvas is a high-performance snowfall effect for any HTMLCanvasElement. It adapts to DPR and runtime performance, recalculates particle density based on the container size, and reacts to tab visibility.</p>

[![npm](https://img.shields.io/npm/v/snowfall-canvas.svg?colorB=brightgreen)](https://www.npmjs.com/package/snowfall-canvas)
[![GitHub package version](https://img.shields.io/github/package-json/v/ux-ui-pro/snowfall-canvas.svg)](https://github.com/ux-ui-pro/snowfall-canvas)
[![NPM Downloads](https://img.shields.io/npm/dm/snowfall-canvas.svg?style=flat)](https://www.npmjs.org/package/snowfall-canvas)

<sup>~2kB gzipped</sup>

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
import { SnowfallCanvas, defaultConfig } from 'snowfall-canvas';
```
<br>

➠ **Usage**

<sub>HTML: container + canvas (framework-friendly)</sub>
```html
<div id="snow-wrap">
  <canvas id="snow-canvas" aria-hidden="true"></canvas>
</div>
```

<sub>CSS: make the canvas cover its container</sub>
```css
#snow-wrap {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
}

#snow-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
```

<sub>JS: basic start</sub>
```typescript
import { SnowfallCanvas } from 'snowfall-canvas';

const snow = new SnowfallCanvas({
  container: 'snow-wrap',
  canvas: 'snow-canvas',
});

snow.init();
snow.start();
```

<sub>JS: configuration override</sub>
```typescript
import { SnowfallCanvas } from 'snowfall-canvas';

const snow = new SnowfallCanvas({
  container: 'snow-wrap',
  canvas: 'snow-canvas',
  config: {
    amount: 2000,             // density relative to a base area
    maxParticles: 3000,       // hard particle limit
    size: [0.6, 1.5],         // particle size range (px)
    swingSpeed: [0.2, 0.8],   // horizontal swing speed
    fallSpeed: [40, 80],      // fall speed (px/s)
    amplitude: [20, 45],      // horizontal swing amplitude (px)
    color: 'rgba(200,200,200,1)',
    dprCap: 2,             // DPR upper cap
  },
});

snow.init();
snow.start();
```

<sub>Vue 3: Composition API example</sub>
```vue
<template>
  <div ref="wrap" class="wrap">
    <canvas ref="cnv" class="cnv" aria-hidden="true"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { SnowfallCanvas } from 'snowfall-canvas';

const wrap = ref<HTMLElement | null>(null);
const cnv = ref<HTMLCanvasElement | null>(null);

let snow: SnowfallCanvas | null = null;

onMounted(() => {
  if (!wrap.value || !cnv.value) return;

  snow = new SnowfallCanvas({
    container: wrap.value,
    canvas: cnv.value,
    config: {
      amount: 2000,
      maxParticles: 3000,
      size: [0.6, 1.5],
      swingSpeed: [0.2, 0.8],
      fallSpeed: [40, 80],
      amplitude: [20, 45],
      color: 'rgba(200,200,200,1)',
      dprCap: 2,
    },
  });

  snow.init();
  snow.start();
});

onBeforeUnmount(() => {
  snow?.destroy();
  snow = null;
});
</script>

<style scoped>
.wrap {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
}

.cnv {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
```
<br>

➠ **Constructor Options**

| Option      | Type                          | Required | Description                                                                 |
|:------------|:------------------------------|:--------:|:----------------------------------------------------------------------------|
| `container` | `HTMLElement \| string`       |    ✅     | Container element (or its `id`) whose size drives internal canvas resizing. |
| `canvas`    | `HTMLCanvasElement \| string` |    ✅     | Canvas element (or its `id`) used for rendering.                            |
| `config`    | `Partial<SnowConfig>`         |    ❌     | Configuration overrides.                                                    |

<br>

➠ **Config Options**

| Option         | Type               | Default              | Description                                                              |
|:---------------|:-------------------|:---------------------|:-------------------------------------------------------------------------|
| `amount`       | `number`           | `5000`               | Base particle density for a 1920×1080 area (scales with container size). |
| `size`         | `[number, number]` | `[0.5, 1.5]`         | Particle size range in pixels.                                           |
| `swingSpeed`   | `[number, number]` | `[0.1, 1]`           | Horizontal sinusoid speed factor.                                        |
| `fallSpeed`    | `[number, number]` | `[40, 100]`          | Fall speed in px/s.                                                      |
| `amplitude`    | `[number, number]` | `[25, 50]`           | Horizontal swing amplitude (px).                                         |
| `color`        | `string`           | `"rgb(225,225,225)"` | Particle color (`fillStyle`).                                            |
| `dprCap`       | `number`           | `2`                  | Upper bound for `devicePixelRatio`.                                      |
| `maxParticles` | `number`           | `4000`               | Hard cap for total particles.                                            |

<br>

➠ **API Methods**

| Method                                               | Description                                                                                         |
|:-----------------------------------------------------|:----------------------------------------------------------------------------------------------------|
| `new SnowfallCanvas({ container, canvas, config? })` | Creates an instance. Elements can be passed directly or by `id` string.                             |
| `init()`                                             | Reads container size, resizes internal canvas buffer, and subscribes to resize + visibility events. |
| `start()` / `stop()`                                 | Starts or stops the render loop.                                                                    |
| `destroy()`                                          | Stops and removes listeners/observers.                                                              |
| `requestResize()`                                    | Schedules a resize on the next animation frame. Useful if you manually manage layout updates.       |
| `setAmount(amount)`                                  | Updates base density and re-seeds particles.                                                        |
| `setMaxParticles(max)`                               | Adjusts the upper limit and re-seeds particles.                                                     |

<br>

➠ **Notes**

- The library does not inject DOM or CSS. Your app controls layout and styling.
- The internal canvas buffer is resized to match the container size and current DPR (capped by `dprCap`).
- Density is auto-scaled by container area and DPR.
- Self-throttles: may reduce DPR and particle count if frames get long.
- Pauses when the tab is hidden and resumes on return.
- Ensure the container has a computed size (height must not be `0`) and the canvas covers it via CSS.

<br>

➠ **License**

SnowfallCanvas is released under MIT license
