import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import type { Prisma } from '@prisma/client'

const router = Router()

const agendamentoInclude = {
  transportadora: true,
  motorista: true,
  veiculo: true,
  fornecedor: true,
  fazenda: true,
  talhao: true,
  localEmbarque: true,
  viagem: {
    include: {
      documentos: true,
      motorista: true,
      veiculo: true,
      transportadora: true,
    },
  },
} satisfies Prisma.AgendamentoInclude

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function buildDateRange(periodo?: string, data?: string): Prisma.DateTimeFilter | undefined {
  if (data) {
    const d = startOfDay(new Date(data))
    const nextDay = new Date(d)
    nextDay.setDate(nextDay.getDate() + 1)
    return { gte: d, lt: nextDay }
  }

  const hoje = startOfDay(new Date())

  switch (periodo) {
    case 'hoje':
      return { gte: hoje, lt: new Date(hoje.getTime() + 24 * 60 * 60 * 1000) }
    case 'amanha': {
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)
      const depoisAmanha = new Date(amanha)
      depoisAmanha.setDate(depoisAmanha.getDate() + 1)
      return { gte: amanha, lt: depoisAmanha }
    }
    case 'semana': {
      const fimSemana = new Date(hoje)
      fimSemana.setDate(fimSemana.getDate() + 7)
      return { gte: hoje, lte: endOfDay(fimSemana) }
    }
    default:
      return undefined
  }
}

/** Status de viagem que ainda não passaram pelo check-in na portaria */
const STATUS_PENDENTE_CHECKIN = ['agendado', 'em_transito', 'proximo_fabrica'] as const

function applyStatusFilter(
  where: Prisma.AgendamentoWhereInput,
  status?: string,
): void {
  if (!status || status === 'todos') return

  switch (status) {
    case 'pendente_checkin':
      where.viagem = { status: { in: [...STATUS_PENDENTE_CHECKIN] } }
      break
    case 'sem_viagem':
      where.viagem = { is: null }
      break
    case 'operacao':
      where.viagem = { status: { in: ['portaria', 'em_pesagem', 'em_descarga'] } }
      break
    default:
      where.viagem = { status: status as string }
      break
  }
}

router.use(authMiddleware)

router.get('/agendamentos', async (req: AuthRequest, res: Response) => {
  try {
    const {
      q,
      periodo,
      data,
      status = 'pendente_checkin',
      ordenar = 'chegada',
      ordem = 'asc',
    } = req.query
    const where: Prisma.AgendamentoWhereInput = {}

    const dateRange = buildDateRange(periodo as string | undefined, data as string | undefined)
    if (dateRange) {
      where.dataHoraChegadaPrevista = dateRange
    }

    applyStatusFilter(where, status as string)

    if (q) {
      const term = q as string
      where.OR = [
        { numero: { contains: term, mode: 'insensitive' } },
        { veiculo: { placa: { contains: term, mode: 'insensitive' } } },
        { motorista: { nome: { contains: term, mode: 'insensitive' } } },
        { transportadora: { nome: { contains: term, mode: 'insensitive' } } },
        { fazenda: { nome: { contains: term, mode: 'insensitive' } } },
        { viagem: { numero: { contains: term, mode: 'insensitive' } } },
        { viagem: { documentos: { some: { numero: { contains: term, mode: 'insensitive' } } } } },
      ]
    }

    const direction = ordem === 'desc' ? 'desc' : 'asc'
    let orderBy: Prisma.AgendamentoOrderByWithRelationInput

    switch (ordenar) {
      case 'saida':
        orderBy = { dataHoraSaidaPrevista: direction }
        break
      case 'placa':
        orderBy = { veiculo: { placa: direction } }
        break
      case 'numero':
        orderBy = { numero: direction }
        break
      case 'chegada':
      default:
        orderBy = { dataHoraChegadaPrevista: direction }
        break
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: agendamentoInclude,
      orderBy,
    })

    return res.json(agendamentos)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' })
  }
})

router.get('/buscar', async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query

    if (!q) return res.status(400).json({ error: 'Informe um termo de busca' })

    const viagens = await prisma.viagem.findMany({
      where: {
        OR: [
          { numero: { contains: q as string } },
          { veiculo: { placa: { contains: q as string } } },
          { agendamento: { numero: { contains: q as string } } },
          { documentos: { some: { numero: { contains: q as string } } } },
        ],
        status: { in: ['agendado', 'em_transito', 'proximo_fabrica', 'portaria'] },
      },
      include: {
        agendamento: {
          include: {
            transportadora: true,
            motorista: true,
            veiculo: true,
            fornecedor: true,
            fazenda: true,
            talhao: true,
            localEmbarque: true,
          },
        },
        motorista: true,
        veiculo: true,
        documentos: true,
      },
    })

    return res.json(viagens)
  } catch {
    return res.status(500).json({ error: 'Erro na busca' })
  }
})

router.post('/:viagemId/checkin', async (req: AuthRequest, res: Response) => {
  try {
    const viagem = await prisma.viagem.findUnique({ where: { id: req.params.viagemId } })
    if (!viagem) return res.status(404).json({ error: 'Viagem não encontrada' })

    const checkin = await prisma.portariaCheckin.create({
      data: { viagemId: req.params.viagemId, userId: req.user!.id, acao: 'checkin' },
    })

    return res.json(checkin)
  } catch {
    return res.status(500).json({ error: 'Erro ao realizar check-in' })
  }
})

router.post('/:viagemId/liberar', async (req: AuthRequest, res: Response) => {
  try {
    const [viagem, checkin] = await prisma.$transaction([
      prisma.viagem.update({
        where: { id: req.params.viagemId },
        data: { status: 'portaria' },
      }),
      prisma.portariaCheckin.create({
        data: { viagemId: req.params.viagemId, userId: req.user!.id, acao: 'liberado' },
      }),
    ])

    await prisma.eventoViagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'portaria_liberada',
        descricao: 'Entrada liberada na portaria',
        statusAnterior: 'em_transito',
        statusNovo: 'portaria',
        userId: req.user!.id,
      },
    })

    await prisma.filaPatio.create({
      data: {
        viagemId: req.params.viagemId,
        posicao: await prisma.filaPatio.count({ where: { status: 'aguardando_balanca' } }) + 1,
        status: 'aguardando_balanca',
        tempoEstimadoMin: 20,
      },
    })

    return res.json({ viagem, checkin })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao liberar entrada' })
  }
})

router.post('/:viagemId/bloquear', async (req: AuthRequest, res: Response) => {
  try {
    const { motivo } = req.body

    const [viagem, checkin] = await prisma.$transaction([
      prisma.viagem.update({
        where: { id: req.params.viagemId },
        data: { status: 'bloqueado' },
      }),
      prisma.portariaCheckin.create({
        data: { viagemId: req.params.viagemId, userId: req.user!.id, acao: 'bloqueado', motivo },
      }),
    ])

    await prisma.eventoViagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'portaria_bloqueada',
        descricao: `Entrada bloqueada: ${motivo || 'Sem motivo informado'}`,
        statusNovo: 'bloqueado',
        userId: req.user!.id,
      },
    })

    return res.json({ viagem, checkin })
  } catch {
    return res.status(500).json({ error: 'Erro ao bloquear entrada' })
  }
})

export default router
