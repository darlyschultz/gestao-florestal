export type Perfil = 'admin' | 'transportador' | 'motorista' | 'portaria' | 'operacao' | 'gestor'

export interface User {
  id: string
  nome: string
  email: string
  perfil: Perfil
  transportadoraId?: string
  avatar?: string
  telefone?: string
  cargo?: string
}

export type StatusViagem =
  | 'agendado'
  | 'aguardando_carregamento'
  | 'em_carregamento'
  | 'carregado'
  | 'em_transito'
  | 'proximo_fabrica'
  | 'portaria'
  | 'em_pesagem'
  | 'em_descarga'
  | 'finalizado'
  | 'bloqueado'

export interface Transportadora {
  id: string
  nome: string
  cnpj: string
  telefone?: string
  email?: string
}

export interface Motorista {
  id: string
  nome: string
  cpf: string
  cnh: string
  telefone?: string
  transportadoraId: string
  transportadora?: Transportadora
}

export interface Veiculo {
  id: string
  placa: string
  tipo: string
  marca?: string
  modelo?: string
  capacidadeM3?: number
  placaCarreta?: string
}

export interface Fornecedor {
  id: string
  nome: string
  cnpj: string
}

export interface Fazenda {
  id: string
  nome: string
  cidade: string
  estado: string
  fornecedorId: string
  fornecedor?: Fornecedor
}

export interface Talhao {
  id: string
  nome: string
  fazendaId: string
  areaHa?: number
  tipoMadeira?: string
  fazenda?: Fazenda
}

export interface LocalEmbarque {
  id: string
  nome: string
  talhaoId: string
  latitude: number
  longitude: number
  raioMetros: number
}

export interface Agendamento {
  id: string
  numero: string
  transportadoraId: string
  motoristaId: string
  veiculoId: string
  fornecedorId: string
  fazendaId: string
  talhaoId: string
  localEmbarqueId?: string
  tipoMadeira: string
  quantidadePrevistaM3: number
  dataHoraSaidaPrevista: string
  dataHoraChegadaPrevista: string
  observacoes?: string
  status: string
  transportadora?: Transportadora
  motorista?: Motorista
  veiculo?: Veiculo
  fornecedor?: Fornecedor
  fazenda?: Fazenda
  talhao?: Talhao
  localEmbarque?: LocalEmbarque
  viagem?: Viagem
}

export interface Viagem {
  id: string
  numero: string
  agendamentoId: string
  transportadoraId: string
  motoristaId: string
  veiculoId: string
  status: StatusViagem
  latEmbarque?: number
  lngEmbarque?: number
  latAtual?: number
  lngAtual?: number
  distanciaRestanteKm?: number
  tempoRestanteMin?: number
  createdAt: string
  updatedAt: string
  agendamento?: Agendamento
  transportadora?: Transportadora
  motorista?: Motorista
  veiculo?: Veiculo
  documentos?: DocumentoViagem[]
  alertas?: AlertaViagem[]
  pesagens?: Pesagem[]
  descargas?: Descarga[]
}

export interface DocumentoViagem {
  id: string
  viagemId: string
  tipo: 'nota_fiscal' | 'mdfe' | 'ordem_carregamento' | 'anexo'
  numero?: string
  arquivo?: string
  status: 'pendente' | 'valido' | 'invalido'
  observacao?: string
}

export interface AlertaViagem {
  id: string
  viagemId: string
  tipo: string
  severidade: 'baixa' | 'media' | 'alta' | 'critica'
  mensagem: string
  lido: boolean
  createdAt: string
}

export interface EventoViagem {
  id: string
  viagemId: string
  tipo: string
  descricao: string
  statusAnterior?: string
  statusNovo?: string
  latitude?: number
  longitude?: number
  createdAt: string
  user?: { id: string; nome: string; perfil: string }
}

export interface Pesagem {
  id: string
  viagemId: string
  tipo: 'inicial' | 'final'
  ticketBalanca?: string
  placa: string
  pesoBrutoKg: number
  pesoTaraKg?: number
  pesoLiquidoKg?: number
  operador?: string
  balanca?: string
  createdAt: string
}

export interface Descarga {
  id: string
  viagemId: string
  doca: string
  material?: string
  responsavel?: string
  observacoes?: string
  status: string
  createdAt: string
}

export interface FilaPatio {
  id: string
  viagemId: string
  posicao: number
  status: string
  tempoEstimadoMin?: number
  viagem?: Viagem
}

export const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  aguardando_carregamento: 'Aguard. Carregamento',
  em_carregamento: 'Em Carregamento',
  carregado: 'Carregado',
  em_transito: 'Em Trânsito',
  proximo_fabrica: 'Próximo da Fábrica',
  portaria: 'Na Portaria',
  em_pesagem: 'Em Pesagem',
  em_descarga: 'Em Descarga',
  finalizado: 'Finalizado',
  bloqueado: 'Bloqueado',
}

export const STATUS_COLORS: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  aguardando_carregamento: 'bg-yellow-100 text-yellow-700',
  em_carregamento: 'bg-orange-100 text-orange-700',
  carregado: 'bg-teal-100 text-teal-700',
  em_transito: 'bg-forest-100 text-forest-700',
  proximo_fabrica: 'bg-lime-100 text-lime-700',
  portaria: 'bg-purple-100 text-purple-700',
  em_pesagem: 'bg-indigo-100 text-indigo-700',
  em_descarga: 'bg-amber-100 text-amber-700',
  finalizado: 'bg-green-100 text-green-700',
  bloqueado: 'bg-red-100 text-red-700',
  confirmado: 'bg-green-100 text-green-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  valido: 'bg-green-100 text-green-700',
  invalido: 'bg-red-100 text-red-700',
}
