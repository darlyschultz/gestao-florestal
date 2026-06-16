import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest, requirePerfil } from '../middleware/auth'
import { logAudit } from '../utils/audit'

const router = Router()
const prisma = new PrismaClient()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { screen, module: mod } = req.query
    const where: Record<string, unknown> = { deletedAt: null }
    if (screen) where.screen = screen
    if (mod) where.module = mod

    const fields = await prisma.customField.findMany({
      where,
      include: { options: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    })
    return res.json(fields)
  } catch {
    return res.status(500).json({ error: 'Erro ao listar campos' })
  }
})

router.get('/valores', async (req: AuthRequest, res: Response) => {
  try {
    const { screen, entityType, entityId } = req.query
    if (!screen || !entityType || !entityId) {
      return res.status(400).json({ error: 'screen, entityType e entityId são obrigatórios' })
    }

    const fields = await prisma.customField.findMany({
      where: { screen: screen as string, deletedAt: null, active: true },
      include: { options: { where: { deletedAt: null, active: true }, orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    })

    const values = await prisma.customFieldValue.findMany({
      where: { entityType: entityType as string, entityId: entityId as string },
    })

    const valueMap = Object.fromEntries(values.map((v) => [v.customFieldId, v.value]))
    const result = fields.map((f) => ({ ...f, currentValue: valueMap[f.id] ?? f.defaultValue ?? null }))

    return res.json(result)
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar valores' })
  }
})

router.post('/', requirePerfil('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { options, ...data } = req.body
    const field = await prisma.customField.create({
      data: {
        ...data,
        options: options?.length ? { create: options } : undefined,
      },
      include: { options: true },
    })
    await logAudit(req, { entityType: 'custom_field', entityId: field.id, action: 'create', newValue: field })
    return res.status(201).json(field)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Erro ao criar campo' })
  }
})

router.put('/:id', requirePerfil('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { options, ...data } = req.body
    const field = await prisma.customField.update({
      where: { id: req.params.id },
      data,
      include: { options: { where: { deletedAt: null } } },
    })

    if (options?.length) {
      await prisma.customFieldOption.deleteMany({ where: { customFieldId: req.params.id } })
      await prisma.customFieldOption.createMany({
        data: options.map((o: { label: string; value: string; displayOrder?: number }, i: number) => ({
          customFieldId: req.params.id,
          label: o.label,
          value: o.value,
          displayOrder: o.displayOrder ?? i,
        })),
      })
    }

    const updated = await prisma.customField.findUnique({
      where: { id: req.params.id },
      include: { options: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' } } },
    })

    await logAudit(req, { entityType: 'custom_field', entityId: req.params.id, action: 'update', newValue: updated })
    return res.json(updated)
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar campo' })
  }
})

router.delete('/:id', requirePerfil('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const field = await prisma.customField.findUnique({ where: { id: req.params.id } })
    if (!field) return res.status(404).json({ error: 'Campo não encontrado' })
    if (field.isSystem) return res.status(400).json({ error: 'Campos do sistema não podem ser excluídos' })

    await prisma.customField.update({
      where: { id: req.params.id },
      data: { active: false, deletedAt: new Date() },
    })
    await logAudit(req, { entityType: 'custom_field', entityId: req.params.id, action: 'delete' })
    return res.json({ message: 'Campo excluído' })
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir campo' })
  }
})

router.post('/valores', async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId, values } = req.body as {
      entityType: string
      entityId: string
      values: Array<{ customFieldId: string; value: string | null }>
    }

    for (const v of values) {
      await prisma.customFieldValue.upsert({
        where: {
          customFieldId_entityType_entityId: {
            customFieldId: v.customFieldId,
            entityType,
            entityId,
          },
        },
        create: { customFieldId: v.customFieldId, entityType, entityId, value: v.value },
        update: { value: v.value },
      })
    }

    return res.json({ message: 'Valores salvos' })
  } catch {
    return res.status(500).json({ error: 'Erro ao salvar valores' })
  }
})

export default router
