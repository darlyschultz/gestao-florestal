import bcrypt from 'bcryptjs'
import { prisma } from './helpers'

interface SeedUsersParams {
  roles: Record<string, { id: string; slug: string }>
  unidadeId: string
  transportadoraId: string
  fazendaId: string
}

export async function seedUsers({ roles, unidadeId, transportadoraId, fazendaId }: SeedUsersParams) {
  const senhaHash = await bcrypt.hash('123456', 10)

  const userAdmin = await prisma.user.create({
    data: {
      nome: 'Administrador do Sistema',
      email: 'admin@florestal.com',
      senha: senhaHash,
      perfil: 'admin',
      roleId: roles.admin.id,
      telefone: '(11) 99999-0001',
      cargo: 'Administrador de Sistemas',
      unidadeId,
      notificacoesEmail: true,
      notificacoesPush: true,
      notificacoesSistema: true,
    },
  })

  const userTransp = await prisma.user.create({
    data: {
      nome: 'Carlos Oliveira',
      email: 'transportador@florestal.com',
      senha: senhaHash,
      perfil: 'transportador',
      roleId: roles.transportador.id,
      telefone: '(11) 98888-0002',
      cargo: 'Coordenador de Transportes',
      transportadoraId,
      unidadeId,
    },
  })

  const userPortaria = await prisma.user.create({
    data: {
      nome: 'Ana Paula Santos',
      email: 'portaria@florestal.com',
      senha: senhaHash,
      perfil: 'portaria',
      roleId: roles.portaria.id,
      telefone: '(11) 97777-0003',
      cargo: 'Operadora de Portaria',
      unidadeId,
    },
  })

  const userOperacao = await prisma.user.create({
    data: {
      nome: 'Roberto Almeida',
      email: 'operacao@florestal.com',
      senha: senhaHash,
      perfil: 'operacao',
      roleId: roles.operacao.id,
      telefone: '(11) 96666-0004',
      cargo: 'Operador de Balança',
      unidadeId,
    },
  })

  const userMotorista = await prisma.user.create({
    data: {
      nome: 'João Carlos da Silva',
      email: 'joao.carlos@transfloresta.com.br',
      senha: senhaHash,
      perfil: 'motorista',
      roleId: roles.motorista.id,
      telefone: '(11) 99876-5432',
      cargo: 'Motorista',
      transportadoraId,
    },
  })

  const userGestor = await prisma.user.create({
    data: {
      nome: 'Fernanda Costa',
      email: 'gestor@florestal.com',
      senha: senhaHash,
      perfil: 'gestor',
      roleId: roles.gestor.id,
      telefone: '(11) 95555-0005',
      cargo: 'Gestora Operacional',
      unidadeId,
    },
  })

  const userOperadorArea = await prisma.user.create({
    data: {
      nome: 'Pedro Mendes',
      email: 'operador.area@florestal.com',
      senha: senhaHash,
      perfil: 'operador_area',
      roleId: roles.operador_area.id,
      telefone: '(11) 94444-0006',
      cargo: 'Operador de Área — Carregamento',
      fazendaId,
    },
  })

  console.log('✅ Usuários criados (7 perfis)')

  return { userAdmin, userTransp, userPortaria, userOperacao, userMotorista, userGestor, userOperadorArea }
}
