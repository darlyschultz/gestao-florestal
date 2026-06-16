import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.get('/operacional', async (_req: AuthRequest, res: Response) => {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const [emTransito, emFila, emDescarga, finalizadosHoje, atrasados, alertasCriticos] =
      await Promise.all([
        prisma.viagem.count({ where: { status: 'em_transito' } }),
        prisma.filaPatio.count({ where: { status: { not: 'concluido' } } }),
        prisma.viagem.count({ where: { status: 'em_descarga' } }),
        prisma.viagem.count({ where: { status: 'finalizado', updatedAt: { gte: hoje, lt: amanha } } }),
        prisma.viagem.count({
          where: {
            status: { in: ['em_transito', 'agendado'] },
            agendamento: { dataHoraChegadaPrevista: { lt: new Date() } },
          },
        }),
        prisma.alertaViagem.count({ where: { severidade: 'critica', lido: false } }),
      ])

    const chegadasPorHora = await prisma.$queryRaw<{ hora: number; total: number }[]>`
      SELECT
        CAST(EXTRACT(HOUR FROM "updatedAt") AS INTEGER) as hora,
        CAST(COUNT(*) AS INTEGER) as total
      FROM viagens
      WHERE status = 'finalizado'
        AND "updatedAt" >= ${hoje}
      GROUP BY hora
      ORDER BY hora
    `

    const chegadasHoje = await prisma.viagem.findMany({
      where: { updatedAt: { gte: hoje }, status: { in: ['portaria', 'em_pesagem', 'em_descarga', 'finalizado'] } },
      include: {
        veiculo: true,
        motorista: true,
        agendamento: { include: { transportadora: true, fazenda: true } },
      },
      take: 15,
      orderBy: { updatedAt: 'desc' },
    })

    return res.json({
      cards: { emTransito, emFila, emDescarga, finalizadosHoje, atrasados, alertasCriticos },
      chegadasPorHora,
      chegadasHoje,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar dados do dashboard' })
  }
})

router.get('/indicadores', async (req: AuthRequest, res: Response) => {
  try {
    const { de, ate, transportadoraId, fornecedorId } = req.query

    const onde: Record<string, unknown> = {}
    if (de && ate) {
      onde.createdAt = { gte: new Date(de as string), lte: new Date(ate as string) }
    }
    if (transportadoraId) onde.transportadoraId = transportadoraId
    if (fornecedorId) {
      onde.agendamento = { fornecedorId }
    }

    const [totalViagens, finalizadas, pesagens] = await Promise.all([
      prisma.viagem.count({ where: onde }),
      prisma.viagem.count({ where: { ...onde, status: 'finalizado' } }),
      prisma.pesagem.findMany({
        where: { tipo: 'final', viagem: onde as object },
      }),
    ])

    const volumeTotal = pesagens.reduce(
      (acc: number, p: { pesoLiquidoKg: number | null }) => acc + (p.pesoLiquidoKg || 0),
      0
    )

    const rankingTransportadoras = await prisma.viagem.groupBy({
      by: ['transportadoraId'],
      _count: { id: true },
      where: onde,
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const transportadorasDetalhes = await prisma.transportadora.findMany({
      where: {
        id: { in: rankingTransportadoras.map((r: { transportadoraId: string }) => r.transportadoraId) },
      },
      select: { id: true, nome: true },
    })

    const ranking = rankingTransportadoras.map((r: { transportadoraId: string; _count: { id: number } }) => ({
      ...r,
      transportadora: transportadorasDetalhes.find((t: { id: string }) => t.id === r.transportadoraId),
    }))

    return res.json({
      totalViagens,
      finalizadas,
      volumeTotalKg: volumeTotal,
      rankingTransportadoras: ranking,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar indicadores' })
  }
})

export default router
