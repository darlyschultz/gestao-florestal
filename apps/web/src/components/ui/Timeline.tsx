import React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Circle } from 'lucide-react'

interface TimelineItem {
  id: string
  title: string
  description?: string
  date?: string
  status: 'completed' | 'active' | 'pending'
  user?: string
  icon?: React.ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative">
      {items.map((item, index) => (
        <li key={item.id} className={`relative flex gap-4 ${index < items.length - 1 ? 'pb-6' : ''}`}>
          {/* Linha vertical */}
          {index < items.length - 1 && (
            <div
              className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${
                item.status === 'completed' ? 'bg-forest-300' : 'bg-gray-200'
              }`}
            />
          )}

          {/* Ícone */}
          <div className="relative z-10 shrink-0 mt-0.5">
            {item.status === 'completed' ? (
              <CheckCircle2 size={24} className="text-forest-600" />
            ) : item.status === 'active' ? (
              <div className="w-6 h-6 rounded-full bg-forest-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            ) : (
              <Circle size={24} className="text-gray-300" />
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 pb-1">
            <p
              className={`text-sm font-semibold ${
                item.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
              }`}
            >
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            )}
            {item.date && (
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(item.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
            {item.user && (
              <p className="text-xs text-forest-600 font-medium mt-0.5">{item.user}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
