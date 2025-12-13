import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import license from 'rollup-plugin-license'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: "/sigcal/",
  plugins: [
    svelte(),
    license({
      thirdParty: {
        output: path.join(__dirname, 'dist', 'dependencies.txt'),
        includePrivate: false,
      },
    }),
  ],
})
