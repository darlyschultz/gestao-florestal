import { prisma } from '../lib/prisma'
import type { AuthRequest } from '../middleware/auth'

export const STATUS_FILA_CARREGAMENTO = [
  'agendado',
  'aguardando_carregamento',
  'em_carregamento',
  'carregado',
] as const

const TRANSICOES: Record<string, { de: string[]; para: string }> = {
  registrar_chegada: {
    de: ['agendado'],
    para: 'aguardando_carregamento',
  },
  iniciar: {
    de: ['agendado', 'aguardando_carregamento'],
    para: 'em_carregamento',
  },
  concluir: {
    de: ['em_carregamento'],
    para: 'carregado',
  },
}

export async function resolveFazendaEscopo(req: AuthRequest, queryFazendaId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { perfil: true, fazendaId: true, fazenda: { select: { id: true, nome: true } } },
  })

  if (!user) throw new CarregamentoError('Usuário não encontrado', 401)

  if (user.perfil === 'operador_area') {
    if (!user.fazendaId) {
      throw new CarregamentoError('Operador sem fazenda vinculada. Contate o administrador.', 403)
    }
    return { fazendaId: user.fazendaId, fazenda: user.fazenda, perfil: user.perfil }
  }

  if (user.perfil === 'admin' || user.perfil === 'gestor') {
    if (queryFazendaId) {
      const fazenda = await prisma.fazenda.findUnique({
        where: { id: queryFazendaId },
        select: { id: true, nome: true },
      })
      if (!fazenda) throw new CarregamentoError('Fazenda não encontrada', 404)
      return { fazendaId: fazenda.id, fazenda, perfil: user.perfil }
    }
    return { fazendaId: null as string | null, fazenda: null, perfil: user.perfil }
  }

  throw new CarregamentoError('Sem permissão para operações de carregamento', 403)
}

export async function assertViagemNaFazenda(viagemId: string, fazendaId: string) {
  const viagem = await prisma.viagem.findUnique({
    where: { id: viagemId },
    include: {
      agendamento: {
        select: {
          fazendaId: true,
          fazenda: { select: { id: true, nome: true } },
          talhao: { select: { id: true, nome: true } },
          localEmbarque: { select: { id: true, nome: true } },
        },
      },
    },
  })

  if (!viagem) throw new CarregamentoError('Viagem não encontrada', 404)
  if (viagem.agendamento?.fazendaId !== fazendaId) {
    throw new CarregamentoError('Esta viagem não pertence à sua área de carregamento', 403)
  }

  return viagem
}

export function validarTransicao(acao: keyof typeof TRANSICOES, statusAtual: string) {
  const regra = TRANSICOES[acao]
  if (!regra.de.includes(statusAtual)) {
    throw new CarregamentoError(
      `Não é possível ${labelAcao(acao)} com status atual "${statusAtual}"`,
      400,
    )
  }
  return regra.para
}

function labelAcao(acao: keyof typeof TRANSICOES): string {
  const labels: Record<keyof typeof TRANSICOES, string> = {
    registrar_chegada: 'registrar chegada',
    iniciar: 'iniciar carregamento',
    concluir: 'concluir carregamento',
  }
  return labels[acao]
}

export class CarregamentoError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function registrarEventoCarregamento(
  viagemId: string,
  userId: string,
  descricao: string,
  statusAnterior: string,
  statusNovo: string,
  tipo: string,
) {
  await prisma.eventoViagem.create({
    data: {
      viagemId,
      tipo,
      descricao,
      statusAnterior,
      statusNovo,
      userId,
    },
  })
}
