import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { EventoViagem } from '../../types'
import { viagensService } from '../../services/api'

const MOCK_EVENTOS: EventoViagem[] = [
  { id: '1', viagemId: '1', tipo: 'status_alterado', descricao: 'Agendamento criado', statusNovo: 'agendado', createdAt: new Date('2024-05-02T08:00:00').toISOString(), user: { id: '1', nome: 'Carlos Oliveira', perfil: 'transportador' } },
  { id: '2', viagemId: '1', tipo: 'status_alterado', descricao: 'Viagem confirmada e criada', statusAnterior: 'agendado', statusNovo: 'agendado', createdAt: new Date('2024-05-02T08:05:00').toISOString(), user: { id: '1', nome: 'Carlos Oliveira', perfil: 'transportador' } },
  { id: '3', viagemId: '1', tipo: 'status_alterado', descricao: 'Carregamento iniciado', statusAnterior: 'agendado', statusNovo: 'em_carregamento', createdAt: new Date('2024-05-02T09:30:00').toISOString(), user: { id: '5', nome: 'Marcos Antônio', perfil: 'motorista' } },
  { id: '4', viagemId: '1', tipo: 'status_alterado', descricao: 'Carregamento concluído', statusAnterior: 'em_carregamento', statusNovo: 'carregado', createdAt: new Date('2024-05-02T10:42:00').toISOString(), user: { id: '5', nome: 'Marcos Antônio', perfil: 'motorista' } },
  { id: '5', viagemId: '1', tipo: 'status_alterado', descricao: 'Viagem em trânsito', statusAnterior: 'carregado', statusNovo: 'em_transito', createdAt: new Date('2024-05-02T11:00:00').toISOString(), latitude: -23.9876, longitude: -47.5432, user: { id: '5', nome: 'Marcos Antônio', perfil: 'motorista' } },
]

const TIPO_LABELS: Record<string, string> = {
  status_alterado: 'Status alterado',
  portaria_liberada: 'Portaria liberada',
  portaria_bloqueada: 'Portaria bloqueada',
  pesagem_inicial: 'Pesagem inicial',
  pesagem_final: 'Pesagem final',
  descarga_liberada: 'Descarga liberada',
  descarga_concluida: 'Descarga concluída',
  alerta_gerado: 'Alerta gerado',
  localizacao: 'Localização registrada',
}

export function HistoricoViagem() {
  const { id } = useParams()
  const [eventos, setEventos] = useState<EventoViagem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    viagensService.historico(id)
      .then((r) => setEventos(r.data))
      .catch(() => setEventos(MOCK_EVENTOS))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <PageLayout
      header={<AppHeader title="Histórico da Viagem" subtitle="Linha do tempo completa" showBack />}
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum evento registrado</p>
        </div>
      ) : (
        <ol className="relative space-y-0">
          {eventos.map((ev, idx) => (
            <li key={ev.id} className="flex gap-4 pb-6 relative">
              {idx < eventos.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
              )}
              <div className="relative z-10 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-forest-100 border-2 border-forest-300 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-forest-600" />
                </div>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {TIPO_LABELS[ev.tipo] || ev.tipo}
                  </p>
                  <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {format(new Date(ev.createdAt), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{ev.descricao}</p>
                {ev.statusNovo && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    {ev.statusAnterior && (
                      <>
                        <span className="text-gray-400">{ev.statusAnterior}</span>
                        <span className="text-gray-300">→</span>
                      </>
                    )}
                    <span className="font-semibold text-forest-600">{ev.statusNovo}</span>
                  </div>
                )}
                {ev.user && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    por <span className="font-medium text-gray-600">{ev.user.nome}</span>
                    <span className="ml-1 text-gray-300">({ev.user.perfil})</span>
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  {format(new Date(ev.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </PageLayout>
  )
}
