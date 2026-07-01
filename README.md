# snowfall-canvas

High-performance snowfall animation for any HTMLCanvasElement with automatic DPR and performance adaptation.

[![npm](https://img.shields.io/npm/v/snowfall-canvas.svg?colorB=brightgreen)](https://www.npmjs.com/package/snowfall-canvas)
[![NPM Downloads](https://img.shields.io/npm/dm/snowfall-canvas.svg?style=flat)](https://www.npmjs.com/package/snowfall-canvas)

[Demo](https://codepen.io/ux-ui/pen/zxBGXgm)

---

- Adapts to device pixel ratio and throttles when frames get long.
- Recalculates particle density from container size (base area 1920×1080).
- Pauses when the tab is hidden; resumes on return.
- Does not inject DOM or CSS — your app controls layout and styling.
- ~2kB gzipped.

---

## Installation

```bash
npm install snowfall-canvas
```

## Quick Start

HTML: container + canvas (framework-friendly):

```html
<div id="snow-wrap">
  <canvas id="snow-canvas" aria-hidden="true"></canvas>
</div>
```

CSS: make the canvas cover its container:

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

JavaScript:

```ts
import { SnowfallCanvas } from 'snowfall-canvas';

const snow = new SnowfallCanvas({
  container: 'snow-wrap',
  canvas: 'snow-canvas',
});

snow.init();
snow.start();
```

## API

Named exports:

```ts
import { SnowfallCanvas, defaultConfig } from 'snowfall-canvas';
```

- `SnowfallCanvas` — main class.
- `defaultConfig` — default `SnowConfig` values (see table below).
- Types: `SnowConfig`, `SnowConfigInput`, `SnowfallCanvasOptions`, `Range`.

## Options

Constructor options:

| Option      | Type                          | Required | Description                                                                 |
|:------------|:------------------------------|:--------:|:----------------------------------------------------------------------------|
| `container` | `HTMLElement \| string`       | yes      | Container element (or its `id`) whose size drives internal canvas resizing. |
| `canvas`    | `HTMLCanvasElement \| string` | yes      | Canvas element (or its `id`) used for rendering.                            |
| `config`    | `Partial<SnowConfig>`         | no       | Configuration overrides.                                                    |

### Config

| Option         | Type               | Default              | Description                                                              |
|:---------------|:-------------------|:---------------------|:-------------------------------------------------------------------------|
| `amount`       | `number`           | `1500`               | Base particle density for a 1920×1080 area (scales with container size). |
| `maxParticles` | `number`           | `2500`               | Hard cap for total particles.                                            |
| `size`         | `[number, number]` | `[0.8, 1.5]`         | Particle size range in pixels.                                           |
| `swingSpeed`   | `[number, number]` | `[0.2, 0.8]`         | Horizontal sinusoid speed factor.                                        |
| `fallSpeed`    | `[number, number]` | `[40, 80]`           | Fall speed in px/s.                                                      |
| `amplitude`    | `[number, number]` | `[20, 45]`           | Horizontal swing amplitude (px).                                         |
| `color`        | `string`           | `"rgb(225,225,225)"` | Particle color (`fillStyle`).                                            |
| `dprCap`       | `number`           | `2`                  | Upper bound for `devicePixelRatio`.                                      |

Example with overrides:

```ts
const snow = new SnowfallCanvas({
  container: 'snow-wrap',
  canvas: 'snow-canvas',
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
```

## Methods

| Method            | Description                                                                                         |
|:------------------|:----------------------------------------------------------------------------------------------------|
| `init()`          | Reads container size, resizes internal canvas buffer, and subscribes to resize + visibility events. |
| `start()`         | Starts the render loop.                                                                             |
| `stop()`          | Stops the render loop.                                                                              |
| `destroy()`       | Stops and removes listeners/observers.                                                              |
| `requestResize()` | Schedules a resize on the next animation frame. Useful after manual layout updates.                 |
| `setAmount(amount)` | Updates base density and re-seeds particles.                                                      |
| `setMaxParticles(max)` | Adjusts the upper limit and re-seeds particles.                                                |

## Framework integration

### Vue 3

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

## Notes

- The internal canvas buffer is resized to match the container size and current DPR (capped by `dprCap`).
- Density auto-scales by container area and DPR; the library may reduce DPR and particle count if frames get long.
- Ensure the container has a computed size (height must not be `0`) and the canvas covers it via CSS.

## License

MIT
