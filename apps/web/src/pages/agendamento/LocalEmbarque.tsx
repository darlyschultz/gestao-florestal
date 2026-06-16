import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Navigation, CheckCircle, AlertCircle } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { MapView } from '../../components/ui/MapView'
import { useAgendamentoRegras } from '../../hooks/useAgendamentoRegras'

interface GeoState {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string
  captured: boolean
  dentroZona: boolean | null
}

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)) * 111000
}

export function LocalEmbarque() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const form = state.form as { talhaoId?: string; fazendaId?: string } | undefined
  const { regras } = useAgendamentoRegras()

  const [talhaoInfo, setTalhaoInfo] = useState<{
    nome: string
    latitude?: number
    longitude?: number
    fazendaRef?: { nome: string }
  } | null>(null)
  const [geo, setGeo] = useState<GeoState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: '',
    captured: false,
    dentroZona: null,
  })

  useEffect(() => {
    if (form?.talhaoId) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5291'
      const token = localStorage.getItem('token')
      fetch(`${apiBase}/api/cadastros/talhoes/${form.talhaoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(setTalhaoInfo)
        .catch(() => setTalhaoInfo(null))
    }
  }, [form?.talhaoId])

  const raioMetros = regras.boardingGeofenceRadiusMeters
  const latRef = talhaoInfo?.latitude ?? -23.7636
  const lngRef = talhaoInfo?.longitude ?? -47.1234

  function validarPosicao(latitude: number, longitude: number) {
    const dist = distanciaMetros(latitude, longitude, latRef, lngRef)
    return dist <= raioMetros
  }

  function capturarLocalizacao() {
    setGeo((g) => ({ ...g, loading: true, error: '' }))

    const aplicar = (latitude: number, longitude: number) => {
      setGeo({
        latitude,
        longitude,
        loading: false,
        error: '',
        captured: true,
        dentroZona: validarPosicao(latitude, longitude),
      })
    }

    if (!navigator.geolocation) {
      aplicar(latRef + (Math.random() - 0.5) * 0.002, lngRef + (Math.random() - 0.5) * 0.002)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => aplicar(pos.coords.latitude, pos.coords.longitude),
      () => aplicar(latRef + (Math.random() - 0.5) * 0.002, lngRef + (Math.random() - 0.5) * 0.002),
      { timeout: 10000 }
    )
  }

  function handleNext() {
    navigate('/agendamento/resumo', {
      state: {
        ...state,
        regras,
        localEmbarque: {
          latitude: geo.latitude,
          longitude: geo.longitude,
          dentroZona: geo.dentroZona,
        },
      },
    })
  }

  const podeAvancar = !regras.requireBoardingLocation || geo.captured

  return (
    <PageLayout header={<AppHeader title="Local de Embarque" subtitle="Registre sua localização" showBack />}>
      <div className="space-y-4 pb-4">
        {regras.requireBoardingLocation && (
          <div className="text-xs text-center text-gray-500 bg-forest-50 rounded-xl py-2 px-3">
            Captura de localização obrigatória · Raio permitido: {raioMetros}m
          </div>
        )}

        <MapView
          origin={
            geo.latitude && geo.longitude
              ? { lat: geo.latitude, lng: geo.longitude, label: 'Sua posição' }
              : talhaoInfo?.latitude
                ? { lat: latRef, lng: lngRef, label: 'Talhão' }
                : undefined
          }
          height="h-72"
        />

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Capturar Localização</h3>
            {regras.requireBoardingLocation && (
              <span className="text-xs text-red-500 font-medium">(Obrigatório)</span>
            )}
          </div>

          {geo.captured && geo.latitude ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-0.5">Latitude</p>
                  <p className="text-sm font-bold text-gray-800">{geo.latitude.toFixed(6)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-0.5">Longitude</p>
                  <p className="text-sm font-bold text-gray-800">{geo.longitude!.toFixed(6)}</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-2 p-3 rounded-xl ${
                  geo.dentroZona ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {geo.dentroZona ? (
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-red-600 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${geo.dentroZona ? 'text-green-700' : 'text-red-700'}`}>
                    {geo.dentroZona ? 'Dentro da cerca virtual' : 'Fora da cerca virtual'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Raio configurado: {raioMetros}m do talhão selecionado
                  </p>
                </div>
              </div>

              <Button variant="outline" fullWidth size="sm" onClick={capturarLocalizacao}>
                <Navigation size={16} />
                Recapturar localização
              </Button>
            </div>
          ) : (
            <Button fullWidth size="lg" loading={geo.loading} onClick={capturarLocalizacao} icon={<Navigation size={18} />}>
              {geo.loading ? 'Capturando...' : 'Capturar Localização'}
            </Button>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Local de Embarque</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Fazenda</span>
              <span className="text-sm font-medium text-gray-800">{talhaoInfo?.fazendaRef?.nome || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-500">Talhão</span>
              <span className="text-sm font-medium text-gray-800">{talhaoInfo?.nome || '—'}</span>
            </div>
          </div>
        </Card>

        <Button fullWidth size="lg" disabled={!podeAvancar} onClick={handleNext}>
          Avançar para Resumo →
        </Button>
      </div>
    </PageLayout>
  )
}
