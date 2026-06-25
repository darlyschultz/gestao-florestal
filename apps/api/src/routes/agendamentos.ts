import { Router, Response } from 'express'
import { randomUUID } from 'crypto'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import {
  getRegrasAgendamento,
  getDisponibilidadeDia,
  validarHorarioAgendamento,
} from '../utils/agendamentoRules'
import {
  dadosOperacionaisCompletos,
  enriquecerAgendamento,
} from '../utils/agendamentoCompleteness'

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
  documentos: { orderBy: { createdAt: 'asc' as const } },
}

function gerarNumero(prefix = 'AGD') {
  return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`
}

async function getTransportadoraIdUsuario(userId: string, perfil: string) {
  if (perfil !== 'transportador' && perfil !== 'motorista') return undefined
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { transportadoraId: true },
  })
  return user?.transportadoraId ?? undefined
}

async function enriquecerLista(agendamentos: Awaited<ReturnType<typeof prisma.agendamento.findMany>>) {
  const regras = await getRegrasAgendamento()
  return agendamentos.map((ag) =>
    enriquecerAgendamento(ag as Parameters<typeof enriquecerAgendamento>[0], regras),
  )
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
    return res.json(await getDisponibilidadeDia(data as string))
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar disponibilidade' })
  }
})

router.get('/ocupados', async (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.query
    if (!data) return res.status(400).json({ error: 'Informe a data (YYYY-MM-DD)' })
    const disponibilidade = await getDisponibilidadeDia(data as string)
    const horarios = disponibilidade.slots.filter((s) => !s.disponivel).map((s) => s.horario)
    return res.json({ horarios, disponibilidade })
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar horários ocupados' })
  }
})

/** Resumo mensal para calendário: reservas e pendências por dia */
router.get('/calendario-resumo', async (req: AuthRequest, res: Response) => {
  try {
    const mes = (req.query.mes as string) || new Date().toISOString().slice(0, 7)
    const [ano, mesNum] = mes.split('-').map(Number)
    const inicio = new Date(ano, mesNum - 1, 1)
    const fim = new Date(ano, mesNum, 1)

    const where: Record<string, unknown> = {
      status: { not: 'cancelado' },
      dataHoraSaidaPrevista: { gte: inicio, lt: fim },
    }

    if (req.user!.perfil === 'transportador') {
      where.userId = req.user!.id
    } else if (req.user!.perfil === 'motorista') {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
      if (user?.motoristaCadastroId) where.motoristaId = user.motoristaCadastroId
      else where.id = 'impossivel'
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: { documentos: true },
    })

    const regras = await getRegrasAgendamento()
    const porDia: Record<string, { total: number; incompletos: number; preAgendados: number }> = {}

    for (const ag of agendamentos) {
      const dia = ag.dataHoraSaidaPrevista.toISOString().slice(0, 10)
      if (!porDia[dia]) porDia[dia] = { total: 0, incompletos: 0, preAgendados: 0 }
      porDia[dia].total++
      if (ag.status === 'pre_agendado') porDia[dia].preAgendados++
      const enriched = enriquecerAgendamento(ag, regras)
      if (!enriched.prontoConfirmar) porDia[dia].incompletos++
    }

    return res.json({ mes, dias: porDia })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao buscar resumo do calendário' })
  }
})

/** Contexto auto-preenchido para motorista logado */
router.get('/motorista/contexto', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.perfil !== 'motorista') {
      return res.status(403).json({ error: 'Acesso apenas para motoristas' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        transportadora: { select: { id: true, nome: true } },
        motoristaCadastro: {
          include: {
            transportadora: { select: { id: true, nome: true } },
          },
        },
      },
    })

    if (!user?.motoristaCadastro) {
      return res.status(404).json({
        error: 'Usuário motorista sem vínculo ao cadastro. Solicite ao administrador.',
      })
    }

    const veiculos = await prisma.veiculo.findMany({
      where: {
        transportadoraId: user.motoristaCadastro.transportadoraId,
        active: true,
      },
      select: { id: true, placa: true, tipo: true, placaCarreta: true },
      orderBy: { placa: 'asc' },
    })

    return res.json({
      transportadoraId: user.motoristaCadastro.transportadoraId,
      transportadora: user.motoristaCadastro.transportadora,
      motoristaId: user.motoristaCadastro.id,
      motorista: {
        id: user.motoristaCadastro.id,
        nome: user.motoristaCadastro.nome,
        telefone: user.motoristaCadastro.telefone,
        cnh: user.motoristaCadastro.cnh,
      },
      veiculos,
    })
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar contexto do motorista' })
  }
})

/** Pré-reserva de um ou vários horários (fecha slot, completa dados depois) */
router.post('/pre-agendar', async (req: AuthRequest, res: Response) => {
  try {
    const { transportadoraId, horarios, motoristaId, veiculoId } = req.body as {
      transportadoraId?: string
      horarios?: string[]
      motoristaId?: string
      veiculoId?: string
    }

    if (!horarios?.length) {
      return res.status(400).json({ error: 'Informe ao menos um horário' })
    }

    let transpId = transportadoraId
    const userTransp = await getTransportadoraIdUsuario(req.user!.id, req.user!.perfil)
    if (userTransp) transpId = userTransp
    if (!transpId) {
      return res.status(400).json({ error: 'Informe a transportadora' })
    }

    let motId = motoristaId
    let veicId = veiculoId
    if (req.user!.perfil === 'motorista') {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
      if (user?.motoristaCadastroId) motId = user.motoristaCadastroId
    }

    for (const h of horarios) {
      const validacao = await validarHorarioAgendamento(h)
      if (!validacao.ok) {
        return res.status(400).json({ error: `${h}: ${validacao.error}` })
      }
    }

    const grupoReservaId = randomUUID()
    const criados = []

    for (const dataHoraSaidaPrevista of horarios) {
      const ag = await prisma.agendamento.create({
        data: {
          numero: gerarNumero(),
          transportadoraId: transpId,
          motoristaId: motId || null,
          veiculoId: veicId || null,
          dataHoraSaidaPrevista: new Date(dataHoraSaidaPrevista),
          status: 'pre_agendado',
          grupoReservaId,
          userId: req.user!.id,
        },
        include,
      })
      criados.push(enriquecerAgendamento(ag, await getRegrasAgendamento()))
    }

    return res.status(201).json({ grupoReservaId, agendamentos: criados, total: criados.length })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao pré-agendar horários' })
  }
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, data, mes, incompletos } = req.query
    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (data) {
      const d = new Date(data as string)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      where.dataHoraSaidaPrevista = { gte: d, lt: nextDay }
    }
    if (mes) {
      const [ano, mesNum] = (mes as string).split('-').map(Number)
      where.dataHoraSaidaPrevista = {
        gte: new Date(ano, mesNum - 1, 1),
        lt: new Date(ano, mesNum, 1),
      }
    }

    if (req.user!.perfil === 'transportador') {
      where.userId = req.user!.id
    } else if (req.user!.perfil === 'motorista') {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
      if (user?.motoristaCadastroId) where.motoristaId = user.motoristaCadastroId
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      include,
      orderBy: { dataHoraSaidaPrevista: 'asc' },
      take: 200,
    })

    let lista = await enriquecerLista(agendamentos)
    if (incompletos === 'true') {
      lista = lista.filter((a) => !a.prontoConfirmar)
    }

    return res.json(lista)
  } catch (error) {
    console.error(error)
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

    const userTransp = await getTransportadoraIdUsuario(req.user!.id, req.user!.perfil)
    if (userTransp) data.transportadoraId = userTransp

    const agendamento = await prisma.agendamento.create({
      data: {
        ...data,
        numero: gerarNumero(),
        userId: req.user!.id,
        status: data.status || (dadosOperacionaisCompletos(data) ? 'agendado' : 'pre_agendado'),
      },
      include,
    })

    const regras = await getRegrasAgendamento()
    return res.status(201).json(enriquecerAgendamento(agendamento, regras))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao criar agendamento' })
  }
})

router.get('/:id/pendencias', async (req: AuthRequest, res: Response) => {
  try {
    const ag = await prisma.agendamento.findUnique({
      where: { id: req.params.id },
      include: { documentos: true, viagem: true },
    })
    if (!ag) return res.status(404).json({ error: 'Agendamento não encontrado' })

    const regras = await getRegrasAgendamento()
    const enriched = enriquecerAgendamento(ag, regras, {
      lat: ag.viagem?.latEmbarque,
      lng: ag.viagem?.lngEmbarque,
    })
    return res.json({
      pendencias: enriched.pendencias,
      dadosCompletos: enriched.dadosCompletos,
      prontoConfirmar: enriched.prontoConfirmar,
    })
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar pendências' })
  }
})

router.get('/:id/documentos', async (req: AuthRequest, res: Response) => {
  try {
    const docs = await prisma.documentoAgendamento.findMany({
      where: { agendamentoId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })
    return res.json(docs)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar documentos' })
  }
})

router.post('/:id/documentos', async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, numero, arquivo } = req.body
    if (!tipo) return res.status(400).json({ error: 'Informe o tipo do documento' })

    const existente = await prisma.documentoAgendamento.findFirst({
      where: { agendamentoId: req.params.id, tipo },
    })

    const doc = existente
      ? await prisma.documentoAgendamento.update({
          where: { id: existente.id },
          data: { numero, arquivo, status: numero ? 'pendente' : 'pendente' },
        })
      : await prisma.documentoAgendamento.create({
          data: {
            agendamentoId: req.params.id,
            tipo,
            numero,
            arquivo,
          },
        })

    return res.status(existente ? 200 : 201).json(doc)
  } catch {
    return res.status(500).json({ error: 'Erro ao salvar documento' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: req.params.id },
      include,
    })
    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' })
    const regras = await getRegrasAgendamento()
    return res.json(enriquecerAgendamento(agendamento, regras))
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar agendamento' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body }
    delete body.id
    delete body.numero
    delete body.userId
    delete body.createdAt

    const atual = await prisma.agendamento.findUnique({ where: { id: req.params.id } })
    if (!atual) return res.status(404).json({ error: 'Agendamento não encontrado' })

    if (body.dataHoraSaidaPrevista && body.dataHoraSaidaPrevista !== atual.dataHoraSaidaPrevista.toISOString()) {
      const validacao = await validarHorarioAgendamento(body.dataHoraSaidaPrevista)
      if (!validacao.ok) return res.status(400).json({ error: validacao.error })
    }

    const merged = { ...atual, ...body }
    const novoStatus =
      atual.status === 'confirmado'
        ? 'confirmado'
        : dadosOperacionaisCompletos(merged as typeof atual)
          ? 'agendado'
          : 'pre_agendado'

    const agendamento = await prisma.agendamento.update({
      where: { id: req.params.id },
      data: { ...body, status: novoStatus },
      include,
    })

    const regras = await getRegrasAgendamento()
    return res.json(enriquecerAgendamento(agendamento, regras))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao atualizar agendamento' })
  }
})

router.post('/:id/confirmar', async (req: AuthRequest, res: Response) => {
  try {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: req.params.id },
      include: { documentos: true },
    })

    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado' })
    if (agendamento.status === 'confirmado') {
      return res.status(400).json({ error: 'Agendamento já confirmado' })
    }

    const regras = await getRegrasAgendamento()
    const enriched = enriquecerAgendamento(agendamento, regras, {
      lat: req.body.latitude,
      lng: req.body.longitude,
    })

    if (!enriched.dadosCompletos) {
      return res.status(400).json({
        error: 'Complete os dados operacionais antes de confirmar',
        pendencias: enriched.pendencias,
      })
    }

    if (!enriched.prontoConfirmar) {
      return res.status(400).json({
        error: 'Existem pendências no agendamento',
        pendencias: enriched.pendencias,
      })
    }

    const numero = gerarNumero('VGM')

    const [agendamentoAtualizado, viagem] = await prisma.$transaction(async (tx) => {
      const agUp = await tx.agendamento.update({
        where: { id: req.params.id },
        data: { status: 'confirmado' },
      })

      const viagemCriada = await tx.viagem.create({
        data: {
          numero,
          agendamentoId: agendamento.id,
          transportadoraId: agendamento.transportadoraId,
          motoristaId: agendamento.motoristaId!,
          veiculoId: agendamento.veiculoId!,
          status: 'agendado',
          latEmbarque: req.body.latitude,
          lngEmbarque: req.body.longitude,
        },
      })

      if (agendamento.documentos.length) {
        await tx.documentoViagem.createMany({
          data: agendamento.documentos.map((d) => ({
            viagemId: viagemCriada.id,
            tipo: d.tipo,
            numero: d.numero,
            arquivo: d.arquivo,
            status: d.status,
          })),
        })
      }

      await tx.eventoViagem.create({
        data: {
          viagemId: viagemCriada.id,
          tipo: 'status_alterado',
          descricao: 'Viagem criada a partir do agendamento',
          statusNovo: 'agendado',
          userId: req.user!.id,
        },
      })

      return [agUp, viagemCriada]
    })

    return res.json({ agendamento: agendamentoAtualizado, viagem })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao confirmar agendamento' })
  }
})

export default router
