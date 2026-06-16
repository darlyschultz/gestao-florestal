import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Map, Phone, FileText, Truck, Package, Weight, AlertTriangle,
  ChevronRight, MapPin, Calendar, Clock
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Timeline } from '../../components/ui/Timeline'
import { Viagem } from '../../types'
import { viagensService } from '../../services/api'

const TIMELINE_STEPS = [
  { key: 'agendado', label: 'Agendado' },
  { key: 'carregado', label: 'Carregado' },
  { key: 'em_transito', label: 'Em Trânsito' },
  { key: 'portaria', label: 'Portaria' },
  { key: 'em_pesagem', label: 'Pesagem' },
  { key: 'em_descarga', label: 'Descarga' },
  { key: 'finalizado', label: 'Finalizado' },
]

const STATUS_ORDER = ['agendado', 'carregado', 'em_transito', 'portaria', 'em_pesagem', 'em_descarga', 'finalizado']

function getStepStatus(stepKey: string, currentStatus: string): 'completed' | 'active' | 'pending' {
  const stepIdx = STATUS_ORDER.indexOf(stepKey)
  const curIdx = STATUS_ORDER.indexOf(currentStatus)

  if (curIdx === -1) return 'pending'
  if (stepIdx < curIdx) return 'completed'
  if (stepIdx === curIdx) return 'active'
  return 'pending'
}

// Mock data
const MOCK_VIAGEM: Viagem = {
  id: '2',
  numero: 'VGM-2024-0002',
  agendamentoId: '2',
  transportadoraId: '1',
  motoristaId: '2',
  veiculoId: '2',
  status: 'em_transito',
  distanciaRestanteKm: 68,
  tempoRestanteMin: 72,
  latAtual: -23.8500,
  lngAtual: -47.3500,
  createdAt: new Date('2024-05-02T09:30:00').toISOString(),
  updatedAt: new Date().toISOString(),
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
    veiculo: { id: '2', placa: 'DEF4556', tipo: 'rodotrem', placaCarreta: 'ZKW3344' },
  },
  transportadora: { id: '1', nome: 'TransFloresta Ltda', cnpj: '' },
  motorista: { id: '2', nome: 'Marcos Antônio Pereira', cpf: '', cnh: '', transportadoraId: '1', telefone: '(11) 98765-1234' },
  veiculo: { id: '2', placa: 'DEF4556', tipo: 'rodotrem', placaCarreta: 'ZKW3344' },
  documentos: [
    { id: '1', viagemId: '2', tipo: 'nota_fiscal', numero: '234567', status: 'valido' },
    { id: '2', viagemId: '2', tipo: 'mdfe', numero: '876543', status: 'valido' },
    { id: '3', viagemId: '2', tipo: 'ordem_carregamento', numero: 'OC-002345', status: 'pendente' },
  ],
  alertas: [
    { id: '1', viagemId: '2', tipo: 'desvio_rota', severidade: 'alta', mensagem: 'Veículo fora da rota', lido: false, createdAt: new Date().toISOString() },
  ],
}

