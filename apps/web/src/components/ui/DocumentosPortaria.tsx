import React, { useState } from 'react'
import {
  FileText, X, CheckCircle, XCircle, ExternalLink, Eye,
  FileImage, AlertCircle, Download,
} from 'lucide-react'
import { DocumentoViagem } from '../../types'
import { StatusBadge } from './StatusBadge'
import { Button } from './Button'
import { documentosService } from '../../services/api'

const TIPO_LABELS: Record<string, string> = {
  nota_fiscal: 'Nota Fiscal',
  mdfe: 'MDF-e',
  ordem_carregamento: 'Ordem de Carregamento',
  anexo: 'Anexo',
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  nota_fiscal: <FileText size={20} className="text-blue-600" />,
  mdfe: <FileText size={20} className="text-purple-600" />,
  ordem_carregamento: <FileText size={20} className="text-orange-600" />,
  anexo: <FileImage size={20} className="text-gray-600" />,
}

function arquivoUrl(arquivo?: string): string | null {
  if (!arquivo) return null
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5291'
  return `${base}${arquivo}`
}

function isImagem(arquivo?: string): boolean {
  if (!arquivo) return false
  return /\.(jpg|jpeg|png|webp)$/i.test(arquivo)
}

function nomeArquivo(documento: DocumentoViagem): string {
  if (documento.arquivo) {
    return documento.arquivo.split('/').pop() || `${documento.tipo}.pdf`
  }
  const ext = documento.tipo === 'nota_fiscal' ? 'pdf' : 'pdf'
  const num = documento.numero?.replace(/[^\w-]/g, '_') || documento.tipo
  return `${documento.tipo}_${num}.${ext}`
}

async function downloadArquivo(documento: DocumentoViagem) {
  const url = arquivoUrl(documento.arquivo)
  if (!url) return

  const filename = nomeArquivo(documento)
  const token = localStorage.getItem('token')

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Falha no download')

    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)
  } catch {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}

interface DocumentoViewerModalProps {
  documento: DocumentoViagem
  onClose: () => void
  onValidated: (doc: DocumentoViagem) => void
  readOnly?: boolean
}

