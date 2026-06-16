import { Router, Response } from 'express'
import { authMiddleware, AuthRequest, requirePerfil } from '../middleware/auth'
import { logAudit } from '../utils/audit'
import { prisma } from '../lib/prisma'

const router = Router()

router.use(authMiddleware)

const adminOnly = requirePerfil('admin')

function activeFilter(includeInactive?: boolean) {
  if (includeInactive) return { deletedAt: null }
  return { deletedAt: null, active: true, ativo: true }
}

function activeOnly(includeInactive?: boolean) {
  if (includeInactive) return { deletedAt: null }
  return { deletedAt: null, active: true }
}

async function softDelete(
  req: AuthRequest,
  res: Response,
  entityType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  id: string,
  withAtivo = true
) {
  try {
    const data: Record<string, unknown> = { active: false, deletedAt: new Date() }
    if (withAtivo) data.ativo = false
    const item = await model.update({ where: { id }, data })
    await logAudit(req, { entityType, entityId: id, action: 'delete' })
    return res.json(item)
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir registro' })
  }
}

// ─── Transportadoras ───────────────────────────────────────────────────────
router.get('/transportadoras', async (req, res: Response) => {
  const includeInactive = req.query.all === 'true'
  const data = await prisma.transportadora.findMany({
    where: activeFilter(includeInactive),
    orderBy: { nome: 'asc' },
  })
  return res.json(data)
})
router.get('/transportadoras/:id', async (req, res: Response) => {
  const data = await prisma.transportadora.findFirst({ where: { id: req.params.id, deletedAt: null } })
  if (!data) return res.status(404).json({ error: 'Não encontrado' })
  return res.json(data)
})
router.post('/transportadoras', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.transportadora.create({ data: { ...req.body, ativo: true, active: true } })
  await logAudit(req, { entityType: 'transportadora', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/transportadoras/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.transportadora.update({ where: { id: req.params.id }, data: req.body })
  await logAudit(req, { entityType: 'transportadora', entityId: data.id, action: 'update', newValue: data })
  return res.json(data)
})
router.delete('/transportadoras/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'transportadora', prisma.transportadora, req.params.id)
)

// ─── Motoristas ────────────────────────────────────────────────────────────
router.get('/motoristas', async (req, res: Response) => {
  const includeInactive = req.query.all === 'true'
  const data = await prisma.motorista.findMany({
    where: activeFilter(includeInactive),
    include: { transportadora: true },
    orderBy: { nome: 'asc' },
  })
  return res.json(data)
})
router.get('/motoristas/:id', async (req, res: Response) => {
  const data = await prisma.motorista.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { transportadora: true },
  })
  if (!data) return res.status(404).json({ error: 'Não encontrado' })
  return res.json(data)
})
router.post('/motoristas', adminOnly, async (req: AuthRequest, res: Response) => {
  const body = { ...req.body }
  if (body.validadeCnh) body.validadeCnh = new Date(body.validadeCnh)
  const data = await prisma.motorista.create({ data: { ...body, ativo: true, active: true } })
  await logAudit(req, { entityType: 'motorista', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/motoristas/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const body = { ...req.body }
  if (body.validadeCnh) body.validadeCnh = new Date(body.validadeCnh)
  const data = await prisma.motorista.update({ where: { id: req.params.id }, data: body })
  await logAudit(req, { entityType: 'motorista', entityId: data.id, action: 'update', newValue: data })
  return res.json(data)
})
router.delete('/motoristas/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'motorista', prisma.motorista, req.params.id)
)

// ─── Veículos ──────────────────────────────────────────────────────────────
router.get('/veiculos', async (req, res: Response) => {
  const includeInactive = req.query.all === 'true'
  const data = await prisma.veiculo.findMany({
    where: activeFilter(includeInactive),
    include: { transportadora: true, tipoVeiculo: true },
    orderBy: { placa: 'asc' },
  })
  return res.json(data)
})
router.get('/veiculos/:id', async (req, res: Response) => {
  const data = await prisma.veiculo.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { transportadora: true, tipoVeiculo: true },
  })
  if (!data) return res.status(404).json({ error: 'Não encontrado' })
  return res.json(data)
})
router.post('/veiculos', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.veiculo.create({ data: { ...req.body, ativo: true, active: true } })
  await logAudit(req, { entityType: 'veiculo', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/veiculos/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.veiculo.update({ where: { id: req.params.id }, data: req.body })
  await logAudit(req, { entityType: 'veiculo', entityId: data.id, action: 'update', newValue: data })
  return res.json(data)
})
router.delete('/veiculos/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'veiculo', prisma.veiculo, req.params.id)
)

// ─── Fornecedores ──────────────────────────────────────────────────────────
router.get('/fornecedores', async (req, res: Response) => {
  const includeInactive = req.query.all === 'true'
  const data = await prisma.fornecedor.findMany({ where: activeFilter(includeInactive), orderBy: { nome: 'asc' } })
  return res.json(data)
})
router.get('/fornecedores/:id', async (req, res: Response) => {
  const data = await prisma.fornecedor.findFirst({ where: { id: req.params.id, deletedAt: null } })
  if (!data) return res.status(404).json({ error: 'Não encontrado' })
  return res.json(data)
})
router.post('/fornecedores', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.fornecedor.create({ data: { ...req.body, ativo: true, active: true } })
  await logAudit(req, { entityType: 'fornecedor', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/fornecedores/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.fornecedor.update({ where: { id: req.params.id }, data: req.body })
  await logAudit(req, { entityType: 'fornecedor', entityId: data.id, action: 'update', newValue: data })
  return res.json(data)
})
router.delete('/fornecedores/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'fornecedor', prisma.fornecedor, req.params.id)
)

// ─── Fazendas ──────────────────────────────────────────────────────────────
router.get('/fazendas', async (req, res: Response) => {
  const includeInactive = req.query.all === 'true'
  const data = await prisma.fazenda.findMany({
    where: activeFilter(includeInactive),
    include: { fornecedor: true },
    orderBy: { nome: 'asc' },
  })
  return res.json(data)
})
router.get('/fazendas/:id', async (req, res: Response) => {
  const data = await prisma.fazenda.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { fornecedor: true },
  })
  if (!data) return res.status(404).json({ error: 'Não encontrado' })
  return res.json(data)
})
router.post('/fazendas', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.fazenda.create({ data: { ...req.body, ativo: true, active: true } })
  await logAudit(req, { entityType: 'fazenda', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/fazendas/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.fazenda.update({ where: { id: req.params.id }, data: req.body })
  await logAudit(req, { entityType: 'fazenda', entityId: data.id, action: 'update', newValue: data })
  return res.json(data)
})
router.delete('/fazendas/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'fazenda', prisma.fazenda, req.params.id)
)

// ─── Talhões ───────────────────────────────────────────────────────────────
router.get('/talhoes', async (req, res: Response) => {
  const { fazendaId, all } = req.query
  const where: Record<string, unknown> = activeFilter(all === 'true')
  if (fazendaId) where.fazendaId = fazendaId
  const data = await prisma.talhao.findMany({
    where,
    include: { fazendaRef: true, tipoMadeiraRef: true },
    orderBy: { nome: 'asc' },
  })
  return res.json(data)
})
router.get('/talhoes/:id', async (req, res: Response) => {
  const data = await prisma.talhao.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { fazendaRef: true, tipoMadeiraRef: true },
  })
  if (!data) return res.status(404).json({ error: 'Não encontrado' })
  return res.json(data)
})
router.post('/talhoes', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.talhao.create({ data: { ...req.body, ativo: true, active: true } })
  await logAudit(req, { entityType: 'talhao', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/talhoes/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.talhao.update({ where: { id: req.params.id }, data: req.body })
  await logAudit(req, { entityType: 'talhao', entityId: data.id, action: 'update', newValue: data })
  return res.json(data)
})
router.delete('/talhoes/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'talhao', prisma.talhao, req.params.id)
)

// ─── Locais de Embarque ────────────────────────────────────────────────────
router.get('/locais-embarque', async (req, res: Response) => {
  const { talhaoId, all } = req.query
  const where: Record<string, unknown> = activeFilter(all === 'true')
  if (talhaoId) where.talhaoId = talhaoId
  const data = await prisma.localEmbarque.findMany({
    where,
    include: { talhao: { include: { fazendaRef: true } } },
  })
  return res.json(data)
})
router.get('/locais-embarque/:id', async (req, res: Response) => {
  const data = await prisma.localEmbarque.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { talhao: true },
  })
  if (!data) return res.status(404).json({ error: 'Não encontrado' })
  return res.json(data)
})
router.post('/locais-embarque', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.localEmbarque.create({ data: { ...req.body, ativo: true, active: true } })
  await logAudit(req, { entityType: 'local_embarque', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/locais-embarque/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.localEmbarque.update({ where: { id: req.params.id }, data: req.body })
  await logAudit(req, { entityType: 'local_embarque', entityId: data.id, action: 'update', newValue: data })
  return res.json(data)
})
router.delete('/locais-embarque/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'local_embarque', prisma.localEmbarque, req.params.id)
)

// ─── Tipos de Madeira ──────────────────────────────────────────────────────
router.get('/tipos-madeira', async (req, res: Response) => {
  const data = await prisma.tipoMadeira.findMany({
    where: activeOnly(req.query.all === 'true'),
    orderBy: { descricao: 'asc' },
  })
  return res.json(data)
})
router.post('/tipos-madeira', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.tipoMadeira.create({ data: req.body })
  await logAudit(req, { entityType: 'tipo_madeira', entityId: data.id, action: 'create', newValue: data })
  return res.status(201).json(data)
})
router.put('/tipos-madeira/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.tipoMadeira.update({ where: { id: req.params.id }, data: req.body })
  return res.json(data)
})
router.delete('/tipos-madeira/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'tipo_madeira', prisma.tipoMadeira, req.params.id, false)
)

