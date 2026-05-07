#!/bin/bash
# Script de desarrollo para opito-plugin
# Compila y sincroniza automáticamente con OpenCode

PLUGIN_DIR="/Users/leobar37/.supacode/repos/opito/feature/monorepo/packages/opencode-plugin"
DEST_DIR="/Users/leobar37/.config/opencode/plugins/opito"

echo "[opito-dev] Compilando plugin..."
cd "$PLUGIN_DIR" || exit 1

# Compilar TypeScript
pnpm build >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "[opito-dev] Error en compilación"
  exit 1
fi

echo "[opito-dev] Copiando a OpenCode..."
rm -rf "$DEST_DIR"/*
cp -r "$PLUGIN_DIR"/dist/* "$DEST_DIR"/

# Crear package.json
 cat > "$DEST_DIR"/package.json << 'EOF'
{
  "name": "@opito/opencode-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "./index.js"
}
EOF

echo "[opito-dev] Listo! Reinicia OpenCode para ver cambios."
echo "[opito-dev] Comando: pkill -f opencode && sleep 2 && opencode"
