import { prisma } from './helpers'

const SYSTEM_FIELDS = [
  // Novo Agendamento
  { module: 'agendamento', screen: 'novo_agendamento', label: 'Observações', technicalKey: 'observacoes', fieldType: 'observacao', required: false, displayOrder: 99, isSystem: true },
  // Documentos
  { module: 'agendamento', screen: 'documentos_viagem', label: 'Nota Fiscal', technicalKey: 'nota_fiscal', fieldType: 'texto', required: true, displayOrder: 1, isSystem: true },
  { module: 'agendamento', screen: 'documentos_viagem', label: 'MDF-e', technicalKey: 'mdfe', fieldType: 'texto', required: true, displayOrder: 2, isSystem: true },
  { module: 'agendamento', screen: 'documentos_viagem', label: 'Ordem de Carregamento', technicalKey: 'ordem_carregamento', fieldType: 'texto', required: true, displayOrder: 3, isSystem: true },
  // Portaria
  { module: 'portaria', screen: 'checkin_portaria', label: 'Motivo do Bloqueio', technicalKey: 'motivo_bloqueio', fieldType: 'select', required: false, displayOrder: 10, isSystem: true },
  // Pesagem
  { module: 'operacao', screen: 'pesagem_inicial', label: 'Ticket da Balança', technicalKey: 'ticket_balanca', fieldType: 'texto', required: true, displayOrder: 1, isSystem: true },
  { module: 'operacao', screen: 'pesagem_final', label: 'Peso Tara (kg)', technicalKey: 'peso_tara', fieldType: 'decimal', required: true, displayOrder: 2, isSystem: true },
  // Descarga
  { module: 'operacao', screen: 'liberacao_descarga', label: 'Doca', technicalKey: 'doca', fieldType: 'select', required: true, displayOrder: 1, isSystem: true },
  // Cadastros
  { module: 'cadastros', screen: 'cadastro_motorista', label: 'CNH', technicalKey: 'cnh', fieldType: 'texto', required: true, displayOrder: 3, isSystem: true },
  { module: 'cadastros', screen: 'cadastro_veiculo', label: 'Placa do Cavalo', technicalKey: 'placa_cavalo', fieldType: 'texto', required: true, displayOrder: 1, isSystem: true },
  { module: 'cadastros', screen: 'cadastro_fazenda', label: 'Latitude', technicalKey: 'latitude', fieldType: 'coordenada', required: false, displayOrder: 10, isSystem: true },
  { module: 'cadastros', screen: 'cadastro_talhao', label: 'Área (ha)', technicalKey: 'area_ha', fieldType: 'decimal', required: false, displayOrder: 5, isSystem: true },
]

const CUSTOM_FIELDS = [
  {
    module: 'agendamento',
    screen: 'novo_agendamento',
    label: 'Número do Contrato',
    technicalKey: 'numero_contrato',
    fieldType: 'texto',
    required: false,
    displayOrder: 50,
    placeholder: 'Ex: CTR-2024-001',
    helpText: 'Contrato florestal vinculado ao carregamento',
    isSystem: false,
  },
  {
    module: 'operacao',
    screen: 'pesagem_final',
    label: 'Umidade da Madeira (%)',
    technicalKey: 'umidade_madeira',
    fieldType: 'decimal',
    required: false,
    displayOrder: 20,
    minValue: '0',
    maxValue: '100',
    helpText: 'Percentual de umidade medido na descarga',
    isSystem: false,
  },
  {
    module: 'portaria',
    screen: 'checkin_portaria',
    label: 'Temperatura do Motorista (°C)',
    technicalKey: 'temperatura_motorista',
    fieldType: 'decimal',
    required: false,
    displayOrder: 15,
    isSystem: false,
  },
]

export async function seedCustomFields() {
  for (const field of SYSTEM_FIELDS) {
    await prisma.customField.create({ data: field })
  }

  for (const field of CUSTOM_FIELDS) {
    const created = await prisma.customField.create({ data: field })

    if (field.technicalKey === 'motivo_bloqueio') {
      await prisma.customFieldOption.createMany({
        data: [
          { customFieldId: created.id, label: 'Documentação pendente', value: 'DOC-PEND', displayOrder: 1 },
          { customFieldId: created.id, label: 'Placa divergente', value: 'PLACA-DIV', displayOrder: 2 },
          { customFieldId: created.id, label: 'Atraso na chegada', value: 'ATRASO', displayOrder: 3 },
        ],
      })
    }

    if (field.technicalKey === 'doca') {
      await prisma.customFieldOption.createMany({
        data: [
          { customFieldId: created.id, label: 'Doca 01', value: 'DOCA-01', displayOrder: 1 },
          { customFieldId: created.id, label: 'Doca 02', value: 'DOCA-02', displayOrder: 2 },
          { customFieldId: created.id, label: 'Doca 03', value: 'DOCA-03', displayOrder: 3 },
          { customFieldId: created.id, label: 'Doca 04', value: 'DOCA-04', displayOrder: 4 },
        ],
      })
    }
  }

  console.log('✅ Campos dinâmicos criados (12 sistema + 3 personalizados)')
}
