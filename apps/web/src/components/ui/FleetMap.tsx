import React, { useMemo } from 'react'
import { Factory, MapPin, Truck } from 'lucide-react'

export interface FleetVehicle {
  id: string
  numero: string
  placa: string
  motorista?: string
  status: string
  lat: number
  lng: number
  origem?: { lat: number; lng: number; label?: string }
  destinoLabel?: string
  distanciaRestanteKm?: number
  selected?: boolean
  onSelect?: () => void
}

interface FleetMapProps {
  veiculos: FleetVehicle[]
  fabrica?: { lat: number; lng: number; label?: string }
  selectedId?: string | null
  onSelect?: (id: string) => void
  height?: string
  className?: string
}

function projectBounds(
  points: Array<{ lat: number; lng: number }>,
  padRatio = 0.12,
) {
  if (points.length === 0) {
    return {
      toXY: (_lat: number, _lng: number) => ({ x: 50, y: 50 }),
    }
  }

  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)

  const latPad = Math.max((maxLat - minLat) * padRatio, 0.05)
  const lngPad = Math.max((maxLng - minLng) * padRatio, 0.05)
  minLat -= latPad
  maxLat += latPad
  minLng -= lngPad
  maxLng += lngPad

  const latSpan = maxLat - minLat || 0.1
  const lngSpan = maxLng - minLng || 0.1

  return {
    toXY: (lat: number, lng: number) => ({
      x: ((lng - minLng) / lngSpan) * 100,
      y: 100 - ((lat - minLat) / latSpan) * 100,
    }),
  }
}

export function FleetMap({
  veiculos,
  fabrica,
  selectedId,
  onSelect,
  height = 'h-[420px]',
  className = '',
}: FleetMapProps) {
  const { toXY, routes } = useMemo(() => {
    const points: Array<{ lat: number; lng: number }> = []
    if (fabrica) points.push(fabrica)
    for (const v of veiculos) {
      points.push({ lat: v.lat, lng: v.lng })
      if (v.origem) points.push(v.origem)
    }

    const proj = projectBounds(points)

    const routeLines = veiculos
      .filter((v) => v.origem)
      .map((v) => {
        const a = proj.toXY(v.origem!.lat, v.origem!.lng)
        const b = proj.toXY(v.lat, v.lng)
        return { id: v.id, d: `M ${a.x} ${a.y} L ${b.x} ${b.y}` }
      })

    return { toXY: proj.toXY, routes: routeLines }
  }, [veiculos, fabrica])

  return (
    <div className={`relative ${height} rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 border border-green-200/80 ${className}`}>
      <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fleet-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#16a34a" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fleet-grid)" />
      </svg>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {routes.map((r) => (
          <path
            key={r.id}
            d={r.d}
            fill="none"
            stroke="#1a5940"
            strokeWidth="0.35"
            strokeDasharray="2 1.5"
            opacity={selectedId && selectedId !== r.id ? 0.25 : 0.65}
          />
        ))}
      </svg>

      {fabrica && (() => {
        const p = toXY(fabrica.lat, fabrica.lng)
        return (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg ring-2 ring-white">
                <Factory size={16} />
              </div>
              {fabrica.label && (
                <span className="mt-1 text-[10px] font-semibold bg-white/95 px-2 py-0.5 rounded-md shadow text-gray-700 whitespace-nowrap max-w-[120px] truncate">
                  {fabrica.label}
                </span>
              )}
            </div>
          </div>
        )
      })()}

      {veiculos.map((v) => {
        const p = toXY(v.lat, v.lng)
        const isSelected = selectedId === v.id
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect?.(v.id)}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform ${isSelected ? 'scale-110 z-30' : 'hover:scale-105'}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            title={`${v.placa} · ${v.motorista || v.numero}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full p-2 shadow-lg ring-2 ring-white ${
                  isSelected ? 'bg-forest-700 animate-pulse' : 'bg-amber-500'
                }`}
              >
                <Truck size={16} className="text-white" />
              </div>
              <span
                className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap ${
                  isSelected ? 'bg-forest-800 text-white' : 'bg-white/95 text-gray-800'
                }`}
              >
                {v.placa}
              </span>
            </div>
          </button>
        )
      })}

      {veiculos
        .filter((v) => v.origem && (!selectedId || selectedId === v.id))
        .map((v) => {
          const p = toXY(v.origem!.lat, v.origem!.lng)
          return (
            <div
              key={`orig-${v.id}`}
              className="absolute z-10 -translate-x-1/2 -translate-y-full opacity-70"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className="bg-green-600 text-white rounded-full p-1 shadow">
                <MapPin size={12} />
              </div>
            </div>
          )
        })}

      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2">
        <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] text-gray-600 font-medium flex items-center gap-1">
          <Truck size={11} className="text-amber-500" />
          {veiculos.length} em trânsito
        </span>
        <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] text-gray-500">
          Mapa operacional · GPS
        </span>
      </div>
    </div>
  )
}
