-- Índice composto para ordenação da fila por status + posição
CREATE INDEX IF NOT EXISTS "fila_patio_status_posicao_idx" ON "fila_patio"("status", "posicao");
