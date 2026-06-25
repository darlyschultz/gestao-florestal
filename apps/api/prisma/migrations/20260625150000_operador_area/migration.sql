-- Operador de área: vínculo do usuário à fazenda de carregamento
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fazendaId" TEXT;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_fazendaId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_fazendaId_fkey"
  FOREIGN KEY ("fazendaId") REFERENCES "fazendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "users_fazendaId_idx" ON "users"("fazendaId");
