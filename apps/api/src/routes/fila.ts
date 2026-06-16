import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

const viagemInclude = {
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

router.use(authMiddleware)

router.get('/resumo', async (_req: AuthRequest, res: Response) => {
  try {
    const fila = await prisma.filaPatio.findMany({
      where: { status: { not: 'concluido' } },
      select: { status: true, tempoEstimadoMin: true, createdAt: true },
    })

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
      .map((f: { tempoEstimadoMin: number | null }) => f.tempoEstimadoMin)
      .filter((t): t is number => t != null)
    const tempoMedioEstimado = tempos.length
      ? Math.round(tempos.reduce((a: number, b: number) => a + b, 0) / tempos.length)
      : 0

    return res.json({
      total: fila.length,
      ...porStatus,
      tempoMedioEstimado,
    })
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar resumo da fila' })
  }
})

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const fila = await prisma.filaPatio.findMany({
      where: { status: { not: 'concluido' } },
      include: {
        viagem: { include: viagemInclude },
      },
      orderBy: [{ status: 'asc' }, { posicao: 'asc' }],
    })

    return res.json(fila)
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
        viagem: { include: viagemInclude },
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
        viagem: { include: viagemInclude },
      },
    })

    return res.json(item)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar status da fila' })
  }
})

export default router
