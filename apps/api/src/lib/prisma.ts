import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool as PgPool } from 'pg'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
  pgPool?: PgPool
}

/** Parâmetros recomendados para Postgres em funções serverless. */
function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) return raw ?? ''

  if (process.env.VERCEL !== '1') return raw

  try {
    const url = new URL(raw)
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '15')
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '15')
    }
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '1')
    }
    return url.toString()
  } catch {
    return raw
  }
}

function isNeonLikeUrl(url: string): boolean {
  return (
    url.includes('neon.tech') ||
    url.includes('vercel-storage.com') ||
    url.includes('-pooler.')
  )
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl()
  const log = process.env.NODE_ENV === 'development' ? (['error', 'warn'] as const) : (['error'] as const)

  if (connectionString && isNeonLikeUrl(connectionString)) {
    neonConfig.fetchConnectionCache = true
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter, log: [...log] })
  }

  if (process.env.VERCEL === '1' && connectionString) {
    if (!globalForPrisma.pgPool) {
      globalForPrisma.pgPool = new PgPool({
        connectionString,
        max: 1,
        idleTimeoutMillis: 20_000,
        connectionTimeoutMillis: 15_000,
      })
    }
    const adapter = new PrismaPg(globalForPrisma.pgPool)
    return new PrismaClient({ adapter, log: [...log] })
  }

  return new PrismaClient({ log: [...log] })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma
