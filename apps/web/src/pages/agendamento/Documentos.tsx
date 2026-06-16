import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FileText, AlertCircle } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { AppHeader } from '../../components/layout/AppHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { UploadBox } from '../../components/ui/UploadBox'
import { useAgendamentoRegras } from '../../hooks/useAgendamentoRegras'

interface DocumentoForm {
  numero: string
  arquivo: File | null
  nomeArquivo: string
}

export function Documentos() {
  const navigate = useNavigate()
  const location = useLocation()
  const form = location.state?.form
  const { regras } = useAgendamentoRegras()

  const [notaFiscal, setNotaFiscal] = useState<DocumentoForm>({ numero: '', arquivo: null, nomeArquivo: '' })
  const [mdfe, setMdfe] = useState<DocumentoForm>({ numero: '', arquivo: null, nomeArquivo: '' })
  const [ordemCarregamento, setOrdemCarregamento] = useState<DocumentoForm>({ numero: '', arquivo: null, nomeArquivo: '' })
  const [anexos, setAnexos] = useState<File[]>([])

  function hasRequired() {
    if (regras.requireNf && !notaFiscal.numero.trim()) return false
    if (regras.requireMdfe && !mdfe.numero.trim()) return false
    if (regras.requireLoadingOrder && !ordemCarregamento.numero.trim()) return false
    return true
  }

  function handleNext() {
    navigate('/agendamento/local-embarque', {
      state: {
        form,
        regras,
        documentos: {
          notaFiscal,
          mdfe,
          ordemCarregamento,
          anexos: anexos.map((f) => f.name),
        },
      },
    })
  }

  return (
    <PageLayout
      header={
        <AppHeader
          title="Documentos da Viagem"
          subtitle="Informe os documentos fiscais"
          showBack
        />
      }
    >
      <div className="space-y-4 pb-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-forest-600" />
            <h3 className="text-sm font-semibold text-gray-700">Nota Fiscal</h3>
            {regras.requireNf && <span className="text-xs text-red-500 font-medium">(Obrigatório)</span>}
          </div>
          <div className="space-y-3">
            <Input
              label="Número da NF"
              placeholder="Ex: 123456"
              required={regras.requireNf}
              value={notaFiscal.numero}
              onChange={(e) => setNotaFiscal((d) => ({ ...d, numero: e.target.value }))}
            />
            {notaFiscal.nomeArquivo ? (
              <UploadBox
                fileName={notaFiscal.nomeArquivo}
                status="pendente"
                onRemove={() => setNotaFiscal((d) => ({ ...d, arquivo: null, nomeArquivo: '' }))}
              />
            ) : (
              <UploadBox
                label="Anexar NF"
                onFileSelect={(f) => setNotaFiscal((d) => ({ ...d, arquivo: f, nomeArquivo: f.name }))}
                helper="Opcional, mas recomendado"
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">MDF-e</h3>
            {regras.requireMdfe && <span className="text-xs text-red-500 font-medium">(Obrigatório)</span>}
          </div>
          <div className="space-y-3">
            <Input
              label="Número do MDF-e"
              placeholder="Ex: 987654"
              required={regras.requireMdfe}
              value={mdfe.numero}
              onChange={(e) => setMdfe((d) => ({ ...d, numero: e.target.value }))}
            />
            {mdfe.nomeArquivo ? (
              <UploadBox
                fileName={mdfe.nomeArquivo}
                status="pendente"
                onRemove={() => setMdfe((d) => ({ ...d, arquivo: null, nomeArquivo: '' }))}
              />
            ) : (
              <UploadBox
                label="Anexar MDF-e"
                onFileSelect={(f) => setMdfe((d) => ({ ...d, arquivo: f, nomeArquivo: f.name }))}
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-gray-700">Ordem de Carregamento</h3>
            {regras.requireLoadingOrder && <span className="text-xs text-red-500 font-medium">(Obrigatório)</span>}
          </div>
          <div className="space-y-3">
            <Input
              label="Número da OC"
              placeholder="Ex: OC-001234"
              required={regras.requireLoadingOrder}
              value={ordemCarregamento.numero}
              onChange={(e) => setOrdemCarregamento((d) => ({ ...d, numero: e.target.value }))}
            />
            {ordemCarregamento.nomeArquivo ? (
              <UploadBox
                fileName={ordemCarregamento.nomeArquivo}
                status="pendente"
                onRemove={() => setOrdemCarregamento((d) => ({ ...d, arquivo: null, nomeArquivo: '' }))}
              />
            ) : (
              <UploadBox
                label="Anexar OC"
                onFileSelect={(f) => setOrdemCarregamento((d) => ({ ...d, arquivo: f, nomeArquivo: f.name }))}
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">Anexos Adicionais</h3>
          </div>
          {anexos.length > 0 && (
            <div className="space-y-2 mb-3">
              {anexos.map((f, i) => (
                <UploadBox
                  key={i}
                  fileName={f.name}
                  onRemove={() => setAnexos((a) => a.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          )}
          <UploadBox label="Adicionar anexo" onFileSelect={(f) => setAnexos((a) => [...a, f])} />
        </Card>

        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Documentos obrigatórios conforme configuração do sistema.
            {regras.requireNf && ' NF'}
            {regras.requireMdfe && ' · MDF-e'}
            {regras.requireLoadingOrder && ' · Ordem de Carregamento'}
          </p>
        </div>

        <Button fullWidth size="lg" disabled={!hasRequired()} onClick={handleNext}>
          Avançar para Local de Embarque →
        </Button>
      </div>
    </PageLayout>
  )
}
