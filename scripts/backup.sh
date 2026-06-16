#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="gestao-florestal_${TIMESTAMP}"
BACKUP_DIR="$ROOT/backups/$BACKUP_NAME"

mkdir -p "$BACKUP_DIR/uploads"

# Banco SQLite — cópia consistente
sqlite3 "$ROOT/apps/api/prisma/dev.db" ".backup '$BACKUP_DIR/dev.db'"

# Uploads
if [ -d "$ROOT/apps/api/uploads" ]; then
  cp -R "$ROOT/apps/api/uploads/." "$BACKUP_DIR/uploads/"
fi

# Código-fonte
tar -czf "$BACKUP_DIR/source.tar.gz" \
  --exclude='node_modules' \
  --exclude='apps/web/dist' \
  --exclude='backups' \
  --exclude='.git' \
  -C "$ROOT" \
  apps packages README.md package.json package-lock.json .gitignore 2>/dev/null || \
tar -czf "$BACKUP_DIR/source.tar.gz" \
  --exclude='node_modules' \
  --exclude='apps/web/dist' \
  --exclude='backups' \
  --exclude='.git' \
  -C "$ROOT" \
  apps README.md package.json package-lock.json .gitignore

# Variáveis de ambiente
[ -f "$ROOT/apps/api/.env" ] && cp "$ROOT/apps/api/.env" "$BACKUP_DIR/api.env"
[ -f "$ROOT/apps/web/.env" ] && cp "$ROOT/apps/web/.env" "$BACKUP_DIR/web.env"

cat > "$BACKUP_DIR/RESTORE.md" << EOF
# Backup — Gestão Florestal

**Data:** $(date '+%Y-%m-%d %H:%M:%S %z')
**Pasta:** $BACKUP_NAME

## Conteúdo

| Arquivo | Descrição |
|---------|-----------|
| \`dev.db\` | Banco SQLite (cópia consistente) |
| \`uploads/\` | Arquivos enviados (avatars, documentos) |
| \`source.tar.gz\` | Código-fonte (sem node_modules) |
| \`api.env\` / \`web.env\` | Variáveis de ambiente |

## Restaurar

\`\`\`bash
cd /caminho/do/projeto
tar -xzf source.tar.gz
cp dev.db apps/api/prisma/dev.db
cp -R uploads/* apps/api/uploads/
cp api.env apps/api/.env
cp web.env apps/web/.env
npm install
\`\`\`
EOF

# Arquivo compactado final
tar -czf "$ROOT/backups/${BACKUP_NAME}.tar.gz" -C "$ROOT/backups" "$BACKUP_NAME"

echo "✅ Backup criado:"
echo "   $ROOT/backups/${BACKUP_NAME}.tar.gz"
ls -lh "$ROOT/backups/${BACKUP_NAME}.tar.gz"
du -sh "$BACKUP_DIR"
