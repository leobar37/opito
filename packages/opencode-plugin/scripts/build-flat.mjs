#!/usr/bin/env node
/**
 * Build script: genera un archivo plano autocontenido para OpenCode
 * Lee dist/index.js y todos sus imports relativos, los concatena en uno solo
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')
const OUT_FILE = join(__dirname, '..', 'flat', 'opito.js')
const PLUGIN_DEST = '/Users/leobar37/.config/opencode/plugins/opito.js'

// Archivos ya procesados (evitar duplicados)
const processed = new Set()
const modules = []

function resolveImport(fromFile, importPath) {
  // Resolver imports relativos
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const dir = dirname(fromFile)
    let resolved = join(dir, importPath)
    
    // Probar con .js
    if (!existsSync(resolved) && !resolved.endsWith('.js')) {
      resolved += '.js'
    }
    
    return existsSync(resolved) ? resolved : null
  }
  return null
}

function processFile(filePath) {
  if (processed.has(filePath)) return
  processed.add(filePath)
  
  console.log(`[build] Processing: ${filePath}`)
  
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const output = []
  
  for (const line of lines) {
    const importMatch = line.match(/^import\s+.*?\s+from\s+['"](.+?)['"];?$/)
    const exportMatch = line.match(/^export\s+.*?\s+from\s+['"](.+?)['"];?$/)
    
    if (importMatch) {
      const importPath = importMatch[1]
      const resolved = resolveImport(filePath, importPath)
      
      if (resolved) {
        // Es un import relativo - procesar recursivamente
        processFile(resolved)
        // No incluir la línea de import (el código ya está inlineado)
        continue
      } else {
        // Es un import externo (@opencode-ai/*, etc.) - mantenerlo
        output.push(line)
      }
    } else if (exportMatch) {
      const exportPath = exportMatch[1]
      const resolved = resolveImport(filePath, exportPath)
      
      if (resolved) {
        processFile(resolved)
        // Mantener el export si re-exporta algo
        output.push(line.replace(new RegExp(`from\s+['"]${exportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`), ''))
      } else {
        output.push(line)
      }
    } else {
      output.push(line)
    }
  }
  
  modules.push({
    path: filePath,
    content: output.join('\n')
  })
}

// Procesar desde el entry point
processFile(join(DIST_DIR, 'index.js'))

// Concatenar todos los módulos
const finalContent = modules.map(m => `
// === ${m.path.replace(DIST_DIR, '.')} ===
${m.content}
`).join('\n')

// Agregar export default al final
const wrapped = `${finalContent}\n\nexport { plugin }\nexport default plugin\n`

// Escribir
import { mkdirSync } from 'fs'
mkdirSync(dirname(OUT_FILE), { recursive: true })
writeFileSync(OUT_FILE, wrapped)
writeFileSync(PLUGIN_DEST, wrapped)

console.log(`[build] Flat file: ${OUT_FILE}`)
console.log(`[build] Plugin installed: ${PLUGIN_DEST}`)
console.log(`[build] Total modules: ${modules.length}`)
