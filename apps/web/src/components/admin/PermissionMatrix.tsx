import React from 'react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

const MODULES = [
  'agendamentos', 'viagens', 'portaria', 'operacao', 'cadastros',
  'configuracoes', 'usuarios', 'relatorios', 'dashboard',
]

interface Permission {
  module: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canBlock: boolean
  canExport: boolean
}

interface PermissionMatrixProps {
  permissions: Permission[]
  onChange: (permissions: Permission[]) => void
}

export function PermissionMatrix({ permissions, onChange }: PermissionMatrixProps) {
  function getPerm(module: string): Permission {
    return permissions.find((p) => p.module === module) || {
      module, canView: false, canCreate: false, canEdit: false,
      canDelete: false, canApprove: false, canBlock: false, canExport: false,
    }
  }

  function toggle(module: string, key: keyof Omit<Permission, 'module'>) {
    const current = getPerm(module)
    const updated = permissions.filter((p) => p.module !== module)
    updated.push({ ...current, [key]: !current[key] })
    onChange(updated)
  }

  const cols: { key: keyof Omit<Permission, 'module'>; label: string }[] = [
    { key: 'canView', label: 'Ver' },
    { key: 'canCreate', label: 'Criar' },
    { key: 'canEdit', label: 'Editar' },
    { key: 'canDelete', label: 'Excluir' },
    { key: 'canApprove', label: 'Aprovar' },
    { key: 'canBlock', label: 'Bloquear' },
    { key: 'canExport', label: 'Exportar' },
  ]

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-2 font-medium text-gray-600">Módulo</th>
            {cols.map((c) => (
              <th key={c.key} className="text-center py-2 px-1 font-medium text-gray-600">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((mod) => {
            const perm = getPerm(mod)
            return (
              <tr key={mod} className="border-b border-gray-100">
                <td className="py-2 pr-2 capitalize text-gray-800">{mod}</td>
                {cols.map((c) => (
                  <td key={c.key} className="text-center py-2 px-1">
                    <input
                      type="checkbox"
                      checked={perm[c.key]}
                      onChange={() => toggle(mod, c.key)}
                      className="w-4 h-4 rounded accent-forest-700"
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function DynamicFieldRenderer({
  fields,
  values,
  onChange,
}: {
  fields: Array<{
    id: string
    label: string
    fieldType: string
    required?: boolean
    placeholder?: string
    helpText?: string
    readonly?: boolean
    options?: Array<{ label: string; value: string }>
    currentValue?: string | null
  }>
  values: Record<string, string>
  onChange: (fieldId: string, value: string) => void
}) {
  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const val = values[field.id] ?? field.currentValue ?? ''
        if (field.fieldType === 'select' && field.options) {
          return (
            <Select
              key={field.id}
              label={field.label}
              required={field.required}
              disabled={field.readonly}
              options={field.options.map((o) => ({ value: o.value, label: o.label }))}
              value={val}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          )
        }
        if (field.fieldType === 'checkbox') {
          return (
            <label key={field.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={val === 'true'}
                disabled={field.readonly}
                onChange={(e) => onChange(field.id, String(e.target.checked))}
                className="w-4 h-4 rounded accent-forest-700"
              />
              {field.label}
            </label>
          )
        }
        if (field.fieldType === 'observacao') {
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
              <textarea
                value={val}
                disabled={field.readonly}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          )
        }
        const inputType = field.fieldType === 'numero' || field.fieldType === 'decimal' ? 'number'
          : field.fieldType === 'data' ? 'date'
          : field.fieldType === 'datetime' ? 'datetime-local'
          : 'text'
        return (
          <Input
            key={field.id}
            label={field.label}
            type={inputType}
            required={field.required}
            disabled={field.readonly}
            value={val}
            placeholder={field.placeholder}
            helper={field.helpText}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        )
      })}
    </div>
  )
}
