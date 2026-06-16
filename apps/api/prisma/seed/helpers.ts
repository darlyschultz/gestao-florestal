import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export async function clearDatabase() {
  await prisma.customFieldValue.deleteMany()
  await prisma.customFieldOption.deleteMany()
  await prisma.customField.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.descarga.deleteMany()
  await prisma.pesagem.deleteMany()
  await prisma.filaPatio.deleteMany()
  await prisma.portariaCheckin.deleteMany()
  await prisma.eventoViagem.deleteMany()
  await prisma.alertaViagem.deleteMany()
  await prisma.posicaoViagem.deleteMany()
  await prisma.documentoViagem.deleteMany()
  await prisma.viagem.deleteMany()
  await prisma.agendamento.deleteMany()
  await prisma.localEmbarque.deleteMany()
  await prisma.talhao.deleteMany()
  await prisma.fazenda.deleteMany()
  await prisma.fornecedor.deleteMany()
  await prisma.veiculo.deleteMany()
  await prisma.motorista.deleteMany()
  await prisma.janelaAgendamento.deleteMany()
  await prisma.doca.deleteMany()
  await prisma.balanca.deleteMany()
  await prisma.motivoBloqueio.deleteMany()
  await prisma.user.deleteMany()
  await prisma.transportadora.deleteMany()
  await prisma.tipoMadeira.deleteMany()
  await prisma.tipoVeiculo.deleteMany()
  await prisma.unidade.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.systemSettings.deleteMany()
}

export const MODULES = [
  'dashboard',
  'agendamento',
  'viagens',
  'rastreamento',
  'alertas',
  'portaria',
  'fila_patio',
  'pesagem',
  'descarga',
  'historico',
  'relatorios',
  'cadastros',
  'configuracoes',
] as const

export type ModuleName = (typeof MODULES)[number]

export function fullPermissions(roleId: string, module: ModuleName) {
  return {
    roleId,
    module,
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canBlock: true,
    canExport: true,
  }
}

export function viewOnlyPermissions(roleId: string, module: ModuleName) {
  return {
    roleId,
    module,
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canBlock: false,
    canExport: false,
  }
}
