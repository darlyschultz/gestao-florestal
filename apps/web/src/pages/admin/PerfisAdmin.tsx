import React, { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PermissionMatrix } from '../../components/admin/PermissionMatrix'
import { perfisService } from '../../services/api'

interface Role {
  id: string
  name: string
  slug: string
  description?: string
  permissions?: Array<{
    module: string
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canApprove: boolean
    canBlock: boolean
    canExport: boolean
  }>
}

export function PerfisAdmin() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selected, setSelected] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Role['permissions']>([])
  const [loading, setSaving] = useState(false)

  async function load() {
    const { data } = await perfisService.list()
    setRoles(data)
  }

  useEffect(() => { load() }, [])

  async function openRole(role: Role) {
    const { data } = await perfisService.get(role.id)
    setSelected(data)
    setPermissions(data.permissions || [])
  }

  async function handleSavePermissions() {
    if (!selected) return
    setSaving(true)
    try {
      await perfisService.updatePermissions(selected.id, permissions || [])
      alert('Permissões salvas')
    } finally {
      setSaving(false)
    }
  }

  if (selected) {
    return (
      <PageLayout header={<AppHeader title={selected.name} subtitle="Permissões" showBack backPath="/cadastros/perfis" />}>
        <PermissionMatrix
          permissions={permissions || []}
          onChange={setPermissions}
        />
        <Button fullWidth loading={loading} className="mt-4" onClick={handleSavePermissions}>
          Salvar permissões
        </Button>
      </PageLayout>
    )
  }

  return (
    <PageLayout header={<AppHeader title="Perfis e Permissões" showBack backPath="/cadastros" />}>
      <div className="space-y-2">
        {roles.map((role) => (
          <Card key={role.id} hover padding="md" onClick={() => openRole(role)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{role.name}</p>
                <p className="text-xs text-gray-500">{role.description || role.slug}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  )
}
