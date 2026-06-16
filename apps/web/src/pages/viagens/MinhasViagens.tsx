import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Truck, ChevronRight, Search, Filter, MapPin } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Input } from '../../components/ui/Input'
import { Viagem } from '../../types'
import { viagensService } from '../../services/api'

const FILTERS = [
  { label: 'Todas', value: 'todos' },
  { label: 'Agendadas', value: 'agendado' },
  { label: 'Em andamento', value: 'em_transito' },
  { label: 'Finalizadas', value: 'finalizado' },
]

// Dados mock para quando a API não estiver disponível
const MOCK_VIAGENS: Viagem[] = [
  {
    id: '1',
    numero: 'VGM-2024-0002',
    agendamentoId: '2',
    transportadoraId: '1',
    motoristaId: '2',
    veiculoId: '2',
    status: 'em_transito',
    distanciaRestanteKm: 68,
    tempoRestanteMin: 72,
    createdAt: new Date('2024-05-02T09:30:00').toISOString(),
    updatedAt: new Date('2024-05-02T11:30:00').toISOString(),
    agendamento: {
      id: '2',
      numero: 'AGD-2024-0002',
      transportadoraId: '1',
      motoristaId: '2',
      veiculoId: '2',
      fornecedorId: '1',
      fazendaId: '2',
      talhaoId: '2',
      tipoMadeira: 'Pinus',
      quantidadePrevistaM3: 38,
      dataHoraSaidaPrevista: new Date('2024-05-02T09:30:00').toISOString(),
      dataHoraChegadaPrevista: new Date('2024-05-02T13:30:00').toISOString(),
      status: 'confirmado',
      fazenda: { id: '2', nome: 'Faz. Santa Nélia', cidade: 'Capão Bonito', estado: 'SP', fornecedorId: '1' },
      veiculo: { id: '2', placa: 'DEF4556', tipo: 'rodotrem' },
    },
    transportadora: { id: '1', nome: 'TransFloresta Ltda', cnpj: '' },
    motorista: { id: '2', nome: 'Marcos Antônio', cpf: '', cnh: '', transportadoraId: '1' },
  },
  {
    id: '3',
    numero: 'VGM-2024-0003',
    agendamentoId: '3',
    transportadoraId: '2',
    motoristaId: '3',
    veiculoId: '3',
    status: 'portaria',
    createdAt: new Date('2024-05-02T07:00:00').toISOString(),
    updatedAt: new Date('2024-05-02T14:45:00').toISOString(),
    agendamento: {
      id: '3',
      numero: 'AGD-2024-0003',
      transportadoraId: '2',
      motoristaId: '3',
      veiculoId: '3',
      fornecedorId: '2',
      fazendaId: '3',
      talhaoId: '3',
      tipoMadeira: 'Eucalipto',
      quantidadePrevistaM3: 52,
      dataHoraSaidaPrevista: new Date('2024-05-02T07:00:00').toISOString(),
      dataHoraChegadaPrevista: new Date('2024-05-02T15:00:00').toISOString(),
      status: 'confirmado',
      fazenda: { id: '3', nome: 'Faz. São Pedro', cidade: 'Anápolis', estado: 'GO', fornecedorId: '2' },
      veiculo: { id: '3', placa: 'CHE3634', tipo: 'bitrem' },
    },
    transportadora: { id: '2', nome: 'LogFlorestal', cnpj: '' },
    motorista: { id: '3', nome: 'Paulo Henrique', cpf: '', cnh: '', transportadoraId: '2' },
  },
  {
    id: '1f',
    numero: 'VGM-2024-0001',
    agendamentoId: '1',
    transportadoraId: '1',
    motoristaId: '1',
    veiculoId: '1',
    status: 'finalizado',
    createdAt: new Date('2024-05-01T10:00:00').toISOString(),
    updatedAt: new Date('2024-05-01T17:00:00').toISOString(),
    agendamento: {
      id: '1',
      numero: 'AGD-2024-0001',
      transportadoraId: '1',
      motoristaId: '1',
      veiculoId: '1',
      fornecedorId: '1',
      fazendaId: '1',
      talhaoId: '1',
      tipoMadeira: 'Eucalipto',
      quantidadePrevistaM3: 45.5,
      dataHoraSaidaPrevista: new Date('2024-05-01T10:00:00').toISOString(),
      dataHoraChegadaPrevista: new Date('2024-05-01T14:00:00').toISOString(),
      status: 'confirmado',
      fazenda: { id: '1', nome: 'Fazenda Boa Vista', cidade: 'Itapeva', estado: 'SP', fornecedorId: '1' },
      veiculo: { id: '1', placa: 'ABC1023', tipo: 'bitrem' },
    },
    transportadora: { id: '1', nome: 'TransFloresta Ltda', cnpj: '' },
    motorista: { id: '1', nome: 'João Carlos da Silva', cpf: '', cnh: '', transportadoraId: '1' },
  },
]

export function MinhasViagens() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    viagensService.list()
      .then((r) => setViagens(r.data))
      .catch(() => setViagens(MOCK_VIAGENS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = viagens.filter((v) => {
    const matchFilter = filter === 'todos' || v.status === filter
    const term = search.toLowerCase()
    const matchSearch =
      !term ||
      v.numero.toLowerCase().includes(term) ||
      (v.agendamento?.veiculo?.placa || v.veiculo?.placa || '').toLowerCase().includes(term) ||
      (v.motorista?.nome || '').toLowerCase().includes(term)
    return matchFilter && matchSearch
  })

  return (
    <PageLayout
      header={
        <AppHeader
          title="Minhas Viagens"
          subtitle="Acompanhe suas entregas"
          showBack
          backPath="/menu"
        />
      }
    >
      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <Input
          placeholder="Buscar por número, placa ou motorista..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filter === f.value
                  ? 'bg-forest-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-forest-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Truck size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma viagem encontrada</p>
          <p className="text-gray-400 text-sm mt-1">Ajuste os filtros ou crie um agendamento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((viagem) => (
            <Card
              key={viagem.id}
              hover
              onClick={() => navigate(`/viagens/${viagem.id}`)}
              className="group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{viagem.numero}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {viagem.veiculo?.placa || viagem.agendamento?.veiculo?.placa || '—'}
                    {(viagem.veiculo?.tipo || viagem.agendamento?.veiculo?.tipo) && (
                      <span className="text-xs text-gray-500 font-normal ml-1.5">
                        · {viagem.veiculo?.tipo || viagem.agendamento?.veiculo?.tipo}
                      </span>
                    )}
                  </p>
                </div>
                <StatusBadge status={viagem.status} size="sm" />
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin size={12} className="text-forest-500" />
                <span className="truncate">
                  {viagem.agendamento?.fazenda?.nome
                    ? `${viagem.agendamento.fazenda.nome} — ${viagem.agendamento.fazenda.cidade}/${viagem.agendamento.fazenda.estado}`
                    : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {viagem.motorista?.nome && (
                    <span>{viagem.motorista.nome}</span>
                  )}
                  {viagem.agendamento?.dataHoraSaidaPrevista && (
                    <span className="ml-2 text-gray-400">
                      {format(new Date(viagem.agendamento.dataHoraSaidaPrevista), "dd/MM HH:mm")}
                    </span>
                  )}
                </div>
                {viagem.distanciaRestanteKm && (
                  <div className="text-xs text-forest-600 font-semibold bg-forest-50 px-2 py-0.5 rounded-lg">
                    {viagem.distanciaRestanteKm} km
                  </div>
                )}
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
