import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { agendamentosService } from '../../services/api'
import type { DisponibilidadeDia } from '../../hooks/useAgendamentoRegras'

const COLS = 5

export function Horarios() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia | null>(null)
  const [loading, setLoading] = useState(true)

  const dataState = location.state?.data ? parseISO(location.state.data) : new Date()
  const [currentDay, setCurrentDay] = useState(dataState)

  useEffect(() => {
    setLoading(true)
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

  function handleSelect(slot: string) {
    const info = slots.find((s) => s.horario === slot)
    if (!info?.disponivel) return

    setSelectedSlot(slot)
    const [h, m] = slot.split(':').map(Number)
    const dt = new Date(currentDay)
    dt.setHours(h, m, 0, 0)
    navigate('/agendamento/novo', { state: { dataHora: dt.toISOString() } })
  }

  function changeDay(delta: number) {
    setSelectedSlot(null)
    setCurrentDay((d) => (delta > 0 ? addDays(d, 1) : subDays(d, 1)))
  }

  const semJanela = disponibilidade && !disponibilidade.temJanela

  return (
    <PageLayout
      header={
        <AppHeader
          title="Agendamento"
          subtitle="Selecione o horário disponível"
          showBack
          rightContent={<Clock size={20} className="text-gray-500" />}
        />
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-card">
          <button type="button" onClick={() => changeDay(-1)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500">Dia</p>
            <p className="text-sm font-bold text-gray-900">
              {format(currentDay, "dd/MM/yyyy - EEEE", { locale: ptBR })}
            </p>
          </div>
          <button type="button" onClick={() => changeDay(1)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronRight size={18} />
          </button>
        </div>

        {disponibilidade?.temJanela && disponibilidade.horarioInicial && (
          <div className="text-center text-xs text-gray-500 bg-forest-50 rounded-xl py-2 px-3">
            Janela: {disponibilidade.horarioInicial} às {disponibilidade.horarioFinal}
            {' · '}Intervalo: {disponibilidade.intervaloMinutos} min
            {' · '}Capacidade: {disponibilidade.capacidadePorHorario} caminhões/slot
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Grade de Horários</h3>
            {loading && <span className="text-xs text-gray-400">Carregando...</span>}
          </div>

          <div className="p-3">
            {semJanela ? (
              <p className="text-center text-sm text-gray-500 py-8">
                Não há janela de agendamento configurada para este dia da semana.
              </p>
            ) : rows.length === 0 && !loading ? (
              <p className="text-center text-sm text-gray-500 py-8">Nenhum horário disponível</p>
            ) : (
              rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-5 gap-1.5 mb-1.5">
                  {row.map((slot) => {
                    const isOcupado = !slot.disponivel
                    const isSelected = selectedSlot === slot.horario
                    const quaseLotado = slot.disponivel && slot.ocupados > 0

                    return (
                      <button
                        key={slot.horario}
                        type="button"
                        disabled={isOcupado}
                        onClick={() => handleSelect(slot.horario)}
                        title={
                          isOcupado
                            ? `Lotado (${slot.ocupados}/${slot.capacidade})`
                            : quaseLotado
                              ? `${slot.ocupados}/${slot.capacidade} agendados`
                              : undefined
                        }
                        className={`
                          py-2.5 rounded-xl text-xs font-semibold transition-all
                          ${isOcupado
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through opacity-70'
                            : isSelected
                              ? 'bg-forest-700 text-white shadow-md active:scale-95'
                              : quaseLotado
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 active:scale-95'
                                : 'bg-gray-50 text-gray-600 hover:bg-forest-50 hover:text-forest-700 border border-gray-100 active:scale-95'
                          }
                        `}
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

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
            Disponível
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
            Parcialmente ocupado
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-200 line-through" />
            Lotado
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
