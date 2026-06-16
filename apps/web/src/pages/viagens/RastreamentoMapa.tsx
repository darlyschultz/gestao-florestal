import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Navigation, Clock, Truck, RefreshCw } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { MapView } from '../../components/ui/MapView'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { viagensService } from '../../services/api'
import { Viagem } from '../../types'

export function RastreamentoMapa() {
  const { id } = useParams()
  const [viagem, setViagem] = useState<Viagem | null>(null)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    if (!id) return
    viagensService.get(id)
      .then((r) => setViagem(r.data))
      .catch(() =>
        setViagem({
          id: id!,
          numero: 'VGM-2024-0002',
          agendamentoId: '',
          transportadoraId: '',
          motoristaId: '',
          veiculoId: '',
          status: 'em_transito',
          latAtual: -23.8500,
          lngAtual: -47.3500,
          distanciaRestanteKm: 68,
          tempoRestanteMin: 72,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          agendamento: {
            id: '',
            numero: '',
            transportadoraId: '',
            motoristaId: '',
            veiculoId: '',
            fornecedorId: '',
            fazendaId: '',
            talhaoId: '',
            tipoMadeira: 'Eucalipto',
            quantidadePrevistaM3: 38,
            dataHoraSaidaPrevista: '',
            dataHoraChegadaPrevista: '',
            status: '',
            fazenda: { id: '', nome: 'Faz. Santa Nélia', cidade: 'Capão Bonito', estado: 'SP', fornecedorId: '' },
            veiculo: { id: '', placa: 'DEF4556', tipo: 'rodotrem' },
          },
          motorista: { id: '', nome: 'Marcos Antônio Pereira', cpf: '', cnh: '', transportadoraId: '', telefone: '(11)9 8765-1234' },
          veiculo: { id: '', placa: 'DEF4556', tipo: 'rodotrem' },
        })
      )
  }, [id])

  function simulateUpdate() {
    if (!viagem) return
    setSimulating(true)

    setTimeout(() => {
      setViagem((v) =>
        v
          ? {
              ...v,
              latAtual: (v.latAtual || -23.85) + 0.005,
              lngAtual: (v.lngAtual || -47.35) + 0.01,
              distanciaRestanteKm: Math.max(0, (v.distanciaRestanteKm || 68) - 5),
              tempoRestanteMin: Math.max(0, (v.tempoRestanteMin || 72) - 6),
            }
          : null
      )
      setSimulating(false)
    }, 1000)
  }

  return (
    <PageLayout
      header={
        <AppHeader
          title="Rastreamento da Viagem"
          subtitle={viagem?.numero}
          showBack
        />
      }
      noPadding
    >
      <div className="relative flex flex-col h-[calc(100vh-64px-80px)]">
        {/* Mapa ocupa a tela toda */}
        <div className="flex-1 relative">
          <MapView
            origin={
              viagem?.agendamento?.fazenda
                ? {
                    lat: -23.9876,
                    lng: -47.5432,
                    label: viagem.agendamento.fazenda.nome,
                  }
                : undefined
            }
            destination={{ lat: -23.5489, lng: -46.6388, label: 'Fábrica Verde' }}
            current={
              viagem?.latAtual && viagem?.lngAtual
                ? { lat: viagem.latAtual, lng: viagem.lngAtual }
                : undefined
            }
            height="h-full"
          />

          {/* Badge status */}
          {viagem && (
            <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <StatusBadge status={viagem.status} size="sm" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow text-xs font-bold text-gray-700">
                {viagem.veiculo?.placa || viagem.agendamento?.veiculo?.placa}
              </div>
            </div>
          )}
        </div>

        {/* Card inferior */}
        {viagem && (
          <div className="bg-white rounded-t-3xl shadow-2xl px-4 pt-4 pb-6 space-y-4">
            {/* Distância / tempo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-forest-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-0.5">Distância</p>
                <p className="text-base font-bold text-forest-700">
                  {viagem.distanciaRestanteKm} km
                </p>
              </div>
              <div className="text-center p-3 bg-forest-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-0.5">Tempo</p>
                <p className="text-base font-bold text-forest-700">
                  {viagem.tempoRestanteMin
                    ? `${Math.floor(viagem.tempoRestanteMin / 60)}h ${viagem.tempoRestanteMin % 60}m`
                    : '—'}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-0.5">Motorista</p>
                <p className="text-xs font-bold text-gray-700 leading-tight">
                  {viagem.motorista?.nome?.split(' ')[0]}
                </p>
              </div>
            </div>

            {/* Origem → Destino */}
            <div className="flex items-center gap-2">
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                  <MapPin size={10} className="text-green-500" />
                  ORIGEM
                </div>
                <p className="font-semibold text-gray-800">
                  {viagem.agendamento?.fazenda?.nome || 'Origem'}
                </p>
              </div>
              <div className="text-gray-300">→</div>
              <div className="flex-1 text-xs text-right">
                <div className="flex items-center gap-1 text-gray-500 mb-0.5 justify-end">
                  DESTINO
                  <MapPin size={10} className="text-blue-500" />
                </div>
                <p className="font-semibold text-gray-800">Fábrica Verde</p>
              </div>
            </div>

            <Button
              fullWidth
              variant="secondary"
              loading={simulating}
              onClick={simulateUpdate}
              icon={<RefreshCw size={16} />}
            >
              Simular atualização de rota
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
