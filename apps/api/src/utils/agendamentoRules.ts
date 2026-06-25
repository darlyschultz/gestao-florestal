import { prisma } from '../lib/prisma'
import { cacheClearPrefix, cacheGetOrSet } from '../lib/cache'

const CACHE_TTL_MS = 60_000
const TZ_AGENDAMENTO = 'America/Sao_Paulo'

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

function parseHorario(h: string): number {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + (mm || 0)
}

export function formatHorario(minutes: number): string {
  const hh = Math.floor(minutes / 60)
  const mm = minutes % 60
  return `${hh}:${String(mm).padStart(2, '0')}`
}

function generateSlots(inicio: string, fim: string, intervalo: number): string[] {
  const start = parseHorario(inicio)
  const end = parseHorario(fim)
  const slots: string[] = []
  for (let m = start; m < end; m += intervalo) {
    slots.push(formatHorario(m))
  }
  return slots
}

async function getSettings() {
  return cacheGetOrSet('settings', CACHE_TTL_MS, async () => {
    let settings = await prisma.systemSettings.findFirst()
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} })
    }
    return settings
  })
}

async function getJanelasAtivas(diaSemana?: number) {
  const cacheKey = diaSemana === undefined ? 'janelas:all' : `janelas:${diaSemana}`
  return cacheGetOrSet(cacheKey, CACHE_TTL_MS, async () => {
    const where: { active: boolean; deletedAt: null; diaSemana?: number } = {
      active: true,
      deletedAt: null,
    }
    if (diaSemana !== undefined) where.diaSemana = diaSemana

    return prisma.janelaAgendamento.findMany({ where, orderBy: { horarioInicial: 'asc' } })
  })
}

export function normalizeHorario(h: string): string {
  return formatHorario(parseHorario(h))
}

export function dataStrFromDate(dt: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_AGENDAMENTO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dt)
}

export function horarioFromDate(dt: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ_AGENDAMENTO,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return formatHorario(hour * 60 + minute)
}

/** Data/hora de slot no fuso operacional (Brasil). */
export function parseDataHorarioSlot(dataStr: string, horario: string): Date {
  const norm = normalizeHorario(horario)
  const [hh, mm] = norm.split(':').map(Number)
  const h = String(hh).padStart(2, '0')
  const m = String(mm || 0).padStart(2, '0')
  return new Date(`${dataStr}T${h}:${m}:00-03:00`)
}

export function invalidateDisponibilidadeCache(dataStr?: string): void {
  if (dataStr) cacheClearPrefix(`disponibilidade:${dataStr}`)
  else cacheClearPrefix('disponibilidade:')
}

function countBySlot(
  agendamentos: { dataHoraSaidaPrevista: Date }[],
  slots: string[],
  intervalo: number
): Map<string, number> {
  const counts = new Map<string, number>()
  slots.forEach((s) => counts.set(s, 0))

  for (const ag of agendamentos) {
    const dt = new Date(ag.dataHoraSaidaPrevista)
    const horario = horarioFromDate(dt)
    const minutes = parseHorario(horario)

    for (const slot of slots) {
      const slotStart = parseHorario(slot)
      if (minutes >= slotStart && minutes < slotStart + intervalo) {
        counts.set(slot, (counts.get(slot) || 0) + 1)
        break
      }
    }
  }

  return counts
}

export async function getRegrasAgendamento(): Promise<RegrasAgendamento> {
  return cacheGetOrSet('regras:agendamento', CACHE_TTL_MS, async () => {
    const [settings, janelas] = await Promise.all([getSettings(), getJanelasAtivas()])
    const diasComJanela = [...new Set(janelas.map((j) => j.diaSemana))].sort()

    return {
      requireNf: settings.requireNf,
      requireMdfe: settings.requireMdfe,
      requireLoadingOrder: settings.requireLoadingOrder,
      requireBoardingLocation: settings.requireBoardingLocation,
      requireGpsTracking: settings.requireGpsTracking,
      boardingGeofenceRadiusMeters: settings.boardingGeofenceRadiusMeters,
      scheduleIntervalMinutes: settings.scheduleIntervalMinutes,
      maxTrucksPerSlot: settings.maxTrucksPerSlot,
      gateOpenTime: settings.gateOpenTime || '06:00',
      gateCloseTime: settings.gateCloseTime || '22:00',
      diasComJanela,
    }
  })
}

