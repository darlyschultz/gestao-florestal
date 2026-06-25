import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MapPin, Navigation, RefreshCw, Truck, AlertTriangle, ChevronRight } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { FleetMap } from '../../components/ui/FleetMap'
import { viagensService } from '../../services/api'
import { STATUS_LABELS } from '../../types'

interface VeiculoMapa {
  id: string
  numero: string
  status: string
  placa: string
  motorista?: string
  transportadora?: string
  fazenda?: string
  lat: number
  lng: number
  latEmbarque?: number
  lngEmbarque?: number
  distanciaRestanteKm?: number
  tempoRestanteMin?: number
  alertasCount: number
  updatedAt?: string
}

interface MapaPayload {
  fabrica: { lat: number; lng: number; label: string } | null
  veiculos: VeiculoMapa[]
  total: number
}

export function MapaFrota() {
  const navigate = useNavigate()
  const [data, setData] = useState<MapaPayload>({ fabrica: null, veiculos: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const load = useCallback(() => {
    setLoading(true)
    viagensService
      .mapaFrota()
      .then((r) => {
        setData(r.data)
        setLastUpdate(new Date())
        setSelectedId((prev) => {
          if (prev && r.data.veiculos.some((v: VeiculoMapa) => v.id === prev)) return prev
          return r.data.veiculos[0]?.id ?? null
        })
      })
      .catch(() => setData({ fabrica: null, veiculos: [], total: 0 }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const selected = data.veiculos.find((v) => v.id === selectedId)

  return (
    <PageLayout
      title="Mapa da Frota"
      subtitle={`${data.total} caminhão${data.total !== 1 ? 'ões' : ''} em trânsito`}
      showBack
      backPath="/menu"
      noPadding
      rightContent={
        <button
          type="button"
          onClick={load}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          title="Atualizar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      }
    >
      <div className="px-4 md:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-4 lg:gap-6 lg:items-start">
          {/* Mapa */}
          <div className="order-1">
            {loading && data.veiculos.length === 0 ? (
              <div className="h-[420px] lg:h-[calc(100vh-220px)] min-h-[360px] rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center">
                <Navigation size={32} className="text-gray-300" />
              </div>
            ) : data.veiculos.length === 0 ? (
              <div className="h-[420px] rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6">
                <Truck size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">Nenhum caminhão em trânsito</p>
                <p className="text-sm text-gray-400 mt-1">Veículos com status em trânsito aparecerão aqui</p>
              </div>
            ) : (
              <FleetMap
                veiculos={data.veiculos.map((v) => ({
                  id: v.id,
                  numero: v.numero,
                  placa: v.placa,
                  motorista: v.motorista,
                  status: v.status,
                  lat: v.lat,
                  lng: v.lng,
                  origem:
                    v.latEmbarque != null && v.lngEmbarque != null
                      ? { lat: v.latEmbarque, lng: v.lngEmbarque, label: v.fazenda }
                      : undefined,
                  distanciaRestanteKm: v.distanciaRestanteKm,
                }))}
                fabrica={data.fabrica ?? undefined}
                selectedId={selectedId}
                onSelect={setSelectedId}
                height="h-[420px] lg:h-[calc(100vh-220px)] lg:min-h-[480px]"
              />
            )}
            <p className="text-[10px] text-gray-400 mt-2 text-center lg:text-left">
              Atualizado {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
              {' · '}refresh automático a cada 30s
            </p>
          </div>

          {/* Lista lateral */}
          <div className="order-2 space-y-3 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Truck size={16} className="text-forest-600" />
                Em trânsito ({data.veiculos.length})
              </h2>
            </div>

            {data.veiculos.length === 0 && !loading ? (
              <Card padding="md">
                <p className="text-sm text-gray-500 text-center py-4">Lista vazia</p>
              </Card>
            ) : (
              data.veiculos.map((v) => (
                <Card
                  key={v.id}
                  hover
                  padding="md"
                  onClick={() => setSelectedId(v.id)}
                  className={`cursor-pointer transition-all ${
                    selectedId === v.id ? 'ring-2 ring-forest-500 shadow-md' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-gray-900">{v.placa}</span>
                        <StatusBadge status={v.status} size="sm" />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{v.motorista}</p>
                      <p className="text-xs text-gray-400 truncate">{v.fazenda || v.transportadora}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        {v.distanciaRestanteKm != null && (
                          <span className="text-forest-700 font-semibold">{v.distanciaRestanteKm} km restantes</span>
                        )}
                        {v.tempoRestanteMin != null && (
                          <span>~{v.tempoRestanteMin} min</span>
                        )}
                        {v.alertasCount > 0 && (
                          <span className="flex items-center gap-0.5 text-red-600">
                            <AlertTriangle size={12} />
                            {v.alertasCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </Card>
              ))
            )}

            {selected && (
              <Card padding="md" className="bg-forest-50 border-forest-100">
                <p className="text-xs font-semibold text-forest-800 uppercase mb-2">Selecionado</p>
                <p className="text-lg font-bold text-gray-900">{selected.placa}</p>
                <p className="text-sm text-gray-600">{selected.motorista}</p>
                <p className="text-xs text-gray-500 mt-1">{STATUS_LABELS[selected.status as keyof typeof STATUS_LABELS] || selected.status}</p>
                {selected.lat != null && (
                  <p className="text-[10px] font-mono text-gray-400 mt-2 flex items-center gap-1">
                    <MapPin size={10} />
                    {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" fullWidth onClick={() => navigate(`/viagens/${selected.id}/mapa`)}>
                    Rastrear
                  </Button>
                  <Button size="sm" variant="outline" fullWidth onClick={() => navigate(`/viagens/${selected.id}`)}>
                    Detalhes
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