export function DocumentoViewerModal({
  documento,
  onClose,
  onValidated,
  readOnly = false,
}: DocumentoViewerModalProps) {
  const [observacao, setObservacao] = useState(documento.observacao || '')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const url = arquivoUrl(documento.arquivo)
  const label = TIPO_LABELS[documento.tipo] || documento.tipo

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadArquivo(documento)
    } finally {
      setDownloading(false)
    }
  }

  async function validar(status: 'valido' | 'invalido') {
    setLoading(true)
    try {
      const r = await documentosService.validar(documento.id, { status, observacao })
      onValidated(r.data)
      onClose()
    } catch {
      onValidated({ ...documento, status, observacao })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl">
              {TIPO_ICONS[documento.tipo] || <FileText size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{label}</h3>
              <p className="text-xs text-gray-500">{documento.numero || 'Sem número informado'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status atual</span>
            <StatusBadge status={documento.status} />
          </div>

          {/* Preview do documento */}
          {url && isImagem(documento.arquivo) ? (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={url} alt={label} className="w-full max-h-64 object-contain" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" fullWidth onClick={handleDownload} loading={downloading} icon={<Download size={14} />}>
                  Baixar imagem
                </Button>
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="secondary" size="sm" fullWidth icon={<ExternalLink size={14} />}>
                    Abrir
                  </Button>
                </a>
              </div>
            </div>
          ) : url ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center space-y-3">
              <FileText size={40} className="mx-auto text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Arquivo anexado (PDF)</p>
              <p className="text-xs text-gray-500 truncate px-4">{nomeArquivo(documento)}</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={handleDownload} loading={downloading} icon={<Download size={14} />}>
                  Baixar arquivo
                </Button>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" icon={<ExternalLink size={14} />}>
                    Abrir
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5">
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FileText size={18} className="text-forest-600" />
                  <span className="text-sm font-bold text-gray-800">{label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 mb-0.5">Número</p>
                    <p className="font-semibold text-gray-800">{documento.numero || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Tipo</p>
                    <p className="font-semibold text-gray-800 capitalize">{documento.tipo.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
                  <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Sem arquivo anexado. Valide conforme o número informado pelo transportador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dados do documento */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Número do documento</span>
              <span className="font-semibold text-gray-800">{documento.numero || '—'}</span>
            </div>
            {documento.arquivo && (
              <div className="flex justify-between items-center text-xs gap-2">
                <span className="text-gray-500 shrink-0">Arquivo</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-gray-700 truncate">
                    {documento.arquivo.split('/').pop()}
                  </span>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="shrink-0 p-1 rounded-lg text-forest-600 hover:bg-forest-50 disabled:opacity-50"
                    title="Baixar arquivo"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {!readOnly && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Observação da validação
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: NF conferida com sistema fiscal..."
                rows={2}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Ações de validação */}
        {!readOnly && (
          <div className="px-4 py-4 border-t border-gray-100 shrink-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                fullWidth
                loading={loading}
                onClick={() => validar('invalido')}
                icon={<XCircle size={16} />}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Inválido
              </Button>
              <Button
                fullWidth
                loading={loading}
                onClick={() => validar('valido')}
                icon={<CheckCircle size={16} />}
              >
                Válido
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface DocumentosPortariaProps {
  documentos: DocumentoViagem[]
  onUpdate: (docs: DocumentoViagem[]) => void
  readOnly?: boolean
}

export function DocumentosPortaria({ documentos, onUpdate, readOnly = false }: DocumentosPortariaProps) {
  const [viewing, setViewing] = useState<DocumentoViagem | null>(null)

  function handleValidated(updated: DocumentoViagem) {
    onUpdate(documentos.map((d) => (d.id === updated.id ? updated : d)))
  }

  const pendentes = documentos.filter((d) => d.status === 'pendente').length
  const invalidos = documentos.filter((d) => d.status === 'invalido').length
  const todosValidos = documentos.length > 0 && documentos.every((d) => d.status === 'valido')

  return (
    <>
      <div className="space-y-3">
        {/* Resumo */}
        <div className="flex flex-wrap gap-2">
          {pendentes > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
              {pendentes} pendente{pendentes > 1 ? 's' : ''}
            </span>
          )}
          {invalidos > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
              {invalidos} inválido{invalidos > 1 ? 's' : ''}
            </span>
          )}
          {todosValidos && (
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              Todos válidos
            </span>
          )}
        </div>

        {/* Lista de documentos */}
        {documentos.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              doc.status === 'invalido'
                ? 'border-red-200 bg-red-50'
                : doc.status === 'valido'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
              {TIPO_ICONS[doc.tipo] || <FileText size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">
                {TIPO_LABELS[doc.tipo] || doc.tipo}
              </p>
              <p className="text-xs text-gray-500 truncate">{doc.numero || 'Sem número'}</p>
              {doc.observacao && (
                <p className="text-xs text-gray-400 mt-0.5 truncate italic">{doc.observacao}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={doc.status} size="sm" />
              <div className="flex items-center gap-2">
                {doc.arquivo && (
                  <button
                    type="button"
                    onClick={() => downloadArquivo(doc)}
                    className="flex items-center gap-1 text-xs text-gray-600 font-semibold hover:text-forest-700"
                    title="Baixar arquivo"
                  >
                    <Download size={13} />
                    Baixar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewing(doc)}
                  className="flex items-center gap-1 text-xs text-forest-600 font-semibold hover:text-forest-800"
                >
                  <Eye size={13} />
                  {readOnly ? 'Ver' : 'Validar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <DocumentoViewerModal
          documento={viewing}
          onClose={() => setViewing(null)}
          onValidated={handleValidated}
          readOnly={readOnly}
        />
      )}
    </>
  )
}