export function DetalheViagem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [viagem, setViagem] = useState<Viagem | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!id) return
    viagensService.get(id)
      .then((r) => setViagem(r.data))
      .catch(() => setViagem({ ...MOCK_VIAGEM, id: id! }))
      .finally(() => setLoading(false))
  }, [id])

  async function handleUpdateStatus(newStatus: string) {
    if (!viagem) return
    setUpdatingStatus(true)
    try {
      const r = await viagensService.updateStatus(viagem.id, { status: newStatus })
      setViagem(r.data)
    } catch {
      setViagem((v) => v ? { ...v, status: newStatus as Viagem['status'] } : null)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <PageLayout header={<AppHeader title="Detalhes" showBack />}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      </PageLayout>
    )
  }

  if (!viagem) {
    return (
      <PageLayout header={<AppHeader title="Viagem" showBack />}>
        <div className="text-center py-16 text-gray-500">Viagem não encontrada</div>
      </PageLayout>
    )
  }

  const timelineItems = TIMELINE_STEPS.map((step) => ({
    id: step.key,
    title: step.label,
    status: getStepStatus(step.key, viagem.status),
  }))

  const nextActions: { label: string; status: string; variant?: 'primary' | 'secondary' }[] = []
  if (viagem.status === 'agendado') nextActions.push({ label: 'Iniciar Carregamento', status: 'em_carregamento' })
  if (viagem.status === 'em_carregamento') nextActions.push({ label: 'Confirmar Carregado', status: 'carregado' })
  if (viagem.status === 'carregado') nextActions.push({ label: 'Iniciar Viagem', status: 'em_transito' })

  return (
    <PageLayout
      header={
        <AppHeader
          title="Detalhe da Viagem"
          subtitle={`Acompanhe a status da viagem`}
          showBack
          rightContent={
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
              <FileText size={18} />
            </button>
          }
        />
      }
    >
      <div className="space-y-4 pb-4">
        {/* Status / Info geral */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div>
              <StatusBadge status={viagem.status} />
              <p className="text-xs text-gray-400 mt-1">ID da Viagem: {viagem.numero}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-0.5">Placa</p>
              <p className="text-sm font-bold text-gray-800">{viagem.veiculo?.placa || viagem.agendamento?.veiculo?.placa || '—'}</p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-0.5">Placa Carreta</p>
              <p className="text-sm font-bold text-gray-800">{viagem.veiculo?.placaCarreta || viagem.agendamento?.veiculo?.placaCarreta || '—'}</p>
            </div>
          </div>

          {viagem.distanciaRestanteKm && viagem.tempoRestanteMin && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 p-2.5 bg-forest-50 rounded-xl">
                <MapPin size={16} className="text-forest-600" />
                <div>
                  <p className="text-xs text-gray-500">Distância</p>
                  <p className="text-sm font-bold text-forest-700">{viagem.distanciaRestanteKm} km</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 p-2.5 bg-forest-50 rounded-xl">
                <Clock size={16} className="text-forest-600" />
                <div>
                  <p className="text-xs text-gray-500">Tempo</p>
                  <p className="text-sm font-bold text-forest-700">
                    {Math.floor(viagem.tempoRestanteMin / 60)}h {viagem.tempoRestanteMin % 60}min
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Alertas */}
        {viagem.alertas && viagem.alertas.length > 0 && (
          <Card
            hover
            onClick={() => navigate(`/viagens/${viagem.id}/alertas`)}
            className="border-l-4 border-l-red-400"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {viagem.alertas.length} alerta{viagem.alertas.length > 1 ? 's' : ''} ativo{viagem.alertas.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">{viagem.alertas[0]?.mensagem}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Progresso da Viagem</h3>
          <Timeline items={timelineItems} />
        </Card>

        {/* Dados da viagem */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo da Viagem</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-xs text-gray-500">Origem</span>
              <span className="text-xs font-medium text-gray-700 text-right">
                {viagem.agendamento?.fazenda?.nome}<br />
                <span className="text-gray-400">{viagem.agendamento?.fazenda?.cidade}/{viagem.agendamento?.fazenda?.estado}</span>
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-xs text-gray-500">Transportadora</span>
              <span className="text-xs font-medium text-gray-700">{viagem.transportadora?.nome}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-xs text-gray-500">Motorista</span>
              <span className="text-xs font-medium text-gray-700">{viagem.motorista?.nome}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-gray-500">Qtd. Prevista</span>
              <span className="text-xs font-bold text-forest-700">
                {viagem.agendamento?.quantidadePrevistaM3} m³
              </span>
            </div>
          </div>
        </Card>

        {/* Documentos */}
        {viagem.documentos && viagem.documentos.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Documentos</h3>
            <div className="space-y-2">
              {viagem.documentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-gray-700 capitalize">
                      {doc.tipo.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400">{doc.numero}</p>
                  </div>
                  <StatusBadge status={doc.status} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Ações principais */}
        <div className="space-y-3">
          {nextActions.map((action) => (
            <Button
              key={action.status}
              fullWidth
              size="lg"
              loading={updatingStatus}
              onClick={() => handleUpdateStatus(action.status)}
            >
              {action.label}
            </Button>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(`/viagens/${viagem.id}/mapa`)}
              icon={<Map size={16} />}
            >
              Ver no Mapa
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(`/viagens/${viagem.id}/historico`)}
              icon={<Clock size={16} />}
            >
              Histórico
            </Button>
          </div>

          {viagem.motorista?.telefone && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => window.open(`tel:${viagem.motorista?.telefone}`)}
              icon={<Phone size={16} />}
            >
              Contato Motorista
            </Button>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
