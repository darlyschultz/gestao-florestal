import { prisma, MODULES, fullPermissions, viewOnlyPermissions } from './helpers'

export async function seedRolesAndPermissions() {
  const rolesData = [
    { name: 'Administrador', slug: 'admin', description: 'Acesso total ao sistema' },
    { name: 'Transportador', slug: 'transportador', description: 'Agendamento e acompanhamento de viagens' },
    { name: 'Motorista', slug: 'motorista', description: 'Execução da viagem e geolocalização' },
    { name: 'Portaria', slug: 'portaria', description: 'Check-in e controle de fila' },
    { name: 'Operação / Balança', slug: 'operacao', description: 'Pesagem e descarga' },
    { name: 'Gestor', slug: 'gestor', description: 'Dashboards e relatórios operacionais' },
  ]

  const roles: Record<string, { id: string; slug: string }> = {}

  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r })
    roles[r.slug] = role
  }

  // Admin: acesso total
  for (const mod of MODULES) {
    await prisma.permission.create({
      data: fullPermissions(roles.admin.id, mod),
    })
  }

  // Transportador
  for (const mod of ['agendamento', 'viagens', 'rastreamento', 'alertas', 'historico'] as const) {
    await prisma.permission.create({
      data: {
        ...fullPermissions(roles.transportador.id, mod),
        canDelete: false,
        canBlock: false,
      },
    })
  }

  // Motorista
  for (const mod of ['viagens', 'rastreamento', 'alertas'] as const) {
    await prisma.permission.create({
      data: {
        roleId: roles.motorista.id,
        module: mod,
        canView: true,
        canCreate: mod === 'rastreamento',
        canEdit: mod === 'viagens',
        canDelete: false,
        canApprove: false,
        canBlock: false,
        canExport: false,
      },
    })
  }

  // Portaria
  for (const mod of ['portaria', 'fila_patio', 'viagens', 'alertas'] as const) {
    await prisma.permission.create({
      data: {
        roleId: roles.portaria.id,
        module: mod,
        canView: true,
        canCreate: false,
        canEdit: mod === 'fila_patio',
        canDelete: false,
        canApprove: mod === 'portaria',
        canBlock: mod === 'portaria',
        canExport: false,
      },
    })
  }

  // Operação
  for (const mod of ['pesagem', 'descarga', 'fila_patio', 'viagens'] as const) {
    await prisma.permission.create({
      data: {
        roleId: roles.operacao.id,
        module: mod,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canApprove: true,
        canBlock: false,
        canExport: false,
      },
    })
  }

  // Gestor
  for (const mod of ['dashboard', 'relatorios', 'viagens', 'alertas', 'historico'] as const) {
    await prisma.permission.create({
      data: { ...viewOnlyPermissions(roles.gestor.id, mod), canExport: true },
    })
  }

  console.log('✅ Perfis e permissões criados')
  return roles
}
