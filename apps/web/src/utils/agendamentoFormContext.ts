export interface VeiculoOption {
  id: string
  placa: string
  tipo: string
  placaCarreta?: string | null
  transportadoraId?: string
}

export interface MotoristaOption {
  id: string
  nome: string
  transportadoraId?: string
}

export interface ContextoFormularioAgendamento {
  transportadoraId?: string
  transportadora?: { id: string; nome: string }
  motoristaId?: string
  motorista?: { id: string; nome: string; telefone?: string | null; cnh?: string }
  motoristas?: MotoristaOption[]
  veiculos?: VeiculoOption[]
  bloquearTransportadora?: boolean
  bloquearMotorista?: boolean
}

export function labelVeiculo(v: VeiculoOption): string {
  const carreta = v.placaCarreta ? ` / ${v.placaCarreta}` : ''
  return `${v.placa}${carreta} · ${v.tipo}`
}

export function filtrarPorTransportadora<T extends { transportadoraId?: string }>(
  items: T[],
  transportadoraId: string,
): T[] {
  if (!transportadoraId) return items
  return items.filter((i) => i.transportadoraId === transportadoraId)
}

export function valoresIniciaisTransporte(ctx: ContextoFormularioAgendamento | null | undefined) {
  if (!ctx?.transportadoraId) {
    return { transportadoraId: '', motoristaId: '', veiculoId: '' }
  }

  const veiculos = ctx.veiculos || []
  return {
    transportadoraId: ctx.transportadoraId,
    motoristaId: ctx.motoristaId || '',
    veiculoId: veiculos.length === 1 ? veiculos[0].id : '',
  }
}

export function listasTransporte(
  ctx: ContextoFormularioAgendamento | null | undefined,
  bundle: {
    transportadoras: { id: string; nome: string }[]
    motoristas: MotoristaOption[]
    veiculos: VeiculoOption[]
  },
  transportadoraId: string,
) {
  const transpId = transportadoraId || ctx?.transportadoraId || ''

  if (ctx?.motoristas?.length) {
    return {
      transportadoras: ctx.transportadora
        ? [ctx.transportadora]
        : bundle.transportadoras.filter((t) => t.id === transpId),
      motoristas: ctx.motoristas,
      veiculos: ctx.veiculos?.length ? ctx.veiculos : filtrarPorTransportadora(bundle.veiculos, transpId),
    }
  }

  return {
    transportadoras: ctx?.transportadora ? [ctx.transportadora] : bundle.transportadoras,
    motoristas: filtrarPorTransportadora(bundle.motoristas, transpId),
    veiculos: filtrarPorTransportadora(bundle.veiculos, transpId),
  }
}
