#!/usr/bin/env node
/**
 * Script de desarrollo para opito-plugin
 * Compila automáticamente cuando cambian los archivos source
 * y copia el bundle a ~/.config/opencode/plugins/
 */

import { execSync } from 'child_process'
import { watch } from 'fs'
import { resolve } from 'path'

const PLUGIN_DIR = resolve('/Users/leobar37/.supacode/repos/opito/feature/monorepo/packages/opencode-plugin')
const DEST = '/Users/leobar37/.config/opencode/plugins/opito.js'
const SRC_DIR = resolve(PLUGIN_DIR, 'src')

console.log('[opito-dev] Iniciando modo desarrollo...')
console.log('[opito-dev] Monitoreando:', SRC_DIR)
console.log('[opito-dev] Destino:', DEST)
console.log('[opito-dev] Presiona Ctrl+C para detener\n')

let isBuilding = false
let pendingBuild = false

function build() {
  if (isBuilding) {
    pendingBuild = true
    return
  }
  
  isBuilding = true
  console.log('[opito-dev] Compilando...')
  
  try {
    execSync('pnpm build', { 
      cwd: PLUGIN_DIR,
      stdio: 'inherit'
    })
    
    console.log('[opito-dev] Copiando a destino...')
    execSync(`cp ${PLUGIN_DIR}/bundle/opito.js ${DEST}`)
    
    console.log('[opito-dev] Plugin actualizado! Reinicia OpenCode para ver cambios.\n')
  } catch (e) {
    console.error('[opito-dev] Error en compilación:', e.message)
  } finally {
    isBuilding = false
    
    if (pendingBuild) {
      pendingBuild = false
      build()
    }
  }
}

// Compilación inicial
build()

// Watch
console.log('[opito-dev] Esperando cambios...\n')

watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
  if (filename.endsWith('.ts')) {
    console.log(`[opito-dev] Cambio detectado: ${filename}`)
    build()
  }
})