export async function getDisponibilidadeDia(dataStr: string): Promise<DisponibilidadeDia> {
  return cacheGetOrSet(`disponibilidade:${dataStr}`, 30_000, async () => {
  const [settings, todasJanelas, agendamentos] = await Promise.all([
    getSettings(),
    getJanelasAtivas(),
    (async () => {
      const nextDay = new Date(`${dataStr}T00:00:00`)
      nextDay.setDate(nextDay.getDate() + 1)
      return prisma.agendamento.findMany({
        where: {
          status: { not: 'cancelado' },
          dataHoraSaidaPrevista: { gte: new Date(`${dataStr}T00:00:00`), lt: nextDay },
        },
        select: { dataHoraSaidaPrevista: true },
      })
    })(),
  ])

  const d = new Date(`${dataStr}T12:00:00`)
  const diaSemana = d.getDay()
  const janelas = todasJanelas.filter((j) => j.diaSemana === diaSemana)

  const semJanela: DisponibilidadeDia = {
    data: dataStr,
    diaSemana,
    temJanela: false,
    intervaloMinutos: settings.scheduleIntervalMinutes,
    capacidadePorHorario: settings.maxTrucksPerSlot,
    horarioInicial: null,
    horarioFinal: null,
    slots: [],
  }

  if (todasJanelas.length > 0 && janelas.length === 0) {
    return semJanela
  }

  if (janelas.length === 0) {
    const intervalo = settings.scheduleIntervalMinutes
    const capacidade = settings.maxTrucksPerSlot
    const inicio = settings.gateOpenTime || '06:00'
    const fim = settings.gateCloseTime || '22:00'
    const slots = generateSlots(inicio, fim, intervalo)
    const counts = countBySlot(agendamentos, slots, intervalo)

    return {
      data: dataStr,
      diaSemana,
      temJanela: true,
      intervaloMinutos: intervalo,
      capacidadePorHorario: capacidade,
      horarioInicial: inicio,
      horarioFinal: fim,
      slots: slots.map((horario) => {
        const ocupados = counts.get(horario) || 0
        return { horario, ocupados, capacidade, disponivel: ocupados === 0 }
      }),
    }
  }

  const intervalo = janelas[0].intervaloMinutos || settings.scheduleIntervalMinutes
  const capacidade = Math.min(
    ...janelas.map((j) => j.capacidadePorHorario || settings.maxTrucksPerSlot)
  )

  const slotSet = new Set<string>()
  for (const janela of janelas) {
    generateSlots(
      janela.horarioInicial,
      janela.horarioFinal,
      janela.intervaloMinutos || intervalo
    ).forEach((s) => slotSet.add(s))
  }

  const slots = [...slotSet].sort((a, b) => parseHorario(a) - parseHorario(b))
  const counts = countBySlot(agendamentos, slots, intervalo)

  const horarioInicial = formatHorario(Math.min(...janelas.map((j) => parseHorario(j.horarioInicial))))
  const horarioFinal = formatHorario(Math.max(...janelas.map((j) => parseHorario(j.horarioFinal))))

  return {
    data: dataStr,
    diaSemana,
    temJanela: true,
    intervaloMinutos: intervalo,
    capacidadePorHorario: capacidade,
    horarioInicial,
    horarioFinal,
    slots: slots.map((horario) => {
      const ocupados = counts.get(horario) || 0
      const cap = janelas.find((j) => {
        const m = parseHorario(horario)
        return m >= parseHorario(j.horarioInicial) && m < parseHorario(j.horarioFinal)
      })
      const capSlot = cap?.capacidadePorHorario || settings.maxTrucksPerSlot
      return { horario, ocupados, capacidade: capSlot, disponivel: ocupados === 0 }
    }),
  }
  })
}

export async function validarHorariosLote(
  dataStr: string,
  horarios: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const disp = await getDisponibilidadeDia(dataStr)

  if (!disp.temJanela || disp.slots.length === 0) {
    return { ok: false, error: 'Não há janela de agendamento para este dia' }
  }

  const reservasPendentes = new Map<string, number>()

  for (const raw of horarios) {
    const horario = normalizeHorario(raw)
    const slot = disp.slots.find((s) => normalizeHorario(s.horario) === horario)

    if (!slot) {
      return { ok: false, error: `Horário ${horario} fora da janela de agendamento configurada` }
    }

    const extra = reservasPendentes.get(horario) || 0
    if (slot.ocupados + extra > 0) {
      return {
        ok: false,
        error: `Horário ${horario} já está reservado`,
      }
    }

    reservasPendentes.set(horario, extra + 1)
  }

  return { ok: true }
}

export async function validarHorarioAgendamento(
  dataHoraSaida: Date | string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const dt = new Date(dataHoraSaida)
  return validarHorariosLote(dataStrFromDate(dt), [horarioFromDate(dt)])
}

export { prisma as agendamentoPrisma }
