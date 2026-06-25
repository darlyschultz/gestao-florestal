import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, Calendar, ChevronRight, Clock, FileText, Truck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { PageLayout } from '../../components/layout/PageLayout'
import { agendamentosService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

interface AgendamentoItem {
  id: string
  numero: string
  status: string
  dataHoraSaidaPrevista: string
  transportadora?: { nome: string }
  motorista?: { nome: string }
  veiculo?: { placa: string }
  pendencias?: Array<{ key: string; label: string; grupo: string }>
  resumoPendencias?: string[]
  prontoConfirmar?: boolean
  dadosCompletos?: boolean
}

const STATUS_LABEL: Record<string, string> = {
  pre_agendado: 'Pré-agendado',
  agendado: 'Dados completos',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

export function MeusAgendamentos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<AgendamentoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendentes'>('pendentes')

  function load() {
    setLoading(true)
    agendamentosService
      .list(filtro === 'pendentes' ? { incompletos: 'true' } : {})
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filtro])

  const titulo = user?.perfil === 'motorista' ? 'Meus Horários' : 'Meus Agendamentos'

  return (
    <PageLayout
      title={titulo}
      subtitle="Horário confirmado · complete dados e gere a viagem"
      showBack
      backPath="/menu"
      rightContent={
        <Button size="sm" onClick={() => navigate('/agendamento/calendario')}>
          + {user?.perfil === 'motorista' ? 'Reservar' : 'Reservar'}
        </Button>
      }
    >
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFiltro('pendentes')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold ${filtro === 'pendentes' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}
        >
          Com pendências
        </button>
        <button
          type="button"
          onClick={() => setFiltro('todos')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold ${filtro === 'todos' ? 'bg-forest-100 text-forest-800' : 'bg-gray-100 text-gray-600'}`}
        >
          Todos
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {filtro === 'pendentes' ? 'Nenhum agendamento com pendências' : 'Nenhum agendamento'}
          </p>
          {user?.perfil === 'motorista' ? (
            <Button className="mt-4" onClick={() => navigate('/agendamento/calendario')}>
              Reservar horário
            </Button>
          ) : (
            <Button className="mt-4" onClick={() => navigate('/agendamento/calendario')}>
              Reservar horários
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              hover
              padding="md"
              onClick={() => navigate(`/agendamento/completar/${item.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-gray-500">{item.numero}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                    {item.prontoConfirmar && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Pronto
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                    <Clock size={14} className="text-forest-600" />
                    {format(new Date(item.dataHoraSaidaPrevista), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {item.transportadora?.nome}
                    {item.motorista?.nome && ` · ${item.motorista.nome}`}
                    {item.veiculo?.placa && ` · ${item.veiculo.placa}`}
                  </p>
                  {(item.resumoPendencias?.length ?? 0) > 0 && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>Falta: {item.resumoPendencias!.slice(0, 3).join(', ')}{item.resumoPendencias!.length > 3 ? '…' : ''}</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {user?.perfil === 'motorista' ? (
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-blue-800 flex items-center gap-1">
            <Truck size={14} /> Área do motorista
          </p>
          <p>1. Reserve horários — o slot fica confirmado na hora</p>
          <p>2. Complete veículo, origem e documentos quando souber</p>
          <p className="flex items-center gap-1"><FileText size={12} /> 3. Gere a viagem em Completar quando estiver pronto</p>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-forest-50 rounded-2xl text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-forest-800 flex items-center gap-1">
            <Truck size={14} /> Fluxo de pré-agendamento
          </p>
          <p>1. Reserve horários — cada slot fica confirmado e bloqueado</p>
          <p>2. Complete motorista, veículo e origem quando souber</p>
          <p className="flex items-center gap-1"><FileText size={12} /> 3. Gere a viagem quando todos os dados estiverem OK</p>
        </div>
      )}
    </PageLayout>
  )
}
