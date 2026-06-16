import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.post('/viagens/:viagemId/liberar', async (req: AuthRequest, res: Response) => {
  try {
    const { doca, material, responsavel, observacoes } = req.body

    const descarga = await prisma.descarga.create({
      data: { viagemId: req.params.viagemId, doca, material, responsavel, observacoes, status: 'liberada' },
    })

    await prisma.viagem.update({
      where: { id: req.params.viagemId },
      data: { status: 'em_descarga' },
    })

    await prisma.eventoViagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'descarga_liberada',
        descricao: `Descarga liberada na ${doca}`,
        statusNovo: 'em_descarga',
        userId: req.user!.id,
      },
    })

    return res.status(201).json(descarga)
  } catch {
    return res.status(500).json({ error: 'Erro ao liberar descarga' })
  }
})

router.post('/viagens/:viagemId/finalizar', async (req: AuthRequest, res: Response) => {
  try {
    const descarga = await prisma.descarga.updateMany({
      where: { viagemId: req.params.viagemId },
      data: { status: 'concluida' },
    })

    await prisma.eventoViagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'descarga_concluida',
        descricao: 'Descarga concluída',
        statusNovo: 'em_descarga',
        userId: req.user!.id,
      },
    })

    return res.json(descarga)
  } catch {
    return res.status(500).json({ error: 'Erro ao finalizar descarga' })
  }
})

export default router
