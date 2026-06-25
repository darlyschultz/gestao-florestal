import { Router, Response } from 'express'
import { authMiddleware, AuthRequest, requirePerfil } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import {
  CarregamentoError,
  STATUS_FILA_CARREGAMENTO,
  assertViagemNaFazenda,
  registrarEventoCarregamento,
  resolveFazendaEscopo,
  validarTransicao,
} from '../utils/carregamentoArea'
import {
  buildWhereFilaCarregamento,
  extrairOpcoesFiltro,
  viagemIncludeCarregamento,
} from '../utils/carregamentoFila'

const router = Router()

router.use(authMiddleware)
router.use(requirePerfil('operador_area', 'admin', 'gestor'))

function handleError(res: Response, error: unknown) {
  if (error instanceof CarregamentoError) {
    return res.status(error.status).json({ error: error.message })
  }
  console.error(error)
  return res.status(500).json({ error: 'Erro na operação de carregamento' })
}

function parseFiltros(query: AuthRequest['query']) {
  return {
    placa: typeof query.placa === 'string' ? query.placa : undefined,
    motoristaId: typeof query.motoristaId === 'string' ? query.motoristaId : undefined,
    transportadoraId: typeof query.transportadoraId === 'string' ? query.transportadoraId : undefined,
    status: typeof query.status === 'string' ? query.status : undefined,
  }
}

router.get('/fila', async (req: AuthRequest, res: Response) => {
  try {
    const escopo = await resolveFazendaEscopo(req, req.query.fazendaId as string | undefined)
    if (!escopo.fazendaId) {
      return res.status(400).json({ error: 'Informe fazendaId para listar a fila' })
    }

    const filtros = parseFiltros(req.query)
    const whereBase = {
      status: { in: [...STATUS_FILA_CARREGAMENTO] },
      agendamento: { fazendaId: escopo.fazendaId },
    }

    const [viagens, todasNaFila] = await Promise.all([
      prisma.viagem.findMany({
        where: buildWhereFilaCarregamento(escopo.fazendaId, filtros),
        include: viagemIncludeCarregamento,
        orderBy: [{ status: 'asc' }, { updatedAt: 'asc' }],
      }),
      prisma.viagem.findMany({
        where: whereBase,
        select: {
          motorista: { select: { id: true, nome: true } },
          transportadora: { select: { id: true, nome: true } },
          veiculo: { select: { placa: true } },
        },
      }),
    ])

    const opcoesFiltro = extrairOpcoesFiltro(todasNaFila)

    return res.json({
      fazenda: escopo.fazenda,
      viagens,
      total: viagens.length,
      totalNaFila: todasNaFila.length,
      opcoesFiltro,
      filtrosAplicados: filtros,
    })
  } catch (error) {
    return handleError(res, error)
  }
})

router.get('/viagens/:viagemId', async (req: AuthRequest, res: Response) => {
  try {
    const escopo = await resolveFazendaEscopo(req, req.query.fazendaId as string | undefined)
    if (!escopo.fazendaId) {
      return res.status(403).json({ error: 'Operação disponível apenas para operador de área' })
    }

    await assertViagemNaFazenda(req.params.viagemId, escopo.fazendaId)

    const viagem = await prisma.viagem.findUnique({
      where: { id: req.params.viagemId },
      include: viagemIncludeCarregamento,
    })

    if (!viagem) return res.status(404).json({ error: 'Viagem não encontrada' })

    return res.json(viagem)
  } catch (error) {
    return handleError(res, error)
  }
})

router.get('/resumo', async (req: AuthRequest, res: Response) => {
  try {
    const escopo = await resolveFazendaEscopo(req, req.query.fazendaId as string | undefined)
    if (!escopo.fazendaId) {
      return res.status(400).json({ error: 'Informe fazendaId para o resumo' })
    }

    const viagens = await prisma.viagem.findMany({
      where: {
        status: { in: [...STATUS_FILA_CARREGAMENTO] },
        agendamento: { fazendaId: escopo.fazendaId },
      },
      select: { status: true },
    })

    const resumo = {
      total: viagens.length,
      agendado: 0,
      aguardando_carregamento: 0,
      em_carregamento: 0,
      carregado: 0,
    }

    for (const v of viagens) {
      if (v.status in resumo) {
        resumo[v.status as keyof typeof resumo]++
      }
    }

    return res.json({ fazenda: escopo.fazenda, ...resumo })
  } catch (error) {
    return handleError(res, error)
  }
})

async function executarAcao(
  req: AuthRequest,
  res: Response,
  acao: 'registrar_chegada' | 'iniciar' | 'concluir',
  tipoEvento: string,
  descricao: string,
) {
  try {
    const escopo = await resolveFazendaEscopo(req)
    if (!escopo.fazendaId) {
      return res.status(403).json({ error: 'Operação disponível apenas para operador de área' })
    }

    const viagem = await assertViagemNaFazenda(req.params.viagemId, escopo.fazendaId)
    const statusNovo = validarTransicao(acao, viagem.status)

    const atualizada = await prisma.viagem.update({
      where: { id: viagem.id },
      data: { status: statusNovo },
      include: viagemIncludeCarregamento,
    })

    await registrarEventoCarregamento(
      viagem.id,
      req.user!.id,
      descricao,
      viagem.status,
      statusNovo,
      tipoEvento,
    )

    return res.json(atualizada)
  } catch (error) {
    return handleError(res, error)
  }
}

router.post('/viagens/:viagemId/chegada', (req, res) =>
  executarAcao(
    req as AuthRequest,
    res,
    'registrar_chegada',
    'chegada_carregamento',
    'Veículo registrado no pátio de carregamento',
  ),
)

router.post('/viagens/:viagemId/iniciar', (req, res) =>
  executarAcao(
    req as AuthRequest,
    res,
    'iniciar',
    'carregamento_iniciado',
    'Carregamento iniciado',
  ),
)

router.post('/viagens/:viagemId/concluir', (req, res) =>
  executarAcao(
    req as AuthRequest,
    res,
    'concluir',
    'carregamento_concluido',
    'Carregamento concluído — pronto para viagem',
  ),
)

export default router
