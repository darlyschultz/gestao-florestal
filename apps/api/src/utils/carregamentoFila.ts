import type { Prisma } from '@prisma/client'
import { STATUS_FILA_CARREGAMENTO } from './carregamentoArea'

export const viagemIncludeCarregamento = {
  motorista: { select: { id: true, nome: true, telefone: true, cpf: true } },
  veiculo: {
    select: { id: true, placa: true, placaCarreta: true, tipo: true, marca: true, modelo: true },
  },
  transportadora: { select: { id: true, nome: true, telefone: true, cnpj: true } },
  documentos: {
    select: { id: true, tipo: true, numero: true, status: true, arquivo: true },
    orderBy: { createdAt: 'asc' as const },
  },
  agendamento: {
    select: {
      numero: true,
      tipoMadeira: true,
      quantidadePrevistaM3: true,
      dataHoraSaidaPrevista: true,
      dataHoraChegadaPrevista: true,
      observacoes: true,
      fornecedor: { select: { id: true, nome: true } },
      fazenda: { select: { id: true, nome: true, cidade: true, estado: true, municipio: true, uf: true } },
      talhao: { select: { id: true, nome: true, codigo: true } },
      localEmbarque: { select: { id: true, nome: true, latitude: true, longitude: true } },
      documentos: {
        select: { id: true, tipo: true, numero: true, status: true, arquivo: true },
        orderBy: { createdAt: 'asc' as const },
      },
    },
  },
  eventos: {
    where: {
      tipo: {
        in: [
          'chegada_carregamento',
          'carregamento_iniciado',
          'carregamento_concluido',
          'status_alterado',
        ],
      },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 8,
    include: { user: { select: { id: true, nome: true, perfil: true } } },
  },
}

export interface FiltrosFilaQuery {
  placa?: string
  motoristaId?: string
  transportadoraId?: string
  status?: string
}

export function buildWhereFilaCarregamento(
  fazendaId: string,
  filtros: FiltrosFilaQuery,
): Prisma.ViagemWhereInput {
  const statusList =
    filtros.status && STATUS_FILA_CARREGAMENTO.includes(filtros.status as (typeof STATUS_FILA_CARREGAMENTO)[number])
      ? [filtros.status]
      : [...STATUS_FILA_CARREGAMENTO]

  const where: Prisma.ViagemWhereInput = {
    status: { in: statusList },
    agendamento: { fazendaId },
  }

  if (filtros.transportadoraId) {
    where.transportadoraId = filtros.transportadoraId
  }

  if (filtros.motoristaId) {
    where.motoristaId = filtros.motoristaId
  }

  if (filtros.placa?.trim()) {
    const placa = filtros.placa.trim()
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { veiculo: { placa: { contains: placa, mode: 'insensitive' } } },
          { veiculo: { placaCarreta: { contains: placa, mode: 'insensitive' } } },
        ],
      },
    ]
  }

  return where
}

export function extrairOpcoesFiltro(
  viagens: Array<{
    motorista: { id: string; nome: string } | null
    transportadora: { id: string; nome: string }
    veiculo: { placa: string } | null
  }>,
) {
  const transportadorasMap = new Map<string, { id: string; nome: string }>()
  const motoristasMap = new Map<string, { id: string; nome: string }>()

  for (const v of viagens) {
    transportadorasMap.set(v.transportadora.id, v.transportadora)
    if (v.motorista) motoristasMap.set(v.motorista.id, v.motorista)
  }

  return {
    transportadoras: [...transportadorasMap.values()].sort((a, b) => a.nome.localeCompare(b.nome)),
    motoristas: [...motoristasMap.values()].sort((a, b) => a.nome.localeCompare(b.nome)),
  }
}
