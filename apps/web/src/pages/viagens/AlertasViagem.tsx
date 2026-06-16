import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle, Navigation, Clock, Wifi, FileWarning, MapPin, Bell
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { AlertaViagem } from '../../types'
import { viagensService } from '../../services/api'

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  desvio_rota: { icon: <Navigation size={18} />, label: 'Desvio de rota' },
  parada_prolongada: { icon: <Clock size={18} />, label: 'Parada prolongada' },
  atraso: { icon: <Clock size={18} />, label: 'Atraso na viagem' },
  chegada_cerca: { icon: <MapPin size={18} />, label: 'Chegada na cerca' },
  sem_localizacao: { icon: <Wifi size={18} />, label: 'Sem localização' },
  documento_pendente: { icon: <FileWarning size={18} />, label: 'Documento pendente' },
}

const SEV_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  baixa: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-400' },
  media: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-l-yellow-400' },
  alta: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-l-orange-400' },
  critica: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-l-red-500' },
}

const MOCK_ALERTAS: AlertaViagem[] = [
  {
    id: '1',
    viagemId: '2',
    tipo: 'desvio_rota',
    severidade: 'alta',
    mensagem: 'Veículo detectado fora da rota planejada por mais de 2 km',
    lido: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    viagemId: '2',
    tipo: 'parada_prolongada',
    severidade: 'media',
    mensagem: 'Veículo parado por mais de 30 minutos em ponto não autorizado',
    lido: false,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    viagemId: '2',
    tipo: 'documento_pendente',
    severidade: 'baixa',
    mensagem: 'Ordem de carregamento aguardando validação da portaria',
    lido: true,
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
]

export function AlertasViagem() {
  const { id } = useParams()
  const [alertas, setAlertas] = useState<AlertaViagem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    viagensService.alertas(id)
      .then((r) => setAlertas(r.data))
      .catch(() => setAlertas(MOCK_ALERTAS))
      .finally(() => setLoading(false))
  }, [id])

  const naoLidos = alertas.filter((a) => !a.lido).length

  return (
    <PageLayout
      header={
        <AppHeader
          title="Alertas da Viagem"
          subtitle={naoLidos > 0 ? `${naoLidos} alerta(s) não lido(s)` : 'Nenhum alerta pendente'}
          showBack
        />
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : alertas.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum alerta registrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => {
            const tipo = TIPO_CONFIG[alerta.tipo] || { icon: <AlertTriangle size={18} />, label: alerta.tipo }
            const sev = SEV_CONFIG[alerta.severidade] || SEV_CONFIG.media

            return (
              <div
                key={alerta.id}
                className={`border-l-4 ${sev.border} bg-white rounded-2xl shadow-card p-4 ${alerta.lido ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${sev.bg} shrink-0`}>
                    <div className={sev.color}>{tipo.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{tipo.label}</p>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                        {alerta.severidade}
                      </span>
                      {!alerta.lido && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          Novo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alerta.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {format(new Date(alerta.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
