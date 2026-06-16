import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import {
  getRegrasAgendamento,
  getDisponibilidadeDia,
  validarHorarioAgendamento,
} from '../utils/agendamentoRules'

const router = Router()

const include = {
  transportadora: true,
  motorista: true,
  veiculo: true,
  fornecedor: true,
  fazenda: true,
  talhao: true,
  localEmbarque: true,
  user: { select: { id: true, nome: true, email: true } },
  viagem: true,
}

router.use(authMiddleware)

router.get('/regras', async (_req: AuthRequest, res: Response) => {
  try {
    const regras = await getRegrasAgendamento()
    res.set('Cache-Control', 'public, max-age=60')
    return res.json(regras)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar regras de agendamento' })
  }
})

router.get('/disponibilidade', async (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.query
    if (!data) return res.status(400).json({ error: 'Informe a data (YYYY-MM-DD)' })

    const disponibilidade = await getDisponibilidadeDia(data as string)
    return res.json(disponibilidade)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar disponibilidade' })
  }
})

router.get('/ocupados', async (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.query

    if (!data) {
      return res.status(400).json({ error: 'Informe a data (YYYY-MM-DD)' })
    }

    const disponibilidade = await getDisponibilidadeDia(data as string)
    const horarios = disponibilidade.slots
      .filter((s) => !s.disponivel)
      .map((s) => s.horario)

    return res.json({ horarios, disponibilidade })
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar horários ocupados' })
  }
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, data } = req.query
    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (data) {
      const d = new Date(data as string)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      where.dataHoraSaidaPrevista = { gte: d, lt: nextDay }
    }

    if (req.user!.perfil === 'transportador') {
      where.userId = req.user!.id
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return res.json(agendamentos)
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body

    if (!data.dataHoraSaidaPrevista) {
      return res.status(400).json({ error: 'Informe a data/hora de saída prevista' })
    }

    const validacao = await validarHorarioAgendamento(data.dataHoraSaidaPrevista)
    if (!validacao.ok) {
      return res.status(400).json({ error: validacao.error })
    }

    const numero = `AGD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const agendamento = await prisma.agendamento.create({
      data: { ...data, numero, userId: req.user!.id },
      include,
    })

    return res.status(201).json(agendamento)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao criar agendamento' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: req.params.id },
      include,
    })

    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' })

    return res.json(agendamento)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar agendamento' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agendamento = await prisma.agendamento.update({
      where: { id: req.params.id },
      data: req.body,
      include,
    })

    return res.json(agendamento)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar agendamento' })
  }
})

router.post('/:id/confirmar', async (req: AuthRequest, res: Response) => {
  try {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: req.params.id },
    })

    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' })

    const numero = `VGM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const [agendamentoAtualizado, viagem] = await prisma.$transaction([
      prisma.agendamento.update({
        where: { id: req.params.id },
        data: { status: 'confirmado' },
      }),
      prisma.viagem.create({
        data: {
          numero,
          agendamentoId: agendamento.id,
          transportadoraId: agendamento.transportadoraId,
          motoristaId: agendamento.motoristaId,
          veiculoId: agendamento.veiculoId,
          status: 'agendado',
          latEmbarque: req.body.latitude,
          lngEmbarque: req.body.longitude,
        },
      }),
    ])

    await prisma.eventoViagem.create({
      data: {
        viagemId: viagem.id,
        tipo: 'status_alterado',
        descricao: 'Viagem criada a partir do agendamento',
        statusNovo: 'agendado',
        userId: req.user!.id,
      },
    })

    return res.json({ agendamento: agendamentoAtualizado, viagem })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao confirmar agendamento' })
  }
})

export default router
