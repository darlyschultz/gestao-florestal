import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Button } from '../../components/ui/Button'
import { agendamentosService } from '../../services/api'
import { useAgendamentoRegras, diaPermiteAgendamento } from '../../hooks/useAgendamentoRegras'
import type { DisponibilidadeDia } from '../../hooks/useAgendamentoRegras'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

interface HorariosGridProps {
  disponibilidade: DisponibilidadeDia | null
  loading: boolean
  selectedSlot: string | null
  onSelectSlot: (slot: string) => void
  cols?: number
}

function HorariosGrid({ disponibilidade, loading, selectedSlot, onSelectSlot, cols = 5 }: HorariosGridProps) {
  const slots = disponibilidade?.slots || []
  const semJanela = disponibilidade && !disponibilidade.temJanela

  const rows: typeof slots[] = []
  for (let i = 0; i < slots.length; i += cols) {
    rows.push(slots.slice(i, i + cols))
  }

  if (loading) {
    return <p className="text-center text-sm text-gray-400 py-6">Carregando horários...</p>
  }

  if (semJanela) {
    return (
      <p className="text-center text-sm text-gray-500 py-6">
        Não há janela de agendamento para este dia.
      </p>
    )
  }

  if (rows.length === 0) {
    return <p className="text-center text-sm text-gray-500 py-6">Nenhum horário disponível</p>
  }

  return (
    <div className="space-y-3">
      {disponibilidade?.horarioInicial && (
        <p className="text-xs text-gray-500">
          Janela {disponibilidade.horarioInicial}–{disponibilidade.horarioFinal}
          {' · '}{disponibilidade.intervaloMinutos} min
          {' · '}até {disponibilidade.capacidadePorHorario} caminhões/slot
        </p>
      )}
      <div className="space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {row.map((slot) => {
              const isOcupado = !slot.disponivel
              const isSelected = selectedSlot === slot.horario
              const quaseLotado = slot.disponivel && slot.ocupados > 0

              return (
                <button
                  key={slot.horario}
                  type="button"
                  disabled={isOcupado}
                  onClick={() => onSelectSlot(slot.horario)}
                  title={
                    isOcupado
                      ? `Lotado (${slot.ocupados}/${slot.capacidade})`
                      : quaseLotado
                        ? `${slot.ocupados}/${slot.capacidade} agendados`
                        : undefined
                  }
                  className={`
                    py-2 rounded-lg text-xs font-semibold transition-all
                    ${isOcupado
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed line-through opacity-70'
                      : isSelected
                        ? 'bg-forest-700 text-white shadow-md'
                        : quaseLotado
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-forest-50 hover:text-forest-700 border border-gray-100'
                    }
                  `}
                >
                  {slot.horario}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-50 border" /> Disponível</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-100 border border-yellow-300" /> Parcial</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-200" /> Lotado</span>
      </div>
    </div>
  )
}

export function Calendario() {
  const navigate = useNavigate()
  const { regras, loading: loadingRegras } = useAgendamentoRegras()
  const { isDesktop } = useResponsiveLayout()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia | null>(null)
  const [loadingHorarios, setLoadingHorarios] = useState(false)

  useEffect(() => {
    if (!selectedDate || !isDesktop) {
      setDisponibilidade(null)
      return
    }

    setLoadingHorarios(true)
    setSelectedSlot(null)
    const dataStr = format(selectedDate, 'yyyy-MM-dd')

    agendamentosService
      .disponibilidade(dataStr)
      .then((r) => setDisponibilidade(r.data))
      .catch(() => setDisponibilidade(null))
      .finally(() => setLoadingHorarios(false))
  }, [selectedDate, isDesktop])

  function buildCalendar(month: Date) {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows: Date[][] = []
    let day = startDate

    while (day <= endDate) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      rows.push(week)
    }

    return rows
  }

  const rows = buildCalendar(currentMonth)

  function handleSelectDate(date: Date) {
    if (!isSameMonth(date, currentMonth)) return
    if (!diaPermiteAgendamento(date, regras.diasComJanela)) return
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  function handleSelectSlot(slot: string) {
    const info = disponibilidade?.slots.find((s) => s.horario === slot)
    if (!info?.disponivel) return
    setSelectedSlot(slot)
  }

  function handleContinuar() {
    if (!selectedDate || !selectedSlot) return
    const [h, m] = selectedSlot.split(':').map(Number)
    const dt = new Date(selectedDate)
    dt.setHours(h, m, 0, 0)
    navigate('/agendamento/novo', { state: { dataHora: dt.toISOString() } })
  }

  function isDisabledDay(day: Date, inMonth: boolean): boolean {
    if (!inMonth) return true
    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0)) && !isToday(day)
    if (isPast) return true
    return !diaPermiteAgendamento(day, regras.diasComJanela)
  }

  const diasLabel = regras.diasComJanela.map((d) => WEEKDAYS[d]).join(', ')

  const dayButtonClass = (opts: {
    inMonth: boolean
    disabled: boolean
    isSelected: boolean
    today: boolean
    semJanela: boolean
  }) => {
    const { inMonth, disabled, isSelected, today, semJanela } = opts
    return `
      flex items-center justify-center rounded-lg m-0.5 text-sm font-medium transition-all
      aspect-square max-h-11
      lg:aspect-auto lg:h-10 lg:max-h-none xl:h-11
      ${!inMonth ? 'text-gray-200' : ''}
      ${disabled && inMonth ? 'text-gray-300 cursor-not-allowed bg-gray-50' : ''}
      ${inMonth && !disabled && !isSelected && !today ? 'text-gray-700 hover:bg-forest-50 hover:text-forest-700' : ''}
      ${isSelected ? 'bg-forest-700 text-white shadow-md' : ''}
      ${today && !isSelected ? 'bg-forest-100 text-forest-700 font-bold' : ''}
      ${semJanela ? 'opacity-50' : ''}
    `
  }

  const calendarPanel = (
    <>
      <div className="flex items-center justify-between py-2 lg:py-0 lg:mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base lg:text-lg font-bold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center py-2 lg:py-2.5 text-xs font-semibold text-gray-500">
              {d}
            </div>
          ))}
        </div>

        <div className="p-1.5 lg:p-2">
          {rows.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                const inMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const today = isToday(day)
                const disabled = isDisabledDay(day, inMonth)
                const semJanela = inMonth && !disabled && !diaPermiteAgendamento(day, regras.diasComJanela)

                return (
                  <button
                    key={di}
                    onClick={() => handleSelectDate(day)}
                    disabled={disabled || semJanela}
                    className={dayButtonClass({ inMonth, disabled, isSelected: !!isSelected, today, semJanela: !!semJanela })}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const mobileSidePanel = (
    <div className="space-y-5">
      {selectedDate ? (
        <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Data selecionada</p>
            <p className="text-lg font-bold text-gray-900 capitalize">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() =>
              navigate('/agendamento/horarios', {
                state: { data: selectedDate.toISOString() },
              })
            }
          >
            Ver horários disponíveis →
          </Button>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6 text-center">
          <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Selecione um dia no calendário.</p>
        </div>
      )}
    </div>
  )

  const desktopSidePanel = (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden sticky top-24">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Clock size={18} className="text-forest-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Horários disponíveis</h3>
          {selectedDate && (
            <p className="text-xs text-gray-500 capitalize">
              {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>

      <div className="p-5">
        {!selectedDate ? (
          <div className="text-center py-10">
            <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Clique em uma data no calendário para ver os horários.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <HorariosGrid
              disponibilidade={disponibilidade}
              loading={loadingHorarios}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
              cols={6}
            />

            {selectedSlot && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Selecionado</span>
                  <span className="font-bold text-forest-800">
                    {format(selectedDate, 'dd/MM/yyyy')} às {selectedSlot}
                  </span>
                </div>
                <Button fullWidth size="lg" onClick={handleContinuar}>
                  Continuar agendamento →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <PageLayout
      title="Agendamento de Transporte"
      subtitle="Selecione a data e o horário"
      header={
        !isDesktop ? (
          <AppHeader
            title="Agendamento de Transporte"
            subtitle="Selecione o dia desejado"
            showBack
            backPath="/menu"
            rightContent={<Calendar size={20} className="text-gray-500" />}
          />
        ) : undefined
      }
    >
      <div className="space-y-4 lg:space-y-0">
        {!loadingRegras && regras.diasComJanela.length > 0 && (
          <div className="text-xs text-center lg:text-left text-gray-500 bg-forest-50 rounded-xl py-2 px-3 mb-4">
            Dias com janela de agendamento:{' '}
            <span className="font-medium text-forest-800">{diasLabel}</span>
          </div>
        )}

        <div className="lg:hidden space-y-4">
          {calendarPanel}
          {mobileSidePanel}
        </div>

        <div className="hidden lg:grid lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] lg:gap-8 xl:gap-10 lg:items-start">
          <div className="w-full">{calendarPanel}</div>
          <div>{desktopSidePanel}</div>
        </div>
      </div>
    </PageLayout>
  )
}
