import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'lightningcss';

export default defineConfig({
  plugins: [
    {
      name: 'snowfall-canvas:css',
      async load(id) {
        if (!id.includes('snowfall-canvas.css') || !id.includes('?raw')) return null;

        const file = id.split('?', 1)[0];
        const input = await readFile(file);
        const result = transform({
          filename: file,
          code: input,
          minify: true,
        });

        const minifiedCssText = Buffer.from(result.code).toString('utf8');
        return `export default ${JSON.stringify(minifiedCssText)};`;
      },
      async generateBundle() {
        const file = resolve(process.cwd(), 'src', 'snowfall-canvas.css');
        const input = await readFile(file);
        const result = transform({
          filename: file,
          code: input,
          minify: true,
        });

        this.emitFile({
          type: 'asset',
          fileName: 'snowfall-canvas.css',
          source: Buffer.from(result.code).toString('utf8'),
        });
      },
    },
    dts({
      outDir: 'dist',
      insertTypesEntry: true,
      entryRoot: 'src',
      cleanVueFileName: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SnowfallCanvas',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'index.[ext]',
      },
    },
  },
});
