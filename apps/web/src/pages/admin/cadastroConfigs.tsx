import { CrudPage, CrudConfig } from '../../components/admin/CrudPage'
import api from '../../services/api'

async function loadTransportadoras() {
  const { data } = await api.get('/api/cadastros/transportadoras?all=true')
  return data.map((t: { id: string; nome: string }) => ({ value: t.id, label: t.nome }))
}

async function loadFornecedores() {
  const { data } = await api.get('/api/cadastros/fornecedores?all=true')
  return data.map((f: { id: string; nome: string }) => ({ value: f.id, label: f.nome }))
}

async function loadFazendas() {
  const { data } = await api.get('/api/cadastros/fazendas?all=true')
  return data.map((f: { id: string; nome: string }) => ({ value: f.id, label: f.nome }))
}

async function loadUnidades() {
  const { data } = await api.get('/api/cadastros/unidades?all=true')
  return data.map((u: { id: string; nome: string }) => ({ value: u.id, label: u.nome }))
}

async function loadTiposMadeira() {
  const { data } = await api.get('/api/cadastros/tipos-madeira?all=true')
  return data.map((t: { id: string; descricao: string }) => ({ value: t.id, label: t.descricao }))
}

async function loadTiposVeiculo() {
  const { data } = await api.get('/api/cadastros/tipos-veiculo?all=true')
  return data.map((t: { id: string; descricao: string }) => ({ value: t.id, label: t.descricao }))
}

