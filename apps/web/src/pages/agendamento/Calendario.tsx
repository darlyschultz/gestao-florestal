import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageLayout } from '../../components/layout/PageLayout'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { agendamentosService, cadastrosService } from '../../services/api'
import { useAgendamentoRegras, diaPermiteAgendamento } from '../../hooks/useAgendamentoRegras'
import type { DisponibilidadeDia } from '../../hooks/useAgendamentoRegras'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'
import { useAuth } from '../../contexts/AuthContext'
import { HorarioSlotButton, HorariosLegenda } from '../../components/agendamento/HorarioSlotButton'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

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

interface HorariosGridProps {
  disponibilidade: DisponibilidadeDia | null
  loading: boolean
  selectedSlots: Set<string>
  onToggleSlot: (slot: string) => void
  cols?: number
  multi?: boolean
}

function HorariosGrid({ disponibilidade, loading, selectedSlots, onToggleSlot, cols = 5, multi = true }: HorariosGridProps) {
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
          {' · '}1 reserva por horário
        </p>
      )}
      <div className="space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {row.map((slot) => (
              <HorarioSlotButton
                key={slot.horario}
                slot={slot}
                selected={selectedSlots.has(slot.horario)}
                onToggle={onToggleSlot}
                className="py-2 rounded-lg"
              />
            ))}
          </div>
        ))}
      </div>
      <HorariosLegenda multi={multi} />
    </div>
  )
}

export function Calendario() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { regras, loading: loadingRegras } = useAgendamentoRegras()
  const { isDesktop } = useResponsiveLayout()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia | null>(null)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [reservando, setReservando] = useState(false)
  const [resumoMes, setResumoMes] = useState<Record<string, { total: number; incompletos: number }>>({})
  const [transportadoras, setTransportadoras] = useState<{ value: string; label: string }[]>([])
  const [transportadoraId, setTransportadoraId] = useState('')

  const precisaTransportadora = Boolean(
    user && !user.transportadoraId && ['admin', 'gestor', 'operacao'].includes(user.perfil),
  )

  useEffect(() => {
    if (!precisaTransportadora) return
    cadastrosService
      .transportadoras(true)
      .then((r) => setTransportadoras(r.data.map((t: { id: string; nome: string }) => ({ value: t.id, label: t.nome }))))
      .catch(() => setTransportadoras([]))
  }, [precisaTransportadora])

  useEffect(() => {
    const mes = format(currentMonth, 'yyyy-MM')
    agendamentosService.calendarioResumo(mes).then((r) => setResumoMes(r.data.dias || {})).catch(() => {})
  }, [currentMonth])

  useEffect(() => {
    if (!selectedDate || !isDesktop) {
      setDisponibilidade(null)
      return
    }

    setLoadingHorarios(true)
    setSelectedSlots(new Set())
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
    setSelectedSlots(new Set())
  }

  function handleToggleSlot(slot: string) {
    const info = disponibilidade?.slots.find((s) => s.horario === slot)
    if (!info?.disponivel) return
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  async function handleReservarHorarios() {
    if (!selectedDate || selectedSlots.size === 0) return
    if (precisaTransportadora && !transportadoraId) {
      alert('Selecione a transportadora antes de reservar.')
      return
    }
    setReservando(true)
    try {
      await agendamentosService.preAgendar({
        data: format(selectedDate, 'yyyy-MM-dd'),
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

  function handleContinuarUmHorario() {
    if (!selectedDate || selectedSlots.size !== 1) return
    const slot = [...selectedSlots][0]
    const [h, m] = slot.split(':').map(Number)
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
                const diaKey = format(day, 'yyyy-MM-dd')
                const resumoDia = resumoMes[diaKey]

                return (
                  <button
                    key={di}
                    onClick={() => handleSelectDate(day)}
                    disabled={disabled || semJanela}
                    className={`relative ${dayButtonClass({ inMonth, disabled, isSelected: !!isSelected, today, semJanela: !!semJanela })}`}
                  >
                    {format(day, 'd')}
                    {resumoDia && resumoDia.incompletos > 0 && inMonth && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                    {resumoDia && resumoDia.incompletos === 0 && resumoDia.total > 0 && inMonth && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
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
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
              cols={6}
            />

            {selectedSlots.size > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                {precisaTransportadora && (
                  <Select
                    label="Transportadora"
                    options={transportadoras}
                    value={transportadoraId}
                    onChange={(e) => setTransportadoraId(e.target.value)}
                    placeholder="Selecione a transportadora"
                  />
                )}
                <div className="text-sm">
                  <span className="text-gray-500">{selectedSlots.size} horário(s) selecionado(s)</span>
                  <p className="text-xs text-gray-400 mt-1">
                    {[...selectedSlots].sort().join(', ')}
                  </p>
                </div>
                <Button fullWidth size="lg" loading={reservando} onClick={handleReservarHorarios}>
                  Reservar {selectedSlots.size} horário{selectedSlots.size > 1 ? 's' : ''}
                </Button>
                {selectedSlots.size === 1 && (
                  <Button fullWidth variant="outline" onClick={handleContinuarUmHorario}>
                    Preencher tudo agora (fluxo completo)
                  </Button>
                )}
                <Button fullWidth variant="ghost" size="sm" onClick={() => navigate('/agendamento/meus')}>
                  Ver meus agendamentos
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
      subtitle="Selecione data(s) e horário(s) — pré-reserva rápida"
      showBack
      backPath="/menu"
      rightContent={
        <Button size="sm" variant="outline" onClick={() => navigate('/agendamento/meus')}>
          Meus
        </Button>
      }
    >
      <div className="space-y-4 lg:space-y-0">
        {!loadingRegras && regras.diasComJanela.length > 0 && (
          <div className="text-xs text-center lg:text-left text-gray-500 bg-forest-50 rounded-xl py-2 px-3 mb-4 space-y-1">
            <p>
              Dias com janela:{' '}
              <span className="font-medium text-forest-800">{diasLabel}</span>
            </p>
            <p>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" /> pendências
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-3 mr-1" /> completos
            </p>
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
