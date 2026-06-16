import { prisma } from './helpers'

export async function seedUnidadeInfra() {
  const unidade = await prisma.unidade.create({
    data: {
      nome: 'Fábrica Verde - Itatinga',
      cnpj: '08.765.432/0001-55',
      endereco: 'Rod. SP-127, Km 42, Zona Rural',
      municipio: 'Itatinga',
      uf: 'SP',
      latitude: -23.5489,
      longitude: -46.6388,
      raioCercaMetros: 500,
    },
  })

  await prisma.doca.createMany({
    data: [
      { unidadeId: unidade.id, codigo: 'DOCA-01', descricao: 'Doca 01 - Madeira em tora', tipoMaterial: 'Madeira em tora' },
      { unidadeId: unidade.id, codigo: 'DOCA-02', descricao: 'Doca 02 - Madeira em tora', tipoMaterial: 'Madeira em tora' },
      { unidadeId: unidade.id, codigo: 'DOCA-03', descricao: 'Doca 03 - Cavaco', tipoMaterial: 'Cavaco' },
      { unidadeId: unidade.id, codigo: 'DOCA-04', descricao: 'Doca 04 - Madeira em tora', tipoMaterial: 'Madeira em tora' },
    ],
  })

  await prisma.balanca.createMany({
    data: [
      { unidadeId: unidade.id, codigo: 'BAL-01', descricao: 'Balança 01 - Entrada' },
      { unidadeId: unidade.id, codigo: 'BAL-02', descricao: 'Balança 02 - Saída' },
    ],
  })

  await prisma.motivoBloqueio.createMany({
    data: [
      { codigo: 'DOC-PEND', descricao: 'Documentação pendente ou inválida', tipo: 'portaria' },
      { codigo: 'DOC-INV', descricao: 'Documento fiscal inválido', tipo: 'documento' },
      { codigo: 'PLACA-DIV', descricao: 'Placa divergente do agendamento', tipo: 'portaria' },
      { codigo: 'ATRASO', descricao: 'Atraso superior ao permitido', tipo: 'viagem' },
      { codigo: 'SEM-GPS', descricao: 'Sem rastreamento GPS ativo', tipo: 'viagem' },
    ],
  })

  // Janelas: seg a sex 06:00-22:00
  for (let dia = 1; dia <= 5; dia++) {
    await prisma.janelaAgendamento.create({
      data: {
        unidadeId: unidade.id,
        diaSemana: dia,
        horarioInicial: '06:00',
        horarioFinal: '22:00',
        intervaloMinutos: 15,
        capacidadePorHorario: 3,
      },
    })
  }

  // Sábado reduzido
  await prisma.janelaAgendamento.create({
    data: {
      unidadeId: unidade.id,
      diaSemana: 6,
      horarioInicial: '06:00',
      horarioFinal: '14:00',
      intervaloMinutos: 15,
      capacidadePorHorario: 2,
    },
  })

  console.log('✅ Unidade, docas, balanças, motivos e janelas criados')
  return unidade
}
