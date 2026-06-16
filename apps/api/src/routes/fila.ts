import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { httpCacheMiddleware, invalidateCachePrefix } from '../middleware/httpCache'
import { prisma } from '../lib/prisma'

const router = Router()

const viagemIncludeDetail = {
  motorista: true,
  veiculo: { include: { tipoVeiculo: true } },
  transportadora: true,
  documentos: { orderBy: { createdAt: 'asc' as const } },
  pesagens: { orderBy: { createdAt: 'desc' as const } },
  descargas: { orderBy: { createdAt: 'desc' as const }, take: 1 },
  checkins: {
    orderBy: { createdAt: 'desc' as const },
    include: { user: { select: { id: true, nome: true } } },
  },
  alertas: {
    where: { lido: false },
    orderBy: { createdAt: 'desc' as const },
    take: 5,
  },
  agendamento: {
    include: {
      transportadora: true,
      fazenda: true,
      talhao: true,
      fornecedor: true,
      localEmbarque: true,
    },
  },
}

/** Lista da fila — só o necessário para os cards (detalhe via GET /:id ou prefetch). */
const viagemIncludeList = {
  id: true,
  numero: true,
  status: true,
  motorista: { select: { id: true, nome: true, telefone: true } },
  veiculo: { select: { id: true, placa: true, tipo: true, placaCarreta: true } },
  transportadora: { select: { id: true, nome: true } },
  documentos: { select: { id: true, status: true, tipo: true } },
  agendamento: {
    select: {
      numero: true,
      tipoMadeira: true,
      quantidadePrevistaM3: true,
      dataHoraSaidaPrevista: true,
      dataHoraChegadaPrevista: true,
      transportadora: { select: { id: true, nome: true } },
      fazenda: { select: { id: true, nome: true, cidade: true, estado: true } },
      fornecedor: { select: { id: true, nome: true } },
    },
  },
}

function buildResumo(
  fila: Array<{ status: string; tempoEstimadoMin: number | null }>,
) {
  const porStatus = {
    aguardando_portaria: 0,
    aguardando_balanca: 0,
    aguardando_descarga: 0,
  }

  for (const item of fila) {
    if (item.status in porStatus) {
      porStatus[item.status as keyof typeof porStatus]++
    }
  }

  const tempos = fila
    .map((f) => f.tempoEstimadoMin)
    .filter((t): t is number => t != null)
  const tempoMedioEstimado = tempos.length
    ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
    : 0

  return { total: fila.length, ...porStatus, tempoMedioEstimado }
}

router.use(authMiddleware)

router.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next()
  res.on('finish', () => {
    if (res.statusCode < 400) invalidateCachePrefix('fila:')
  })
  next()
})

router.use(httpCacheMiddleware(8, 'fila:'))

router.get('/resumo', async (_req: AuthRequest, res: Response) => {
  try {
    const fila = await prisma.filaPatio.findMany({
      where: { status: { not: 'concluido' } },
      select: { status: true, tempoEstimadoMin: true },
    })
    return res.json(buildResumo(fila))
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar resumo da fila' })
  }
})

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const filaRows = await prisma.filaPatio.findMany({
      where: { status: { not: 'concluido' } },
      orderBy: [{ status: 'asc' }, { posicao: 'asc' }],
    })

    const viagemIds = [...new Set(filaRows.map((f) => f.viagemId))]
    const viagens = viagemIds.length
      ? await prisma.viagem.findMany({
          where: { id: { in: viagemIds } },
          select: viagemIncludeList,
        })
      : []

    const viagemById = new Map(viagens.map((v) => [v.id, v]))
    const fila = filaRows.map((row) => ({
      ...row,
      viagem: viagemById.get(row.viagemId) ?? null,
    }))

    return res.json({ items: fila, resumo: buildResumo(fila) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar fila' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.filaPatio.findUnique({
      where: { id: req.params.id },
      include: {
        viagem: { include: viagemIncludeDetail },
      },
    })

    if (!item) return res.status(404).json({ error: 'Item não encontrado na fila' })
    return res.json(item)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar item da fila' })
  }
})

router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body

    const item = await prisma.filaPatio.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        viagem: { select: viagemIncludeList },
      },
    })

    return res.json(item)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar status da fila' })
  }
})

export default router
