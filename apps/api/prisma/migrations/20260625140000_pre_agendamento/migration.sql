-- Pré-agendamento: campos opcionais, documentos no agendamento, vínculo motorista-usuário

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "motoristaCadastroId" TEXT;

ALTER TABLE "agendamentos" ADD COLUMN IF NOT EXISTS "grupoReservaId" TEXT;

ALTER TABLE "agendamentos" ALTER COLUMN "motoristaId" DROP NOT NULL;
ALTER TABLE "agendamentos" ALTER COLUMN "veiculoId" DROP NOT NULL;
ALTER TABLE "agendamentos" ALTER COLUMN "fornecedorId" DROP NOT NULL;
ALTER TABLE "agendamentos" ALTER COLUMN "fazendaId" DROP NOT NULL;
ALTER TABLE "agendamentos" ALTER COLUMN "talhaoId" DROP NOT NULL;
ALTER TABLE "agendamentos" ALTER COLUMN "tipoMadeira" DROP NOT NULL;
ALTER TABLE "agendamentos" ALTER COLUMN "quantidadePrevistaM3" DROP NOT NULL;
ALTER TABLE "agendamentos" ALTER COLUMN "dataHoraChegadaPrevista" DROP NOT NULL;

ALTER TABLE "agendamentos" ALTER COLUMN "status" SET DEFAULT 'pre_agendado';

CREATE INDEX IF NOT EXISTS "agendamentos_grupoReservaId_idx" ON "agendamentos"("grupoReservaId");

CREATE TABLE IF NOT EXISTS "documento_agendamentos" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "arquivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documento_agendamentos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "documento_agendamentos_agendamentoId_idx" ON "documento_agendamentos"("agendamentoId");

DO $$ BEGIN
  ALTER TABLE "documento_agendamentos" ADD CONSTRAINT "documento_agendamentos_agendamentoId_fkey"
    FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_motoristaCadastroId_fkey"
    FOREIGN KEY ("motoristaCadastroId") REFERENCES "motoristas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
