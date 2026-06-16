import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.post('/viagens/:viagemId/inicial', async (req: AuthRequest, res: Response) => {
  try {
    const { ticketBalanca, placa, pesoBrutoKg, operador, balanca } = req.body

    const pesagem = await prisma.pesagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'inicial',
        ticketBalanca,
        placa,
        pesoBrutoKg,
        operador,
        balanca,
        userId: req.user!.id,
      },
    })

    await prisma.viagem.update({
      where: { id: req.params.viagemId },
      data: { status: 'em_pesagem' },
    })

    await prisma.eventoViagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'pesagem_inicial',
        descricao: `Pesagem inicial registrada: ${pesoBrutoKg} kg`,
        statusNovo: 'em_pesagem',
        userId: req.user!.id,
      },
    })

    return res.status(201).json(pesagem)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao registrar pesagem inicial' })
  }
})

router.post('/viagens/:viagemId/final', async (req: AuthRequest, res: Response) => {
  try {
    const { placa, pesoBrutoKg, pesoTaraKg, operador, balanca, ticketBalanca } = req.body
    const pesoLiquidoKg = pesoBrutoKg - pesoTaraKg

    const pesagem = await prisma.pesagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'final',
        ticketBalanca,
        placa,
        pesoBrutoKg,
        pesoTaraKg,
        pesoLiquidoKg,
        operador,
        balanca,
        userId: req.user!.id,
      },
    })

    await prisma.viagem.update({
      where: { id: req.params.viagemId },
      data: { status: 'finalizado' },
    })

    await prisma.eventoViagem.create({
      data: {
        viagemId: req.params.viagemId,
        tipo: 'pesagem_final',
        descricao: `Pesagem final: Bruto ${pesoBrutoKg} kg | Tara ${pesoTaraKg} kg | Líquido ${pesoLiquidoKg} kg`,
        statusNovo: 'finalizado',
        userId: req.user!.id,
      },
    })

    return res.status(201).json(pesagem)
  } catch {
    return res.status(500).json({ error: 'Erro ao registrar pesagem final' })
  }
})

export default router
