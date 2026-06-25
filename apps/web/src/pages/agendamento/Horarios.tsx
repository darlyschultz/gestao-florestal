import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { agendamentosService, cadastrosService } from '../../services/api'
import type { DisponibilidadeDia } from '../../hooks/useAgendamentoRegras'
import { useAuth } from '../../contexts/AuthContext'

const COLS = 5

function sortHorarios(horarios: string[]): string[] {
  return [...horarios].sort((a, b) => {
    const [ah, am] = a.split(':').map(Number)
    const [bh, bm] = b.split(':').map(Number)
    return ah * 60 + (am || 0) - (bh * 60 + (bm || 0))
  })
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
  return msg || fallback
}

export function Horarios() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservando, setReservando] = useState(false)
  const [transportadoras, setTransportadoras] = useState<{ value: string; label: string }[]>([])
  const [transportadoraId, setTransportadoraId] = useState('')

  const precisaTransportadora = Boolean(
    user && !user.transportadoraId && ['admin', 'gestor', 'operacao'].includes(user.perfil),
  )

  const dataState = location.state?.data ? parseISO(location.state.data) : new Date()
  const [currentDay, setCurrentDay] = useState(dataState)

  useEffect(() => {
    if (!precisaTransportadora) return
    cadastrosService
      .transportadoras(true)
      .then((r) => setTransportadoras(r.data.map((t: { id: string; nome: string }) => ({ value: t.id, label: t.nome }))))
      .catch(() => setTransportadoras([]))
  }, [precisaTransportadora])

  useEffect(() => {
    setLoading(true)
    setSelectedSlots(new Set())
    const dataStr = format(currentDay, 'yyyy-MM-dd')

    agendamentosService
      .disponibilidade(dataStr)
      .then((r) => setDisponibilidade(r.data))
      .catch(() => setDisponibilidade(null))
      .finally(() => setLoading(false))
  }, [currentDay])

  const slots = disponibilidade?.slots || []
  const rows: typeof slots[] = []
  for (let i = 0; i < slots.length; i += COLS) {
    rows.push(slots.slice(i, i + COLS))
  }

  function toggleSlot(slot: string) {
    const info = slots.find((s) => s.horario === slot)
    if (!info?.disponivel) return
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  async function handleReservar() {
    if (selectedSlots.size === 0) return
    if (precisaTransportadora && !transportadoraId) {
      alert('Selecione a transportadora antes de reservar.')
      return
    }
    setReservando(true)
    try {
      await agendamentosService.preAgendar({
        data: format(currentDay, 'yyyy-MM-dd'),
        horarios: sortHorarios([...selectedSlots]),
        transportadoraId: transportadoraId || undefined,
      })
      navigate('/agendamento/meus')
    } catch (err) {
      alert(apiErrorMessage(err, 'Erro ao reservar horários. Verifique disponibilidade.'))
    } finally {
      setReservando(false)
    }
  }

  function changeDay(delta: number) {
    setSelectedSlots(new Set())
    setCurrentDay((d) => (delta > 0 ? addDays(d, 1) : subDays(d, 1)))
  }

  const semJanela = disponibilidade && !disponibilidade.temJanela

  return (
    <PageLayout
      title="Horários"
      subtitle="Selecione um ou vários slots"
      showBack
      backPath="/agendamento/calendario"
    >
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-card">
          <button type="button" onClick={() => changeDay(-1)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500">Dia</p>
            <p className="text-sm font-bold text-gray-900 capitalize">
              {format(currentDay, "dd/MM/yyyy - EEEE", { locale: ptBR })}
            </p>
          </div>
          <button type="button" onClick={() => changeDay(1)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={16} /> Toque para selecionar
            </h3>
            {loading && <span className="text-xs text-gray-400">...</span>}
          </div>

          <div className="p-3">
            {semJanela ? (
              <p className="text-center text-sm text-gray-500 py-8">Sem janela neste dia</p>
            ) : rows.length === 0 && !loading ? (
              <p className="text-center text-sm text-gray-500 py-8">Nenhum horário</p>
            ) : (
              rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-5 gap-1.5 mb-1.5">
                  {row.map((slot) => {
                    const isOcupado = !slot.disponivel
                    const isSelected = selectedSlots.has(slot.horario)
                    return (
                      <button
                        key={slot.horario}
                        type="button"
                        disabled={isOcupado}
                        onClick={() => toggleSlot(slot.horario)}
                        className={`py-2.5 rounded-xl text-xs font-semibold ${
                          isOcupado
                            ? 'bg-gray-200 text-gray-400 line-through'
                            : isSelected
                              ? 'bg-forest-700 text-white'
                              : 'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}
                      >
                        {slot.horario}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {selectedSlots.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 space-y-2">
            {precisaTransportadora && (
              <Select
                label="Transportadora"
                options={transportadoras}
                value={transportadoraId}
                onChange={(e) => setTransportadoraId(e.target.value)}
                placeholder="Selecione a transportadora"
              />
            )}
            <p className="text-xs text-center text-gray-500">{selectedSlots.size} horário(s) selecionado(s)</p>
            <Button fullWidth size="lg" loading={reservando} onClick={handleReservar}>
              Reservar horários
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
