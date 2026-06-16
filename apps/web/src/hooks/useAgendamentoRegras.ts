import { useEffect, useState } from 'react'
import { agendamentosService } from '../services/api'
import { CACHE_TTL, getSessionCache, setSessionCache } from '../utils/apiCache'

export interface RegrasAgendamento {
  requireNf: boolean
  requireMdfe: boolean
  requireLoadingOrder: boolean
  requireBoardingLocation: boolean
  requireGpsTracking: boolean
  boardingGeofenceRadiusMeters: number
  scheduleIntervalMinutes: number
  maxTrucksPerSlot: number
  gateOpenTime: string
  gateCloseTime: string
  diasComJanela: number[]
}

export interface SlotDisponibilidade {
  horario: string
  ocupados: number
  capacidade: number
  disponivel: boolean
}

export interface DisponibilidadeDia {
  data: string
  diaSemana: number
  temJanela: boolean
  intervaloMinutos: number
  capacidadePorHorario: number
  horarioInicial: string | null
  horarioFinal: string | null
  slots: SlotDisponibilidade[]
}

const DEFAULT_REGRAS: RegrasAgendamento = {
  requireNf: true,
  requireMdfe: true,
  requireLoadingOrder: true,
  requireBoardingLocation: true,
  requireGpsTracking: true,
  boardingGeofenceRadiusMeters: 300,
  scheduleIntervalMinutes: 15,
  maxTrucksPerSlot: 3,
  gateOpenTime: '06:00',
  gateCloseTime: '22:00',
  diasComJanela: [1, 2, 3, 4, 5, 6],
}

export function useAgendamentoRegras() {
  const [regras, setRegras] = useState<RegrasAgendamento>(DEFAULT_REGRAS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getSessionCache<RegrasAgendamento>('regras-agendamento')
    if (cached) {
      setRegras(cached)
      setLoading(false)
      return
    }

    agendamentosService
      .regras()
      .then(({ data }) => {
        setRegras(data)
        setSessionCache('regras-agendamento', data, CACHE_TTL.regras)
      })
      .catch(() => setRegras(DEFAULT_REGRAS))
      .finally(() => setLoading(false))
  }, [])

  return { regras, loading }
}

export function diaPermiteAgendamento(date: Date, diasComJanela: number[]): boolean {
  if (diasComJanela.length === 0) return true
  return diasComJanela.includes(date.getDay())
}
