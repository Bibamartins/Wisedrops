'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { markDocsUploaded } from '@/lib/anvisa-store'
import { useAuth } from '@/lib/use-auth'

// Document types and their requirements
const DOCUMENT_TYPES = [
  {
    id: 'identity',
    title: 'Documento de Identidade',
    description: 'RG, CNH ou Passaporte. Envie frente e verso.',
    icon: '\u{1FAAA}',
    required: true,
    maxFiles: 2,
    hint: 'Frente e verso do documento',
  },
  {
    id: 'address_proof',
    title: 'Comprovante de Resid\u00EAncia',
    description: 'Conta de luz, \u00E1gua, telefone ou extrato banc\u00E1rio dos \u00FAltimos 3 meses.',
    icon: '\u{1F3E0}',
    required: true,
    maxFiles: 1,
    hint: 'Documento recente (\u00FAltimos 90 dias)',
  },
  {
    id: 'anvisa_auth',
    title: 'Autoriza\u00E7\u00E3o ANVISA',
    description: 'Documento de autoriza\u00E7\u00E3o emitido pela ANVISA para importa\u00E7\u00E3o de produtos.',
    icon: '\u{1F4CB}',
    required: false,
    maxFiles: 1,
    hint: 'Necess\u00E1rio apenas para produtos importados (RDC 660)',
  },
]

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  preview?: string
  status: 'uploading' | 'uploaded' | 'error'
  progress: number
}

