import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

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
          include: { transportadora: true, motorista: true, veiculo: true, fornecedor: true, fazenda: true },
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
