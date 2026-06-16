import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

/** Ajusta URL pooled para serverless (sem driver adapters — engine nativo é mais rápido em JOINs). */
function getDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw || process.env.VERCEL !== '1') return raw

  try {
    const url = new URL(raw)
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '10')
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '10')
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '5')
    return url.toString()
  } catch {
    return raw
  }
}

function createPrismaClient(): PrismaClient {
  const url = getDatabaseUrl()
  const log = process.env.NODE_ENV === 'development' ? (['error', 'warn'] as const) : (['error'] as const)

  return new PrismaClient({
    log: [...log],
    ...(url ? { datasources: { db: { url } } } : {}),
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma
