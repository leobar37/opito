# opito

CLI extensible para sincronizar comandos de Claude Code a OpenCode.

## ¿Qué es opito?

Si usas tanto **Claude Code** como **OpenCode**, probablemente tengas comandos personalizados en `~/.claude/commands/` que te gustaría usar también en OpenCode. **opito** automatiza esta sincronización.

## Instalación

```bash
cd opito
bun install
```

## Tutorial Rápido

### 1. Inicializar opito

Primera vez que usas opito:

```bash
bun run src/cli.ts init
```

Esto crea el archivo de configuración en `~/.config/opito/config.json`.

### 2. Verificar que todo esté bien

```bash
bun run src/cli.ts doctor
```

Deberías ver:
```
✓ Claude commands directory
✓ OpenCode commands directory
📁 Claude commands: 11 found
📁 OpenCode commands: X found
```

### 3. Sincronizar comandos (modo prueba)

Antes de hacer cambios reales, prueba con `--dry-run`:

```bash
bun run src/cli.ts sync --dry-run
```

Verás qué comandos se crearían/actualizarían sin hacer cambios reales.

### 4. Sincronizar comandos (en serio)

```bash
bun run src/cli.ts sync
```

Esto:
- Crea un backup automático de tus comandos actuales de OpenCode
- Copia todos los comandos de Claude a OpenCode
- Muestra un resumen de lo que hizo

### 5. Verificar sincronización

```bash
bun run src/cli.ts list --source opencode
```

Deberías ver todos tus comandos de Claude ahora disponibles en OpenCode.

## Comandos Disponibles

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `init` | Crear configuración inicial | `opito init` |
| `sync` | Sincronizar comandos | `opito sync` |
| `sync --dry-run` | Simular sincronización | `opito sync --dry-run` |
| `sync --watch` | Observar cambios automáticamente | `opito sync --watch` |
| `list` | Listar comandos | `opito list` |
| `diff` | Ver diferencias | `opito diff` |
| `doctor` | Diagnóstico del entorno | `opito doctor` |

## Ejemplos de Uso

### Sincronizar solo comandos específicos

```bash
bun run src/cli.ts sync --filter "commit,qa,build"
```

### Modo observador (watch)

Útil cuando estás editando comandos:

```bash
bun run src/cli.ts sync --watch
```

Cada vez que modifiques un archivo en `~/.claude/commands/`, se sincronizará automáticamente.

### Ver diferencias

```bash
# Ver todas las diferencias
bun run src/cli.ts diff

# Ver diferencia de un comando específico
bun run src/cli.ts diff commit
```

## Configuración

El archivo de configuración está en `~/.config/opito/config.json`:

```json
{
  "claude": {
    "commandsPath": "~/.claude/commands"
  },
  "opencode": {
    "commandsPath": "~/.config/opencode/commands"
  },
  "backup": {
    "enabled": true,
    "maxBackups": 10,
    "path": "~/.config/opito/backups"
  }
}
```

### Cambiar rutas

Si tus comandos están en ubicaciones diferentes:

```json
{
  "claude": {
    "commandsPath": "/custom/path/.claude/commands"
  },
  "opencode": {
    "commandsPath": "/custom/path/.opencode/commands"
  }
}
```

## Backups

Cada vez que sincronizas, opito crea un backup automático en:
```
~/.config/opito/backups/backup-YYYY-MM-DDTHH-MM-SS.mmmZ/
```

Esto te permite restaurar comandos anteriores si algo sale mal.

## Flujo de Trabajo Recomendado

1. **Edita** tus comandos en `~/.claude/commands/`
2. **Prueba** con `opito sync --dry-run`
3. **Sincroniza** con `opito sync`
4. **Verifica** con `opito list --source opencode`

## Troubleshooting

### "No commands found"

```bash
opito doctor
```

Verifica que las rutas sean correctas.

### Permisos

Si tienes problemas de permisos:

```bash
chmod +x src/cli.ts
```

## Arquitectura

opito está diseñado para ser extensible:

- **Parser modular**: Fácil agregar nuevos formatos
- **Sistema de plugins**: Preparado para extensiones
- **CLI con CAC**: Moderno y mantenible

## Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commitea tus cambios: `git commit -am 'Agrega nueva feature'`
4. Push a la rama: `git push origin feature/nueva-feature`
5. Crea un Pull Request

## Licencia

MIT

---

**¿Preguntas?** Abre un issue o contacta al autor.
