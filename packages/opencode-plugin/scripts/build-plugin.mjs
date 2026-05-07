#!/usr/bin/env node
/**
 * Script de build para opito-plugin
 * Genera un bundle único autocontenido en ~/.config/opencode/plugins/opito.js
 */

import { buildSync } from 'esbuild'
import { copyFileSync } from 'fs'

const PLUGIN_DIR = '/Users/leobar37/.supacode/repos/opito/feature/monorepo/packages/opencode-plugin'
const DEST = '/Users/leobar37/.config/opencode/plugins/opito.js'

console.log('[build] Compilando plugin...')

try {
  // Build con esbuild - bundle completo
  buildSync({
    entryPoints: [`${PLUGIN_DIR}/src/index.ts`],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: DEST,
    external: ['@opencode-ai/*'],
    banner: {
      js: `console.log('[opito] Plugin bundle cargado');`,
    },
    footer: {
      js: `console.log('[opito] Plugin listo para usar');`,
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  })

  console.log(`[build] Plugin generado: ${DEST}`)
  console.log('[build] Reinicia OpenCode para cargar los cambios')
} catch (err) {
  console.error('[build] Error:', err.message)
  process.exit(1)
}