// ─── Tipos de Veículo ──────────────────────────────────────────────────────
router.get('/tipos-veiculo', async (req, res: Response) => {
  const data = await prisma.tipoVeiculo.findMany({
    where: activeOnly(req.query.all === 'true'),
    orderBy: { descricao: 'asc' },
  })
  return res.json(data)
})
router.post('/tipos-veiculo', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.tipoVeiculo.create({ data: req.body })
  return res.status(201).json(data)
})
router.put('/tipos-veiculo/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.tipoVeiculo.update({ where: { id: req.params.id }, data: req.body })
  return res.json(data)
})
router.delete('/tipos-veiculo/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'tipo_veiculo', prisma.tipoVeiculo, req.params.id, false)
)

// ─── Unidades ──────────────────────────────────────────────────────────────
router.get('/unidades', async (req, res: Response) => {
  const data = await prisma.unidade.findMany({
    where: activeOnly(req.query.all === 'true'),
    orderBy: { nome: 'asc' },
  })
  return res.json(data)
})
router.post('/unidades', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.unidade.create({ data: req.body })
  return res.status(201).json(data)
})
router.put('/unidades/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.unidade.update({ where: { id: req.params.id }, data: req.body })
  return res.json(data)
})
router.delete('/unidades/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'unidade', prisma.unidade, req.params.id, false)
)

