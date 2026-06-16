import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'

const prisma = new PrismaClient()

export async function logAudit(
  req: AuthRequest,
  data: {
    entityType: string
    entityId?: string
    action: string
    oldValue?: unknown
    newValue?: unknown
  }
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : undefined,
        newValue: data.newValue ? JSON.stringify(data.newValue) : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    })
  } catch (e) {
    console.error('Erro ao registrar auditoria:', e)
  }
}