export const cadastroConfigs: Record<string, CrudConfig> = {
  transportadoras: {
    title: 'Transportadoras',
    apiPath: 'transportadoras',
    searchKeys: ['nome', 'cnpj'],
    listLabel: (i) => String(i.nome),
    listSub: (i) => String(i.cnpj || ''),
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'razaoSocial', label: 'Razão Social' },
      { key: 'cnpj', label: 'CNPJ', required: true },
      { key: 'telefone', label: 'Telefone' },
      { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'responsavel', label: 'Responsável' },
    ],
  },
  motoristas: {
    title: 'Motoristas',
    apiPath: 'motoristas',
    searchKeys: ['nome', 'cpf', 'email'],
    listLabel: (i) => String(i.nome),
    listSub: (i) => `${i.cpf}${i.email ? ` · ${i.email}` : ''}`,
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'cpf', label: 'CPF', required: true },
      { key: 'email', label: 'E-mail de acesso', type: 'email', required: true },
      { key: 'cnh', label: 'CNH', required: true },
      { key: 'categoriaCnh', label: 'Categoria CNH', required: true },
      { key: 'validadeCnh', label: 'Validade CNH', type: 'date', required: true },
      { key: 'telefone', label: 'Telefone' },
      { key: 'transportadoraId', label: 'Transportadora', type: 'select', required: true, loadOptions: loadTransportadoras },
    ],
  },
  veiculos: {
    title: 'Veículos',
    apiPath: 'veiculos',
    searchKeys: ['placa'],
    listLabel: (i) => String(i.placa),
    listSub: (i) => String(i.tipo || ''),
    fields: [
      { key: 'placa', label: 'Placa', required: true },
      { key: 'placaCarreta', label: 'Placa Carreta' },
      { key: 'tipo', label: 'Tipo (legado)', required: true },
      { key: 'tipoVeiculoId', label: 'Tipo de Veículo', type: 'select', loadOptions: loadTiposVeiculo },
      { key: 'marca', label: 'Marca' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'capacidadeM3', label: 'Capacidade m³', type: 'number' },
      { key: 'transportadoraId', label: 'Transportadora', type: 'select', loadOptions: loadTransportadoras },
    ],
  },
  fornecedores: {
    title: 'Fornecedores',
    apiPath: 'fornecedores',
    searchKeys: ['nome', 'cnpj'],
    listLabel: (i) => String(i.nome),
    listSub: (i) => String(i.cnpj),
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'cnpj', label: 'CNPJ', required: true },
      { key: 'municipio', label: 'Município' },
      { key: 'uf', label: 'UF' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'email', label: 'E-mail', type: 'email' },
    ],
  },
  fazendas: {
    title: 'Fazendas',
    apiPath: 'fazendas',
    searchKeys: ['nome'],
    listLabel: (i) => String(i.nome),
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'fornecedorId', label: 'Fornecedor', type: 'select', required: true, loadOptions: loadFornecedores },
      { key: 'municipio', label: 'Município' },
      { key: 'uf', label: 'UF' },
      { key: 'latitude', label: 'Latitude', type: 'number' },
      { key: 'longitude', label: 'Longitude', type: 'number' },
    ],
  },
  talhoes: {
    title: 'Talhões',
    apiPath: 'talhoes',
    searchKeys: ['nome', 'codigo'],
    listLabel: (i) => String(i.nome),
    listSub: (i) => String(i.codigo || ''),
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'codigo', label: 'Código' },
      { key: 'fazendaId', label: 'Fazenda', type: 'select', required: true, loadOptions: loadFazendas },
      { key: 'tipoMadeiraId', label: 'Tipo de Madeira', type: 'select', loadOptions: loadTiposMadeira },
      { key: 'areaHa', label: 'Área (ha)', type: 'number' },
    ],
  },
  'locais-embarque': {
    title: 'Locais de Embarque',
    apiPath: 'locais-embarque',
    searchKeys: ['nome'],
    listLabel: (i) => String(i.nome),
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'talhaoId', label: 'Talhão', type: 'select', required: true, loadOptions: async () => {
        const { data } = await api.get('/api/cadastros/talhoes?all=true')
        return data.map((t: { id: string; nome: string }) => ({ value: t.id, label: t.nome }))
      }},
      { key: 'latitude', label: 'Latitude', type: 'number', required: true },
      { key: 'longitude', label: 'Longitude', type: 'number', required: true },
      { key: 'raioMetros', label: 'Raio (m)', type: 'number' },
    ],
  },
  'tipos-madeira': {
    title: 'Tipos de Madeira',
    apiPath: 'tipos-madeira',
    searchKeys: ['codigo', 'descricao'],
    listLabel: (i) => String(i.descricao),
    listSub: (i) => String(i.codigo),
    fields: [
      { key: 'codigo', label: 'Código', required: true },
      { key: 'descricao', label: 'Descrição', required: true },
      { key: 'unidadeMedida', label: 'Unidade de Medida' },
    ],
  },
  'tipos-veiculo': {
    title: 'Tipos de Veículo',
    apiPath: 'tipos-veiculo',
    searchKeys: ['codigo', 'descricao'],
    listLabel: (i) => String(i.descricao),
    listSub: (i) => String(i.codigo),
    fields: [
      { key: 'codigo', label: 'Código', required: true },
      { key: 'descricao', label: 'Descrição', required: true },
      { key: 'capacidadeM3', label: 'Capacidade m³', type: 'number' },
      { key: 'capacidadeKg', label: 'Capacidade kg', type: 'number' },
    ],
  },
  unidades: {
    title: 'Unidades',
    apiPath: 'unidades',
    searchKeys: ['nome'],
    listLabel: (i) => String(i.nome),
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'cnpj', label: 'CNPJ' },
      { key: 'endereco', label: 'Endereço' },
      { key: 'municipio', label: 'Município' },
      { key: 'uf', label: 'UF' },
      { key: 'latitude', label: 'Latitude', type: 'number' },
      { key: 'longitude', label: 'Longitude', type: 'number' },
    ],
  },
  docas: {
    title: 'Docas',
    apiPath: 'docas',
    searchKeys: ['codigo'],
    listLabel: (i) => String(i.codigo),
    listSub: (i) => String(i.descricao || ''),
    fields: [
      { key: 'unidadeId', label: 'Unidade', type: 'select', required: true, loadOptions: loadUnidades },
      { key: 'codigo', label: 'Código', required: true },
      { key: 'descricao', label: 'Descrição' },
      { key: 'tipoMaterial', label: 'Tipo de Material' },
    ],
  },
  balancas: {
    title: 'Balanças',
    apiPath: 'balancas',
    searchKeys: ['codigo'],
    listLabel: (i) => String(i.codigo),
    listSub: (i) => String(i.descricao || ''),
    fields: [
      { key: 'unidadeId', label: 'Unidade', type: 'select', required: true, loadOptions: loadUnidades },
      { key: 'codigo', label: 'Código', required: true },
      { key: 'descricao', label: 'Descrição' },
    ],
  },
  'motivos-bloqueio': {
    title: 'Motivos de Bloqueio',
    apiPath: 'motivos-bloqueio',
    searchKeys: ['codigo', 'descricao'],
    listLabel: (i) => String(i.descricao),
    listSub: (i) => String(i.codigo),
    fields: [
      { key: 'codigo', label: 'Código', required: true },
      { key: 'descricao', label: 'Descrição', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: [
        { value: 'portaria', label: 'Portaria' },
        { value: 'viagem', label: 'Viagem' },
        { value: 'documento', label: 'Documento' },
      ]},
    ],
  },
  'janelas-agendamento': {
    title: 'Janelas de Agendamento',
    apiPath: 'janelas-agendamento',
    listLabel: (i) => `${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][Number(i.diaSemana)]} ${i.horarioInicial}-${i.horarioFinal}`,
    fields: [
      { key: 'unidadeId', label: 'Unidade', type: 'select', required: true, loadOptions: loadUnidades },
      { key: 'diaSemana', label: 'Dia da Semana (0-6)', type: 'number', required: true },
      { key: 'horarioInicial', label: 'Horário Inicial', required: true },
      { key: 'horarioFinal', label: 'Horário Final', required: true },
      { key: 'intervaloMinutos', label: 'Intervalo (min)', type: 'number' },
      { key: 'capacidadePorHorario', label: 'Capacidade/horário', type: 'number' },
    ],
  },
}

export function CadastroEntityPage({ entity }: { entity: string }) {
  const config = cadastroConfigs[entity]
  if (!config) return <p className="text-center text-gray-400 py-8">Cadastro não encontrado</p>
  return <CrudPage config={config} />
}
