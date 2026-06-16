import { prisma } from './helpers'

export async function seedCadastrosBase() {
  const tipoEuc = await prisma.tipoMadeira.create({
    data: { codigo: 'EUC', descricao: 'Eucalipto', unidadeMedida: 'm³' },
  })
  const tipoPin = await prisma.tipoMadeira.create({
    data: { codigo: 'PIN', descricao: 'Pinus', unidadeMedida: 'm³' },
  })
  const tipoTec = await prisma.tipoMadeira.create({
    data: { codigo: 'TEC', descricao: 'Teca', unidadeMedida: 'm³' },
  })

  const tipoBitrem = await prisma.tipoVeiculo.create({
    data: { codigo: 'BITREM', descricao: 'Bitrem', capacidadeM3: 90, capacidadeKg: 45000 },
  })
  const tipoRodo = await prisma.tipoVeiculo.create({
    data: { codigo: 'RODOTREM', descricao: 'Rodotrem', capacidadeM3: 110, capacidadeKg: 57000 },
  })
  const tipoTruck = await prisma.tipoVeiculo.create({
    data: { codigo: 'TRUCK', descricao: 'Truck', capacidadeM3: 45, capacidadeKg: 25000 },
  })

  const transf1 = await prisma.transportadora.create({
    data: {
      razaoSocial: 'TransFloresta Transportes Ltda',
      nome: 'TransFloresta Ltda',
      nomeFantasia: 'TransFloresta',
      cnpj: '12.345.678/0001-90',
      inscricaoEstadual: '123.456.789.012',
      telefone: '(11) 98765-4321',
      email: 'contato@transfloresta.com.br',
      responsavel: 'Carlos Mendes',
    },
  })

  const transf2 = await prisma.transportadora.create({
    data: {
      razaoSocial: 'LogFlorestal Logística S.A.',
      nome: 'LogFlorestal',
      nomeFantasia: 'LogFlorestal',
      cnpj: '98.765.432/0001-10',
      telefone: '(11) 91234-5678',
      email: 'ops@logflorestal.com.br',
      responsavel: 'Ana Souza',
    },
  })

  const transf3 = await prisma.transportadora.create({
    data: {
      razaoSocial: 'Florestal Prime Transportes Ltda',
      nome: 'Florestal Prime',
      nomeFantasia: 'Florestal Prime',
      cnpj: '11.222.333/0001-44',
      telefone: '(19) 99887-6655',
      email: 'contato@florestalprime.com.br',
      responsavel: 'Roberto Lima',
    },
  })

  const mot1 = await prisma.motorista.create({
    data: {
      nome: 'João Carlos da Silva',
      cpf: '123.456.789-00',
      cnh: 'ABC1234567',
      categoriaCnh: 'E',
      validadeCnh: new Date('2027-06-15'),
      telefone: '(11) 99876-5432',
      email: 'joao.carlos@transfloresta.com.br',
      transportadoraId: transf1.id,
    },
  })

  const mot2 = await prisma.motorista.create({
    data: {
      nome: 'Marcos Antônio Pereira',
      cpf: '987.654.321-00',
      cnh: 'DEF7654321',
      categoriaCnh: 'E',
      validadeCnh: new Date('2026-12-31'),
      telefone: '(11) 98765-1234',
      email: 'marcos.pereira@transfloresta.com.br',
      transportadoraId: transf1.id,
    },
  })

  const mot3 = await prisma.motorista.create({
    data: {
      nome: 'Paulo Henrique Souza',
      cpf: '456.789.123-00',
      cnh: 'GHI4567890',
      categoriaCnh: 'E',
      validadeCnh: new Date('2028-03-20'),
      telefone: '(19) 98765-0001',
      email: 'paulo.souza@logflorestal.com.br',
      transportadoraId: transf2.id,
    },
  })

  const vec1 = await prisma.veiculo.create({
    data: {
      placa: 'ABC1023',
      placaCarreta: 'XYN8787',
      tipo: 'bitrem',
      tipoVeiculoId: tipoBitrem.id,
      marca: 'Volvo',
      modelo: 'FH 540',
      anoFabricacao: 2021,
      capacidadeM3: 90,
      capacidadeKg: 45000,
      transportadoraId: transf1.id,
      rastreadorId: 'RAST-001',
    },
  })

  const vec2 = await prisma.veiculo.create({
    data: {
      placa: 'DEF4556',
      placaCarreta: 'ZKW3344',
      tipo: 'rodotrem',
      tipoVeiculoId: tipoRodo.id,
      marca: 'Scania',
      modelo: 'R 500',
      anoFabricacao: 2020,
      capacidadeM3: 110,
      capacidadeKg: 57000,
      transportadoraId: transf1.id,
      rastreadorId: 'RAST-002',
    },
  })

  const vec3 = await prisma.veiculo.create({
    data: {
      placa: 'CHE3634',
      placaCarreta: 'AAI1822',
      tipo: 'bitrem',
      tipoVeiculoId: tipoBitrem.id,
      marca: 'Mercedes-Benz',
      modelo: 'Actros 2651',
      anoFabricacao: 2022,
      capacidadeM3: 95,
      capacidadeKg: 48000,
      transportadoraId: transf2.id,
      rastreadorId: 'RAST-003',
    },
  })

  const forn1 = await prisma.fornecedor.create({
    data: {
      razaoSocial: 'Fazenda Boa Vista Agroflorestal Ltda',
      nome: 'Fazenda Boa Vista',
      nomeFantasia: 'Boa Vista',
      cnpj: '11.222.333/0001-44',
      municipio: 'Itapeva',
      uf: 'SP',
      telefone: '(18) 99876-5432',
      email: 'contato@fazendaboavista.com.br',
    },
  })

  const forn2 = await prisma.fornecedor.create({
    data: {
      razaoSocial: 'Cerrado Verde Agroflorestal S.A.',
      nome: 'Cerrado Verde Agroflorestal',
      nomeFantasia: 'Cerrado Verde',
      cnpj: '55.666.777/0001-88',
      municipio: 'Anápolis',
      uf: 'GO',
      telefone: '(64) 99123-4567',
      email: 'gerencia@cerradoverde.com.br',
    },
  })

  const faz1 = await prisma.fazenda.create({
    data: {
      nome: 'Fazenda Boa Vista',
      fornecedorId: forn1.id,
      municipio: 'Itapeva',
      uf: 'SP',
      cidade: 'Itapeva',
      estado: 'SP',
      latitude: -23.7636,
      longitude: -47.1234,
      raioCercaMetros: 300,
    },
  })

  const faz2 = await prisma.fazenda.create({
    data: {
      nome: 'Fazenda Santa Nélia',
      fornecedorId: forn1.id,
      municipio: 'Capão Bonito',
      uf: 'SP',
      cidade: 'Capão Bonito',
      estado: 'SP',
      latitude: -23.9876,
      longitude: -47.5432,
      raioCercaMetros: 350,
    },
  })

  const faz3 = await prisma.fazenda.create({
    data: {
      nome: 'Fazenda São Pedro',
      fornecedorId: forn2.id,
      municipio: 'Anápolis',
      uf: 'GO',
      cidade: 'Anápolis',
      estado: 'GO',
      latitude: -16.3281,
      longitude: -48.9534,
      raioCercaMetros: 400,
    },
  })

  const tal1 = await prisma.talhao.create({
    data: {
      codigo: 'T12',
      nome: 'Talhão 12',
      descricao: 'Talhão principal de eucalipto',
      fazendaId: faz1.id,
      tipoMadeiraId: tipoEuc.id,
      tipoMadeira: 'Eucalipto',
      areaHa: 45.5,
      latitude: -23.7636,
      longitude: -47.1234,
    },
  })

  const tal2 = await prisma.talhao.create({
    data: {
      codigo: 'T08',
      nome: 'Talhão 8',
      descricao: 'Talhão de pinus',
      fazendaId: faz1.id,
      tipoMadeiraId: tipoPin.id,
      tipoMadeira: 'Pinus',
      areaHa: 32.0,
    },
  })

  const tal3 = await prisma.talhao.create({
    data: {
      codigo: 'TB',
      nome: 'Talhão B',
      descricao: 'Talhão secundário',
      fazendaId: faz2.id,
      tipoMadeiraId: tipoEuc.id,
      tipoMadeira: 'Eucalipto',
      areaHa: 60.0,
    },
  })

  const loc1 = await prisma.localEmbarque.create({
    data: {
      nome: 'Pátio Principal - Talhão 12',
      talhaoId: tal1.id,
      latitude: -23.7636,
      longitude: -47.1234,
      raioMetros: 300,
    },
  })

  console.log('✅ Cadastros base criados (tipos, transportadoras, motoristas, veículos, fornecedores, fazendas, talhões)')

  return {
    tiposMadeira: { tipoEuc, tipoPin, tipoTec },
    tiposVeiculo: { tipoBitrem, tipoRodo, tipoTruck },
    transportadoras: { transf1, transf2, transf3 },
    motoristas: { mot1, mot2, mot3 },
    veiculos: { vec1, vec2, vec3 },
    fornecedores: { forn1, forn2 },
    fazendas: { faz1, faz2, faz3 },
    talhoes: { tal1, tal2, tal3 },
    locaisEmbarque: { loc1 },
  }
}
