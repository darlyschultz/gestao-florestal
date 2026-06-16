-- Performance indexes for list/filter queries (portaria, viagens, fila)

CREATE INDEX IF NOT EXISTS "agendamentos_data_hora_chegada_prevista_idx" ON "agendamentos"("dataHoraChegadaPrevista");
CREATE INDEX IF NOT EXISTS "agendamentos_data_hora_saida_prevista_idx" ON "agendamentos"("dataHoraSaidaPrevista");
CREATE INDEX IF NOT EXISTS "agendamentos_status_idx" ON "agendamentos"("status");
CREATE INDEX IF NOT EXISTS "viagens_status_idx" ON "viagens"("status");
CREATE INDEX IF NOT EXISTS "viagens_updated_at_idx" ON "viagens"("updatedAt");
CREATE INDEX IF NOT EXISTS "documentos_viagem_viagem_id_idx" ON "documentos_viagem"("viagemId");
CREATE INDEX IF NOT EXISTS "documentos_viagem_numero_idx" ON "documentos_viagem"("numero");
CREATE INDEX IF NOT EXISTS "fila_patio_status_idx" ON "fila_patio"("status");
