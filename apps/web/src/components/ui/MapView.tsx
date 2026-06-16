import React from 'react'
import { MapPin, Navigation, Factory, Truck } from 'lucide-react'

interface MapViewProps {
  origin?: { lat: number; lng: number; label?: string }
  destination?: { lat: number; lng: number; label?: string }
  current?: { lat: number; lng: number }
  height?: string
  showFakeMap?: boolean
}

export function MapView({ origin, destination, current, height = 'h-64', showFakeMap = true }: MapViewProps) {
  const hasKey = !!import.meta.env.VITE_MAPBOX_TOKEN || !!import.meta.env.VITE_GOOGLE_MAPS_KEY

  if (!hasKey || showFakeMap) {
    return (
      <div className={`relative ${height} rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 border border-green-200`}>
        {/* Grid simulando mapa */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16a34a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Estradas simuladas */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 60% Q 30% 55% 50% 50% T 100% 45%" fill="none" stroke="#d4a200" strokeWidth="3" strokeDasharray="8 4" opacity="0.7" />
          <path d="M 20% 0 L 20% 100%" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.5" />
          <path d="M 70% 0 L 70% 100%" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.5" />
          <path d="M 0 30% L 100% 30%" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.5" />
          <path d="M 0 70% L 100% 70%" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.5" />
        </svg>

        {/* Rota simulada */}
        {origin && destination && (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 15% 75% C 35% 70% 50% 55% 85% 30%"
              fill="none"
              stroke="#1a5940"
              strokeWidth="3"
              strokeDasharray="10 5"
              opacity="0.8"
            />
          </svg>
        )}

        {/* Pins */}
        {origin && (
          <div className="absolute" style={{ left: '15%', top: '70%', transform: 'translate(-50%, -100%)' }}>
            <div className="flex flex-col items-center">
              <div className="bg-green-600 text-white rounded-full p-1.5 shadow-lg">
                <MapPin size={16} />
              </div>
              {origin.label && (
                <div className="mt-1 bg-white text-xs font-medium text-gray-700 px-2 py-0.5 rounded shadow whitespace-nowrap">
                  {origin.label}
                </div>
              )}
            </div>
          </div>
        )}

        {destination && (
          <div className="absolute" style={{ left: '85%', top: '25%', transform: 'translate(-50%, -100%)' }}>
            <div className="flex flex-col items-center">
              <div className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                <Factory size={16} />
              </div>
              {destination.label && (
                <div className="mt-1 bg-white text-xs font-medium text-gray-700 px-2 py-0.5 rounded shadow whitespace-nowrap">
                  {destination.label}
                </div>
              )}
            </div>
          </div>
        )}

        {current && (
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -100%)' }}>
            <div className="flex flex-col items-center">
              <div className="bg-yellow-500 text-white rounded-full p-1.5 shadow-lg animate-bounce">
                <Truck size={16} />
              </div>
            </div>
          </div>
        )}

        {/* Badge mapa simulado */}
        <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-gray-600 font-medium flex items-center gap-1">
          <Navigation size={12} className="text-forest-600" />
          Mapa simulado — configure a chave no .env
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${height} rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center`}>
      <p className="text-gray-500 text-sm">Carregando mapa...</p>
    </div>
  )
}
