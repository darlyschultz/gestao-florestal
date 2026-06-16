import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { httpCacheMiddleware, invalidateCachePrefix } from '../middleware/httpCache'
import { prisma } from '../lib/prisma'
import { viagemListInclude } from '../lib/queryIncludes'

const router = Router()

const includeDetail = {
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
  transportadora: true,
  motorista: true,
  veiculo: true,
  documentos: true,
  alertas: { orderBy: { createdAt: 'desc' as const } },
  pesagens: true,
  descargas: true,
}

router.use(authMiddleware)

router.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next()
  res.on('finish', () => {
    if (res.statusCode < 400) invalidateCachePrefix('viagens:')
  })
  next()
})

router.use(httpCacheMiddleware(8, 'viagens:'))

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query
    const where: Record<string, unknown> = {}

    if (status && status !== 'todos') where.status = status

    const viagens = await prisma.viagem.findMany({
      where,
      include: viagemListInclude,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    return res.json(viagens)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar viagens' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const viagem = await prisma.viagem.findUnique({
      where: { id: req.params.id },
      include: includeDetail,
    })

    if (!viagem) return res.status(404).json({ error: 'Viagem não encontrada' })

    return res.json(viagem)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar viagem' })
  }
})

router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status, latitude, longitude } = req.body

    const viagem = await prisma.viagem.findUnique({ where: { id: req.params.id } })
    if (!viagem) return res.status(404).json({ error: 'Viagem não encontrada' })

    const atualizada = await prisma.viagem.update({
      where: { id: req.params.id },
      data: { status, latAtual: latitude, lngAtual: longitude },
      include: includeDetail,
    })

    await prisma.eventoViagem.create({
      data: {
        viagemId: req.params.id,
        tipo: 'status_alterado',
        descricao: `Status alterado para: ${status}`,
        statusAnterior: viagem.status,
        statusNovo: status,
        latitude,
        longitude,
        userId: req.user!.id,
      },
    })

    return res.json(atualizada)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar status' })
  }
})

router.get('/:id/historico', async (req: AuthRequest, res: Response) => {
  try {
    const eventos = await prisma.eventoViagem.findMany({
      where: { viagemId: req.params.id },
      include: { user: { select: { id: true, nome: true, perfil: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return res.json(eventos)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar histórico' })
  }
})

router.get('/:id/alertas', async (req: AuthRequest, res: Response) => {
  try {
    const alertas = await prisma.alertaViagem.findMany({
      where: { viagemId: req.params.id },
      orderBy: { createdAt: 'desc' },
    })

    return res.json(alertas)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar alertas' })
  }
})

router.post('/:id/posicao', async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, velocidade } = req.body

    const posicao = await prisma.posicaoViagem.create({
      data: {
        viagemId: req.params.id,
        motoristaId: req.body.motoristaId,
        latitude,
        longitude,
        velocidade,
      },
    })

    await prisma.viagem.update({
      where: { id: req.params.id },
      data: { latAtual: latitude, lngAtual: longitude },
    })

    return res.json(posicao)
  } catch {
    return res.status(500).json({ error: 'Erro ao registrar posição' })
  }
})

router.get('/:id/posicoes', async (req: AuthRequest, res: Response) => {
  try {
    const posicoes = await prisma.posicaoViagem.findMany({
      where: { viagemId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })

    return res.json(posicoes)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar posições' })
  }
})

export default router