interface DocumentUploads {
  [key: string]: UploadedFile[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const consultationId = searchParams.get('consultationId')
  const { user } = useAuth()
  const [uploads, setUploads] = useState<DocumentUploads>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleFileDrop = useCallback((docId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const docType = DOCUMENT_TYPES.find(d => d.id === docId)
    const currentFiles = uploads[docId] || []
    const maxFiles = docType?.maxFiles || 1

    if (currentFiles.length + files.length > maxFiles) {
      alert(`M\u00E1ximo de ${maxFiles} arquivo(s) para este documento.`)
      return
    }

    const newFiles: UploadedFile[] = Array.from(files).map((file) => {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        return {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error' as const,
          progress: 0,
        }
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error' as const,
          progress: 0,
        }
      }

      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined

      return {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        status: 'uploading' as const,
        progress: 0,
      }
    })

    setUploads(prev => ({
      ...prev,
      [docId]: [...(prev[docId] || []), ...newFiles],
    }))

    // Simulate upload progress
    newFiles.forEach((file) => {
      if (file.status === 'error') return

      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setUploads(prev => ({
            ...prev,
            [docId]: (prev[docId] || []).map(f =>
              f.id === file.id ? { ...f, status: 'uploaded', progress: 100 } : f
            ),
          }))
        } else {
          setUploads(prev => ({
            ...prev,
            [docId]: (prev[docId] || []).map(f =>
              f.id === file.id ? { ...f, progress: Math.min(progress, 99) } : f
            ),
          }))
        }
      }, 500)
    })
  }, [uploads])

  const removeFile = (docId: string, fileId: string) => {
    setUploads(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).filter(f => f.id !== fileId),
    }))
  }

  const getDocStatus = (docId: string) => {
    const files = uploads[docId] || []
    if (files.length === 0) return 'pending'
    if (files.some(f => f.status === 'uploading')) return 'uploading'
    if (files.some(f => f.status === 'error')) return 'error'
    return 'complete'
  }

  const completedDocs = DOCUMENT_TYPES.filter(d => d.required).filter(d => getDocStatus(d.id) === 'complete').length
  const totalRequired = DOCUMENT_TYPES.filter(d => d.required).length

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mark user as having uploaded documents and persist metadata
    try {
      const u = localStorage.getItem('wisedrops_current_user')
      if (u) {
        const user = JSON.parse(u)
        user.hasUploadedDocuments = true
        localStorage.setItem('wisedrops_current_user', JSON.stringify(user))
      }
      // Persist document metadata (without the actual files)
      const docsSummary = Object.fromEntries(
        Object.entries(uploads).map(([docId, files]) => [
          docId,
          files.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size,
            type: f.type,
            uploadedAt: new Date().toISOString(),
          }))
        ])
      )
      localStorage.setItem('wisedrops_documents', JSON.stringify(docsSummary))

      // Notify the ANVISA admin queue that this patient uploaded docs
      if (user?.fullName) {
        markDocsUploaded(user.fullName)
      }
    } catch {}

    setSaving(false)
    setSaved(true)
  }

  const allRequiredUploaded = DOCUMENT_TYPES
    .filter(d => d.required)
    .every(d => getDocStatus(d.id) === 'complete')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">
          {consultationId ? 'Documentos Pos-Consulta' : 'Meus Documentos'}
        </h1>
        <p className="text-surface-500">
          {consultationId
            ? 'Envie seus documentos para que sua receita possa ser processada'
            : 'Envie os documentos necessarios para seu tratamento'}
        </p>
      </div>

      {/* Post-Consultation Banner */}
      {consultationId && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-green-50 border border-brand-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{'\u2705'}</span>
            <div>
              <p className="text-sm font-semibold text-brand-900 mb-1">Consulta concluida com sucesso!</p>
              <p className="text-sm text-brand-700">
                Agora precisamos dos seus documentos para finalizar sua receita digital e autorizacao ANVISA.
                Apos o upload, seu medico emite a prescricao e voce podera comprar os produtos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">{'\u2139\uFE0F'}</span>
          <div>
            <p className="text-sm font-medium text-orange-800 mb-1">Por que precisamos desses documentos?</p>
            <p className="text-sm text-orange-700">
              A ANVISA exige identifica&ccedil;&atilde;o e comprovante de resid&ecirc;ncia para autorizar a compra
              de produtos &agrave; base de cannabis medicinal. Seus documentos s&atilde;o protegidos pela LGPD
              e utilizados exclusivamente para fins regulat&oacute;rios.
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-surface-700">Progresso dos documentos</span>
          <span className="text-sm font-semibold text-brand-600">{completedDocs}/{totalRequired} obrigat&oacute;rios</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-100">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${totalRequired > 0 ? (completedDocs / totalRequired) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Document Upload Cards */}
      {DOCUMENT_TYPES.map((doc) => {
        const status = getDocStatus(doc.id)
        const files = uploads[doc.id] || []

        return (
          <div
            key={doc.id}
            className={`p-6 rounded-2xl bg-white border shadow-sm transition ${
              status === 'complete'
                ? 'border-brand-300 bg-brand-50/30'
                : status === 'error'
                ? 'border-red-300'
                : 'border-surface-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{doc.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-surface-900">{doc.title}</h3>
                    {doc.required && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold uppercase">
                        Obrigat&oacute;rio
                      </span>
                    )}
                    {!doc.required && (
                      <span className="px-2 py-0.5 rounded-full bg-surface-100 text-surface-500 text-[10px] font-semibold uppercase">
                        Opcional
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 mt-1">{doc.description}</p>
                </div>
              </div>
              {status === 'complete' && (
                <span className="flex items-center gap-1 text-sm font-medium text-brand-600">
                  <span>{'\u2705'}</span> Enviado
                </span>
              )}
            </div>

            {/* Upload Area */}
            {files.length < (doc.maxFiles || 1) && status !== 'complete' && (
              <div
                className="relative border-2 border-dashed border-surface-300 rounded-xl p-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition cursor-pointer"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleFileDrop(doc.id, e.dataTransfer.files)
                }}
                onClick={() => fileInputRefs.current[doc.id]?.click()}
              >
                <input
                  type="file"
                  ref={(el) => { fileInputRefs.current[doc.id] = el }}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  multiple={doc.maxFiles > 1}
                  onChange={(e) => handleFileDrop(doc.id, e.target.files)}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-2xl">{'\u{1F4CE}'}</span>
                  </div>
                  <p className="text-sm font-medium text-surface-700">
                    Arraste o arquivo aqui ou <span className="text-brand-600">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-surface-400">{doc.hint}</p>
                  <p className="text-xs text-surface-400">PDF, JPG ou PNG - M&aacute;ximo 10MB</p>
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200">
                    {/* Preview */}
                    {file.preview ? (
                      <img src={file.preview} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                        <span className="text-lg">{'\u{1F4C4}'}</span>
                      </div>
                    )}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{file.name}</p>
                      <p className="text-xs text-surface-400">{formatFileSize(file.size)}</p>

                      {/* Progress Bar */}
                      {file.status === 'uploading' && (
                        <div className="mt-1 w-full h-1.5 rounded-full bg-surface-200">
                          <div
                            className="h-1.5 rounded-full bg-brand-500 transition-all"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}

                      {file.status === 'error' && (
                        <p className="text-xs text-red-500 mt-1">Erro: arquivo inv&aacute;lido ou muito grande</p>
                      )}
                    </div>

                    {/* Status / Actions */}
                    <div className="flex items-center gap-2">
                      {file.status === 'uploaded' && (
                        <span className="text-brand-600 text-lg">{'\u2705'}</span>
                      )}
                      {file.status === 'uploading' && (
                        <span className="text-sm text-surface-400">{Math.round(file.progress)}%</span>
                      )}
                      <button
                        onClick={() => removeFile(doc.id, file.id)}
                        className="p-1 text-surface-400 hover:text-red-500 transition"
                        title="Remover"
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Save Button */}
      {saved ? (
        <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 text-center">
          <span className="text-3xl block mb-2">{'\u2705'}</span>
          <h3 className="font-heading font-semibold text-brand-800 mb-1">Documentos salvos com sucesso!</h3>
          <p className="text-sm text-brand-600 mb-4">Seus documentos est&atilde;o em an&aacute;lise. Voc&ecirc; ser&aacute; notificado quando forem aprovados.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div>
            <p className="text-sm text-surface-500">
              {allRequiredUploaded
                ? '\u2705 Todos os documentos obrigat\u00F3rios foram enviados'
                : `\u26A0\uFE0F Faltam ${totalRequired - completedDocs} documento(s) obrigat\u00F3rio(s)`}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!allRequiredUploaded || saving}
            className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
        </div>
      )}
    </div>
  )
}
