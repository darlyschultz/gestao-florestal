import { Router, Response } from 'express'
import { authMiddleware, AuthRequest, requirePerfil } from '../middleware/auth'
import { logAudit } from '../utils/audit'
import { prisma } from '../lib/prisma'

const router = Router()

router.use(authMiddleware)

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const perfis = await prisma.role.findMany({
      where: { active: true },
      include: { permissions: true },
      orderBy: { name: 'asc' },
    })
    return res.json(perfis)
  } catch {
    return res.status(500).json({ error: 'Erro ao listar perfis' })
  }
})

router.post('/', requirePerfil('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description } = req.body
    const role = await prisma.role.create({ data: { name, slug, description } })
    await logAudit(req, { entityType: 'role', entityId: role.id, action: 'create', newValue: role })
    return res.status(201).json(role)
  } catch {
    return res.status(500).json({ error: 'Erro ao criar perfil' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { permissions: { orderBy: { module: 'asc' } } },
    })
    if (!role) return res.status(404).json({ error: 'Perfil não encontrado' })
    return res.json(role)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar perfil' })
  }
})

router.put('/:id', requirePerfil('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: req.body,
      include: { permissions: true },
    })
    await logAudit(req, { entityType: 'role', entityId: role.id, action: 'update', newValue: role })
    return res.json(role)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar perfil' })
  }
})

router.put('/:id/permissoes', requirePerfil('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body as { permissions: Array<{
      module: string
      canView: boolean
      canCreate: boolean
      canEdit: boolean
      canDelete: boolean
      canApprove: boolean
      canBlock: boolean
      canExport: boolean
    }> }

    await prisma.permission.deleteMany({ where: { roleId: req.params.id } })

    if (permissions?.length) {
      await prisma.permission.createMany({
        data: permissions.map((p) => ({ ...p, roleId: req.params.id })),
      })
    }

    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: { permissions: true },
    })

    await logAudit(req, { entityType: 'role', entityId: req.params.id, action: 'update_permissions', newValue: permissions })
    return res.json(role)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao atualizar permissões' })
  }
})

export default router
