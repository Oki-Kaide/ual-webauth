import { defineConfig } from 'tsup'
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  name: 'tsup',
  dts: {
    resolve: true,
    entry: './src/index.ts',
  },
  format: ['esm'],
  esbuildPlugins: [
    NodeModulesPolyfillPlugin(),
    polyfillNode()],
})