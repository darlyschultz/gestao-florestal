import { clearDatabase, prisma } from './seed/helpers'
import { seedRolesAndPermissions } from './seed/roles-permissions'
import { seedSystemSettings } from './seed/settings'
import { seedUnidadeInfra } from './seed/unidade-infra'
import { seedCadastrosBase } from './seed/cadastros-base'
import { seedUsers } from './seed/users'
import { seedCustomFields } from './seed/custom-fields'
import { seedOperacional, seedAuditLogs } from './seed/operacional'

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  await clearDatabase()

  const roles = await seedRolesAndPermissions()
  await seedSystemSettings()
  const unidade = await seedUnidadeInfra()
  const cadastros = await seedCadastrosBase()
  const users = await seedUsers({
    roles,
    unidadeId: unidade.id,
    transportadoraId: cadastros.transportadoras.transf1.id,
  })
  await seedCustomFields()
  await seedOperacional(cadastros, users)
  await seedAuditLogs(users.userAdmin.id)

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Usuários de teste (senha: 123456):')
  console.log('  admin@florestal.com         | Administrador')
  console.log('  transportador@florestal.com | Transportador')
  console.log('  portaria@florestal.com      | Portaria')
  console.log('  operacao@florestal.com      | Operação')
  console.log('  motorista@florestal.com     | Motorista')
  console.log('  gestor@florestal.com        | Gestor')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
