import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isCpfLogin(value: string): boolean {
  return onlyDigits(value).length === 11
}

/** Localiza usuário por e-mail ou CPF do cadastro de motorista. */
export async function findUserByLogin(login: string) {
  const trimmed = login.trim()
  if (!trimmed) return null

  const emailNorm = normalizeEmail(trimmed)
  const byEmail = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (byEmail) return byEmail

  const cpfDigits = onlyDigits(trimmed)
  if (cpfDigits.length !== 11) return null

  const motoristas = await prisma.motorista.findMany({
    where: { deletedAt: null, active: true },
    select: { id: true, cpf: true },
  })
  const motorista = motoristas.find((m) => onlyDigits(m.cpf) === cpfDigits)
  if (!motorista) return null

  const linked = await prisma.user.findFirst({
    where: { motoristaCadastroId: motorista.id, ativo: true },
  })
  if (linked) return linked

  const full = await prisma.motorista.findUnique({ where: { id: motorista.id } })
  if (full?.email?.trim()) {
    try {
      return await syncMotoristaUser(full.id)
    } catch {
      return null
    }
  }

  return null
}

async function emailEmUso(email: string, excludeUserId?: string, excludeMotoristaId?: string) {
  const [user, mot] = await Promise.all([
    prisma.user.findFirst({
      where: { email, ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}) },
    }),
    prisma.motorista.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        deletedAt: null,
        ...(excludeMotoristaId ? { NOT: { id: excludeMotoristaId } } : {}),
      },
    }),
  ])
  return !!(user || mot)
}

/** Cria ou atualiza usuário de acesso vinculado ao cadastro do motorista. */
export async function syncMotoristaUser(motoristaId: string) {
  const motorista = await prisma.motorista.findUnique({ where: { id: motoristaId } })
  if (!motorista?.email?.trim()) {
    throw new Error('E-mail é obrigatório no cadastro do motorista')
  }

  const email = normalizeEmail(motorista.email)
  const role = await prisma.role.findFirst({ where: { slug: 'motorista' } })

  const existing = await prisma.user.findFirst({
    where: { OR: [{ motoristaCadastroId: motorista.id }, { email }] },
  })

  if (await emailEmUso(email, existing?.id, motorista.id)) {
    throw new Error('E-mail já utilizado por outro usuário ou motorista')
  }

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        nome: motorista.nome,
        email,
        telefone: motorista.telefone,
        transportadoraId: motorista.transportadoraId,
        motoristaCadastroId: motorista.id,
        perfil: 'motorista',
        roleId: role?.id ?? existing.roleId,
        ativo: motorista.active,
      },
    })
  }

  const defaultPassword = process.env.MOTORISTA_DEFAULT_PASSWORD || '123456'
  const senhaHash = await bcrypt.hash(defaultPassword, 10)

  return prisma.user.create({
    data: {
      nome: motorista.nome,
      email,
      senha: senhaHash,
      perfil: 'motorista',
      roleId: role?.id,
      telefone: motorista.telefone,
      cargo: 'Motorista',
      transportadoraId: motorista.transportadoraId,
      motoristaCadastroId: motorista.id,
    },
  })
}

export async function validateMotoristaEmail(email: string | undefined, motoristaId?: string) {
  if (!email?.trim()) {
    return { ok: false as const, error: 'E-mail é obrigatório para acesso ao sistema' }
  }
  const norm = normalizeEmail(email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
    return { ok: false as const, error: 'E-mail inválido' }
  }

  const linkedUser = motoristaId
    ? await prisma.user.findFirst({
        where: { motoristaCadastroId: motoristaId },
        select: { id: true },
      })
    : null

  if (await emailEmUso(norm, linkedUser?.id, motoristaId)) {
    return { ok: false as const, error: 'E-mail já cadastrado' }
  }
  return { ok: true as const, email: norm }
}
