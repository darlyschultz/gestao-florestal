import React, { useEffect, useState } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { auditoriaService } from '../../services/api'

interface AuditEntry {
  id: string
  entityType: string
  entityId?: string
  action: string
  createdAt: string
  user?: { nome: string; email: string }
}

export function Auditoria() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    auditoriaService.list({ limit: 100 }).then(({ data }) => {
      setLogs(data.data || [])
      setTotal(data.total || 0)
      setLoading(false)
    })
  }, [])

  function formatDate(d: string) {
    return new Date(d).toLocaleString('pt-BR')
  }

  return (
    <PageLayout header={<AppHeader title="Auditoria" subtitle={`${total} registros`} showBack backPath="/cadastros" />}>
      {loading ? (
        <p className="text-center text-gray-400 py-8">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Nenhum registro de auditoria</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} padding="md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 capitalize">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {log.user?.nome || 'Sistema'} · {formatDate(log.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
