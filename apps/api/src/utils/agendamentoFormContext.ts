import { prisma } from '../lib/prisma'

const motoristaSelect = { id: true, nome: true } as const
const veiculoSelect = { id: true, placa: true, tipo: true, placaCarreta: true } as const

export async function buildContextoFormularioAgendamento(userId: string, perfil: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transportadora: { select: { id: true, nome: true } },
      motoristaCadastro: {
        include: { transportadora: { select: { id: true, nome: true } } },
      },
    },
  })

  if (!user) {
    return {
      bloquearTransportadora: false,
      bloquearMotorista: false,
      motoristas: [],
      veiculos: [],
    }
  }

  if (perfil === 'motorista' && user.motoristaCadastro) {
    const transpId = user.motoristaCadastro.transportadoraId
    const veiculos = await prisma.veiculo.findMany({
      where: { transportadoraId: transpId, active: true, deletedAt: null },
      select: veiculoSelect,
      orderBy: { placa: 'asc' },
    })

    return {
      transportadoraId: transpId,
      transportadora: user.motoristaCadastro.transportadora,
      motoristaId: user.motoristaCadastro.id,
      motorista: {
        id: user.motoristaCadastro.id,
        nome: user.motoristaCadastro.nome,
        telefone: user.motoristaCadastro.telefone,
        cnh: user.motoristaCadastro.cnh,
      },
      motoristas: [{ id: user.motoristaCadastro.id, nome: user.motoristaCadastro.nome }],
      veiculos,
      bloquearTransportadora: true,
      bloquearMotorista: true,
    }
  }

  if (perfil === 'transportador' && user.transportadoraId) {
    const transpId = user.transportadoraId
    const [transportadora, motoristas, veiculos] = await Promise.all([
      prisma.transportadora.findUnique({
        where: { id: transpId },
        select: { id: true, nome: true },
      }),
      prisma.motorista.findMany({
        where: { transportadoraId: transpId, active: true, deletedAt: null },
        select: motoristaSelect,
        orderBy: { nome: 'asc' },
      }),
      prisma.veiculo.findMany({
        where: { transportadoraId: transpId, active: true, deletedAt: null },
        select: veiculoSelect,
        orderBy: { placa: 'asc' },
      }),
    ])

    return {
      transportadoraId: transpId,
      transportadora,
      motoristas,
      veiculos,
      bloquearTransportadora: true,
      bloquearMotorista: false,
    }
  }

  return {
    bloquearTransportadora: false,
    bloquearMotorista: false,
    motoristas: [],
    veiculos: [],
  }
}
