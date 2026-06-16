import { prisma } from './helpers'
import type { seedCadastrosBase } from './cadastros-base'

type Cadastros = Awaited<ReturnType<typeof seedCadastrosBase>>
type Users = {
  userAdmin: { id: string }
  userTransp: { id: string }
  userPortaria: { id: string }
  userOperacao: { id: string }
  userMotorista: { id: string }
}

export async function seedOperacional(cad: Cadastros, users: Users) {
  const { transportadoras, motoristas, veiculos, fornecedores, fazendas, talhoes, locaisEmbarque } = cad
  const { userAdmin, userTransp, userPortaria, userOperacao, userMotorista } = users

  const agend1 = await prisma.agendamento.create({
    data: {
      numero: 'AGD-2024-0001',
      transportadoraId: transportadoras.transf1.id,
      motoristaId: motoristas.mot1.id,
      veiculoId: veiculos.vec1.id,
      fornecedorId: fornecedores.forn1.id,
      fazendaId: fazendas.faz1.id,
      talhaoId: talhoes.tal1.id,
      localEmbarqueId: locaisEmbarque.loc1.id,
      tipoMadeira: 'Eucalipto',
      quantidadePrevistaM3: 45.5,
      dataHoraSaidaPrevista: new Date('2024-05-01T10:00:00'),
      dataHoraChegadaPrevista: new Date('2024-05-01T14:00:00'),
      status: 'confirmado',
      userId: userTransp.id,
    },
  })

  const viagem1 = await prisma.viagem.create({
    data: {
      numero: 'VGM-2024-0001',
      agendamentoId: agend1.id,
      transportadoraId: transportadoras.transf1.id,
      motoristaId: motoristas.mot1.id,
      veiculoId: veiculos.vec1.id,
      status: 'finalizado',
      latEmbarque: -23.7636,
      lngEmbarque: -47.1234,
    },
  })

  const agend2 = await prisma.agendamento.create({
    data: {
      numero: 'AGD-2024-0002',
      transportadoraId: transportadoras.transf1.id,
      motoristaId: motoristas.mot2.id,
      veiculoId: veiculos.vec2.id,
      fornecedorId: fornecedores.forn1.id,
      fazendaId: fazendas.faz2.id,
      talhaoId: talhoes.tal2.id,
      tipoMadeira: 'Pinus',
      quantidadePrevistaM3: 38.0,
      dataHoraSaidaPrevista: new Date('2024-05-02T09:30:00'),
      dataHoraChegadaPrevista: new Date('2024-05-02T13:30:00'),
      status: 'confirmado',
      userId: userTransp.id,
    },
  })

  const viagem2 = await prisma.viagem.create({
    data: {
      numero: 'VGM-2024-0002',
      agendamentoId: agend2.id,
      transportadoraId: transportadoras.transf1.id,
      motoristaId: motoristas.mot2.id,
      veiculoId: veiculos.vec2.id,
      status: 'em_transito',
      latEmbarque: -23.9876,
      lngEmbarque: -47.5432,
      latAtual: -23.85,
      lngAtual: -47.35,
      distanciaRestanteKm: 68,
      tempoRestanteMin: 72,
    },
  })

  const agend3 = await prisma.agendamento.create({
    data: {
      numero: 'AGD-2024-0003',
      transportadoraId: transportadoras.transf2.id,
      motoristaId: motoristas.mot3.id,
      veiculoId: veiculos.vec3.id,
      fornecedorId: fornecedores.forn2.id,
      fazendaId: fazendas.faz3.id,
      talhaoId: talhoes.tal3.id,
      tipoMadeira: 'Eucalipto',
      quantidadePrevistaM3: 52.0,
      dataHoraSaidaPrevista: new Date('2024-05-02T07:00:00'),
      dataHoraChegadaPrevista: new Date('2024-05-02T15:00:00'),
      status: 'confirmado',
      userId: userAdmin.id,
    },
  })

  const viagem3 = await prisma.viagem.create({
    data: {
      numero: 'VGM-2024-0003',
      agendamentoId: agend3.id,
      transportadoraId: transportadoras.transf2.id,
      motoristaId: motoristas.mot3.id,
      veiculoId: veiculos.vec3.id,
      status: 'portaria',
    },
  })

  await prisma.documentoViagem.createMany({
    data: [
      { viagemId: viagem1.id, tipo: 'nota_fiscal', numero: '123456', status: 'valido' },
      { viagemId: viagem1.id, tipo: 'mdfe', numero: '987654', status: 'valido' },
      { viagemId: viagem1.id, tipo: 'ordem_carregamento', numero: 'OC-001234', status: 'valido' },
      { viagemId: viagem2.id, tipo: 'nota_fiscal', numero: '234567', status: 'valido' },
      { viagemId: viagem2.id, tipo: 'mdfe', numero: '876543', status: 'valido' },
      { viagemId: viagem2.id, tipo: 'ordem_carregamento', numero: 'OC-002345', status: 'pendente' },
      { viagemId: viagem3.id, tipo: 'nota_fiscal', numero: 'NF-0012345', status: 'valido' },
      { viagemId: viagem3.id, tipo: 'mdfe', numero: 'MDF-0056789', status: 'valido' },
    ],
  })

  await prisma.alertaViagem.createMany({
    data: [
      { viagemId: viagem2.id, tipo: 'desvio_rota', severidade: 'alta', mensagem: 'Veículo fora da rota planejada por mais de 2 km' },
      { viagemId: viagem2.id, tipo: 'parada_prolongada', severidade: 'media', mensagem: 'Veículo parado por mais de 30 minutos' },
      { viagemId: viagem3.id, tipo: 'atraso', severidade: 'media', mensagem: 'Chegada prevista às 15:00 com atraso de 2h' },
    ],
  })

  await prisma.eventoViagem.createMany({
    data: [
      { viagemId: viagem1.id, tipo: 'status_alterado', descricao: 'Agendamento criado', statusNovo: 'agendado', userId: userTransp.id },
      { viagemId: viagem1.id, tipo: 'status_alterado', descricao: 'Viagem finalizada', statusNovo: 'finalizado', userId: userOperacao.id },
      { viagemId: viagem2.id, tipo: 'status_alterado', descricao: 'Viagem em trânsito', statusNovo: 'em_transito', userId: userMotorista.id },
    ],
  })

  await prisma.portariaCheckin.create({
    data: { viagemId: viagem3.id, userId: userPortaria.id, acao: 'liberado' },
  })

  await prisma.filaPatio.create({
    data: { viagemId: viagem3.id, posicao: 1, status: 'aguardando_balanca', tempoEstimadoMin: 15 },
  })

  await prisma.pesagem.createMany({
    data: [
      { viagemId: viagem1.id, tipo: 'inicial', ticketBalanca: '00989321', placa: 'ABC1023', pesoBrutoKg: 45680, operador: 'Carlos Alberto', balanca: 'BAL-01', userId: userOperacao.id },
      { viagemId: viagem1.id, tipo: 'final', ticketBalanca: '00989322', placa: 'ABC1023', pesoBrutoKg: 43920, pesoTaraKg: 15860, pesoLiquidoKg: 28060, operador: 'Carlos Alberto', balanca: 'BAL-01', userId: userOperacao.id },
    ],
  })

  await prisma.descarga.create({
    data: { viagemId: viagem1.id, doca: 'DOCA-04', material: 'Madeira em tora', responsavel: 'Paulo Henrique', status: 'concluida' },
  })

  console.log('✅ Dados operacionais criados (agendamentos, viagens, documentos, alertas)')
}

export async function seedAuditLogs(userId: string) {
  await prisma.auditLog.createMany({
    data: [
      {
        userId,
        entityType: 'system_settings',
        entityId: 'default',
        action: 'seed',
        newValue: JSON.stringify({ event: 'Configurações padrão inicializadas' }),
      },
      {
        userId,
        entityType: 'role',
        entityId: 'admin',
        action: 'create',
        newValue: JSON.stringify({ name: 'Administrador' }),
      },
      {
        userId,
        entityType: 'user',
        entityId: userId,
        action: 'create',
        newValue: JSON.stringify({ email: 'admin@florestal.com' }),
      },
    ],
  })

  console.log('✅ Logs de auditoria iniciais criados')
}
