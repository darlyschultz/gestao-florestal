import type { Agendamento, DocumentoAgendamento } from '@prisma/client'
import type { RegrasAgendamento } from './agendamentoRules'

export interface PendenciaAgendamento {
  key: string
  label: string
  grupo: 'dados' | 'documentos' | 'local'
}

const CAMPOS_DADOS: Array<{ key: keyof Agendamento; label: string }> = [
  { key: 'motoristaId', label: 'Motorista' },
  { key: 'veiculoId', label: 'Veículo' },
  { key: 'fornecedorId', label: 'Fornecedor' },
  { key: 'fazendaId', label: 'Fazenda' },
  { key: 'talhaoId', label: 'Talhão' },
  { key: 'tipoMadeira', label: 'Tipo de madeira' },
  { key: 'quantidadePrevistaM3', label: 'Volume previsto (m³)' },
]

export function calcularPendencias(
  agendamento: Agendamento,
  documentos: DocumentoAgendamento[],
  regras: RegrasAgendamento,
  opts?: { latEmbarque?: number | null; lngEmbarque?: number | null },
): PendenciaAgendamento[] {
  const pendencias: PendenciaAgendamento[] = []

  for (const campo of CAMPOS_DADOS) {
    const val = agendamento[campo.key]
    if (val == null || val === '') {
      pendencias.push({ key: campo.key, label: campo.label, grupo: 'dados' })
    }
  }

  if (regras.requireNf && !documentos.some((d) => d.tipo === 'nota_fiscal' && d.numero)) {
    pendencias.push({ key: 'nota_fiscal', label: 'Nota Fiscal', grupo: 'documentos' })
  }
  if (regras.requireMdfe && !documentos.some((d) => d.tipo === 'mdfe' && d.numero)) {
    pendencias.push({ key: 'mdfe', label: 'MDF-e', grupo: 'documentos' })
  }
  if (regras.requireLoadingOrder && !documentos.some((d) => d.tipo === 'ordem_carregamento' && d.numero)) {
    pendencias.push({ key: 'ordem_carregamento', label: 'Ordem de carregamento', grupo: 'documentos' })
  }

  if (regras.requireBoardingLocation && (opts?.latEmbarque == null || opts?.lngEmbarque == null)) {
    pendencias.push({ key: 'local_embarque', label: 'Local de embarque (GPS)', grupo: 'local' })
  }

  return pendencias
}

export function dadosOperacionaisCompletos(agendamento: Agendamento): boolean {
  return CAMPOS_DADOS.every((c) => {
    const val = agendamento[c.key]
    return val != null && val !== ''
  })
}

export function enriquecerAgendamento<
  T extends Agendamento & { documentos?: DocumentoAgendamento[] },
>(ag: T, regras: RegrasAgendamento, coords?: { lat?: number | null; lng?: number | null }) {
  const documentos = ag.documentos ?? []
  const pendencias = calcularPendencias(ag, documentos, regras, {
    latEmbarque: coords?.lat,
    lngEmbarque: coords?.lng,
  })
  const dadosCompletos = dadosOperacionaisCompletos(ag)
  const prontoConfirmar = dadosCompletos && pendencias.length === 0

  return {
    ...ag,
    pendencias,
    resumoPendencias: pendencias.map((p) => p.label),
    dadosCompletos,
    documentosCompletos: pendencias.filter((p) => p.grupo === 'documentos').length === 0,
    prontoConfirmar,
  }
}
