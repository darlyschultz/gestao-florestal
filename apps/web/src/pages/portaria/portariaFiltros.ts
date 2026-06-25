export const STATUS_FILTROS = [
  { label: 'Aguardando check-in', value: 'pendente_checkin' },
  { label: 'Pré-agendado', value: 'pre_agendado' },
  { label: 'Em trânsito', value: 'em_transito' },
  { label: 'Próx. fábrica', value: 'proximo_fabrica' },
  { label: 'Agendado', value: 'agendado' },
  { label: 'Na portaria+', value: 'operacao' },
  { label: 'Bloqueado', value: 'bloqueado' },
  { label: 'Finalizado', value: 'finalizado' },
  { label: 'Sem viagem', value: 'sem_viagem' },
  { label: 'Todos', value: 'todos' },
] as const

export const STATUS_PENDENTE_CHECKIN = ['agendado', 'em_transito', 'proximo_fabrica']

export const STATUS_FILTRO_PADRAO = 'pendente_checkin'
