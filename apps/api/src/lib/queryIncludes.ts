import type { Prisma } from '@prisma/client'

const entidadeBasica = {
  select: { id: true, nome: true },
} as const

const motoristaBasico = {
  select: { id: true, nome: true, telefone: true },
} as const

const veiculoBasico = {
  select: { id: true, placa: true, placaCarreta: true, tipo: true },
} as const

const fazendaBasica = {
  select: { id: true, nome: true, cidade: true, estado: true, fornecedorId: true },
} as const

/** Lista da portaria — evita joins duplicados e documentos completos. */
export const portariaAgendamentoListInclude = {
  transportadora: entidadeBasica,
  motorista: motoristaBasico,
  veiculo: veiculoBasico,
  fornecedor: entidadeBasica,
  fazenda: fazendaBasica,
  talhao: entidadeBasica,
  localEmbarque: entidadeBasica,
  viagem: {
    select: {
      id: true,
      numero: true,
      status: true,
      documentos: { select: { id: true, status: true } },
    },
  },
} satisfies Prisma.AgendamentoInclude

/** Check-in — detalhe completo de uma viagem. */
export const portariaCheckinInclude = {
  agendamento: {
    include: {
      transportadora: entidadeBasica,
      motorista: motoristaBasico,
      veiculo: veiculoBasico,
      fornecedor: entidadeBasica,
      fazenda: fazendaBasica,
      talhao: entidadeBasica,
      localEmbarque: entidadeBasica,
    },
  },
  motorista: motoristaBasico,
  veiculo: veiculoBasico,
  transportadora: entidadeBasica,
  documentos: { select: { id: true, viagemId: true, tipo: true, numero: true, status: true, observacao: true } },
} satisfies Prisma.ViagemInclude

/** Lista de viagens — sem alertas, pesagens e descargas. */
export const viagemListInclude = {
  agendamento: {
    include: {
      transportadora: entidadeBasica,
      motorista: motoristaBasico,
      veiculo: veiculoBasico,
      fornecedor: entidadeBasica,
      fazenda: fazendaBasica,
      talhao: entidadeBasica,
      localEmbarque: entidadeBasica,
    },
  },
  transportadora: entidadeBasica,
  motorista: motoristaBasico,
  veiculo: veiculoBasico,
  documentos: { select: { id: true, status: true, tipo: true } },
} satisfies Prisma.ViagemInclude
