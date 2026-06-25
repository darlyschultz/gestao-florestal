import React from 'react'

export interface SlotDisponibilidade {
  horario: string
  ocupados: number
  capacidade: number
  disponivel: boolean
}

interface HorarioSlotButtonProps {
  slot: SlotDisponibilidade
  selected?: boolean
  onToggle?: (horario: string) => void
  className?: string
}

export function HorarioSlotButton({ slot, selected = false, onToggle, className = '' }: HorarioSlotButtonProps) {
  const reservado = !slot.disponivel

  function handleClick() {
    if (reservado) return
    onToggle?.(slot.horario)
  }

  return (
    <button
      type="button"
      disabled={reservado}
      aria-disabled={reservado}
      onClick={handleClick}
      title={reservado ? `Horário ${slot.horario} já reservado` : 'Disponível para reserva'}
      className={`
        py-2.5 rounded-xl text-xs font-semibold transition-all
        ${className}
        ${
          reservado
            ? 'bg-gray-600 text-gray-200 border border-gray-700 cursor-not-allowed opacity-90'
            : selected
              ? 'bg-forest-700 text-white shadow-md ring-2 ring-forest-500 ring-offset-1'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200 cursor-pointer'
        }
      `}
    >
      {slot.horario}
    </button>
  )
}

export function HorariosLegenda({ multi = true }: { multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-white border border-gray-200" />
        Disponível
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-gray-600 border border-gray-700" />
        Reservado
      </span>
      {multi && (
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-forest-700" />
          Selecionado
        </span>
      )}
    </div>
  )
}