// ─── Docas ─────────────────────────────────────────────────────────────────
router.get('/docas', async (req, res: Response) => {
  const { unidadeId } = req.query
  const where: Record<string, unknown> = activeOnly(req.query.all === 'true')
  if (unidadeId) where.unidadeId = unidadeId
  const data = await prisma.doca.findMany({ where, include: { unidade: true }, orderBy: { codigo: 'asc' } })
  return res.json(data)
})
router.post('/docas', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.doca.create({ data: req.body })
  return res.status(201).json(data)
})
router.put('/docas/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.doca.update({ where: { id: req.params.id }, data: req.body })
  return res.json(data)
})
router.delete('/docas/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'doca', prisma.doca, req.params.id, false)
)

// ─── Balanças ──────────────────────────────────────────────────────────────
router.get('/balancas', async (req, res: Response) => {
  const { unidadeId } = req.query
  const where: Record<string, unknown> = activeOnly(req.query.all === 'true')
  if (unidadeId) where.unidadeId = unidadeId
  const data = await prisma.balanca.findMany({ where, include: { unidade: true }, orderBy: { codigo: 'asc' } })
  return res.json(data)
})
router.post('/balancas', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.balanca.create({ data: req.body })
  return res.status(201).json(data)
})
router.put('/balancas/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.balanca.update({ where: { id: req.params.id }, data: req.body })
  return res.json(data)
})
router.delete('/balancas/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'balanca', prisma.balanca, req.params.id, false)
)

// ─── Motivos de Bloqueio ───────────────────────────────────────────────────
router.get('/motivos-bloqueio', async (req, res: Response) => {
  const data = await prisma.motivoBloqueio.findMany({
    where: activeOnly(req.query.all === 'true'),
    orderBy: { descricao: 'asc' },
  })
  return res.json(data)
})
router.post('/motivos-bloqueio', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.motivoBloqueio.create({ data: req.body })
  return res.status(201).json(data)
})
router.put('/motivos-bloqueio/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.motivoBloqueio.update({ where: { id: req.params.id }, data: req.body })
  return res.json(data)
})
router.delete('/motivos-bloqueio/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'motivo_bloqueio', prisma.motivoBloqueio, req.params.id, false)
)

// ─── Janelas de Agendamento ────────────────────────────────────────────────
router.get('/janelas-agendamento', async (req, res: Response) => {
  const { unidadeId } = req.query
  const where: Record<string, unknown> = activeOnly(req.query.all === 'true')
  if (unidadeId) where.unidadeId = unidadeId
  const data = await prisma.janelaAgendamento.findMany({ where, include: { unidade: true } })
  return res.json(data)
})
router.post('/janelas-agendamento', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.janelaAgendamento.create({ data: req.body })
  return res.status(201).json(data)
})
router.put('/janelas-agendamento/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  const data = await prisma.janelaAgendamento.update({ where: { id: req.params.id }, data: req.body })
  return res.json(data)
})
router.delete('/janelas-agendamento/:id', adminOnly, (req, res) =>
  softDelete(req, res, 'janela_agendamento', prisma.janelaAgendamento, req.params.id, false)
)

export default router
