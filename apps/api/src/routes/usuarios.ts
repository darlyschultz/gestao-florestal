import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest, requirePerfil } from '../middleware/auth'
import { logAudit } from '../utils/audit'

const router = Router()
const prisma = new PrismaClient()

const userSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  cargo: true,
  perfil: true,
  ativo: true,
  transportadoraId: true,
  unidadeId: true,
  roleId: true,
  createdAt: true,
  updatedAt: true,
  transportadora: { select: { id: true, nome: true } },
  unidade: { select: { id: true, nome: true } },
  role: { select: { id: true, name: true, slug: true } },
}

router.use(authMiddleware)
router.use(requirePerfil('admin'))

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { q, perfil, status } = req.query
    const where: Record<string, unknown> = { deletedAt: null }

    if (q) {
      where.OR = [
        { nome: { contains: q as string } },
        { email: { contains: q as string } },
      ]
    }
    if (perfil) where.perfil = perfil
    if (status === 'ativo') where.ativo = true
    if (status === 'inativo') where.ativo = false

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { nome: 'asc' },
    })
    return res.json(users)
  } catch {
    return res.status(500).json({ error: 'Erro ao listar usuários' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, email, senha, perfil, telefone, cargo, transportadoraId, unidadeId, roleId } = req.body

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ error: 'Nome, email, senha e perfil são obrigatórios' })
    }

    const user = await prisma.user.create({
      data: {
        nome,
        email,
        senha: await bcrypt.hash(senha, 10),
        perfil,
        telefone,
        cargo,
        transportadoraId,
        unidadeId,
        roleId,
      },
      select: userSelect,
    })

    await logAudit(req, { entityType: 'user', entityId: user.id, action: 'create', newValue: user })
    return res.status(201).json(user)
  } catch {
    return res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: userSelect,
    })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar usuário' })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { senha, ...data } = req.body
    const updateData = { ...data }
    if (senha) updateData.senha = await bcrypt.hash(senha, 10)

    const anterior = await prisma.user.findUnique({ where: { id: req.params.id }, select: userSelect })

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: userSelect,
    })

    await logAudit(req, { entityType: 'user', entityId: user.id, action: 'update', oldValue: anterior, newValue: user })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar usuário' })
  }
})

router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { ativo } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ativo },
      select: userSelect,
    })
    await logAudit(req, { entityType: 'user', entityId: user.id, action: ativo ? 'activate' : 'deactivate' })
    return res.json(user)
  } catch {
    return res.status(500).json({ error: 'Erro ao alterar status' })
  }
})

router.put('/:id/resetar-senha', async (req: AuthRequest, res: Response) => {
  try {
    const novaSenha = req.body.senha || '123456'
    await prisma.user.update({
      where: { id: req.params.id },
      data: { senha: await bcrypt.hash(novaSenha, 10) },
    })
    await logAudit(req, { entityType: 'user', entityId: req.params.id, action: 'reset_password' })
    return res.json({ message: 'Senha resetada com sucesso' })
  } catch {
    return res.status(500).json({ error: 'Erro ao resetar senha' })
  }
})

export default router
