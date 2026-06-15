'use client'

import { useMemo, useRef, useState } from 'react'
import { trpc } from '@/lib/trpc'

interface DocTypeInfo {
  id: string
  title: string
  description: string
  icon: string
  required: boolean
  hint: string
}

const DOC_TYPES: DocTypeInfo[] = [
  {
    id: 'identity',
    title: 'Documento de Identidade',
    description: 'RG, CNH ou Passaporte (frente e verso).',
    icon: '🪪',
    required: true,
    hint: 'JPG, PNG ou PDF até 10 MB',
  },
  {
    id: 'address_proof',
    title: 'Comprovante de Residência',
    description: 'Conta de luz, água ou similar dos últimos 90 dias.',
    icon: '🏠',
    required: true,
    hint: 'Documento recente',
  },
  {
    id: 'anvisa_auth',
    title: 'Autorização ANVISA',
    description: 'Documento de autorização para importação (RDC 660), quando aplicável.',
    icon: '📋',
    required: false,
    hint: 'Apenas para produtos importados',
  },
  {
    id: 'medical_report',
    title: 'Laudos médicos',
    description: 'Laudos, atestados ou relatórios do seu histórico clínico.',
    icon: '🧾',
    required: false,
    hint: 'Quantos forem necessários',
  },
  {
    id: 'exam',
    title: 'Exames',
    description: 'Exames recentes (sangue, imagem, etc.) para o seu médico avaliar.',
    icon: '🔬',
    required: false,
    hint: 'Quantos forem necessários',
  },
]

interface Doc {
  id: string
  type: string
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string | Date
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PatientDocumentsPage() {
  const listQuery = trpc.document.listForPatient.useQuery({})
  const deleteMutation = trpc.document.delete.useMutation({
    onSuccess: () => listQuery.refetch(),
  })

  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const docsByType = useMemo(() => {
    const map: Record<string, Doc[]> = {}
    for (const d of (listQuery.data?.documents ?? []) as Doc[]) {
      ;(map[d.type] ||= []).push(d)
    }
    return map
  }, [listQuery.data])

  const handleChoose = (typeId: string) => {
    setErrorMsg(null)
    fileInputs.current[typeId]?.click()
  }

  const handleUpload = async (typeId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setUploadingType(typeId)
    setErrorMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', typeId)
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || `Erro ${res.status}`)
      }
      await listQuery.refetch()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar arquivo.')
    } finally {
      setUploadingType(null)
      if (fileInputs.current[typeId]) {
        fileInputs.current[typeId]!.value = ''
      }
    }
  }

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Apagar "${doc.fileName}"?`)) return
    try {
      await deleteMutation.mutateAsync({ id: doc.id })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao apagar')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Meus documentos</h1>
        <p className="text-sm text-surface-500">
          Envie os documentos necessários para o seu cadastro e para a autorização ANVISA. Os
          arquivos ficam acessíveis pra você, pro seu médico e pra equipe administrativa.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
          {errorMsg}
        </div>
      )}

      {listQuery.isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      )}

      <div className="space-y-4">
        {DOC_TYPES.map((t) => {
          const docs = docsByType[t.id] ?? []
          const isUploading = uploadingType === t.id
          return (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm"
            >
              <div className="flex items-start gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0 text-xl">
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-semibold text-surface-900">{t.title}</h2>
                    {t.required ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning-50 text-warning-700 border border-warning-600/30">
                        Obrigatório
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-100 text-surface-500 border border-surface-200">
                        Opcional
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 mt-0.5">{t.description}</p>
                  <p className="text-[11px] text-surface-400 mt-0.5">{t.hint}</p>
                </div>
                <div>
                  <input
                    ref={(el) => {
                      fileInputs.current[t.id] = el
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(t.id, e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => handleChoose(t.id)}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition disabled:opacity-50"
                  >
                    {isUploading ? 'Enviando...' : '+ Enviar arquivo'}
                  </button>
                </div>
              </div>

              {docs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-100 space-y-2">
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-surface-200 bg-surface-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">
                          {d.fileName}
                        </p>
                        <p className="text-[11px] text-surface-500">
                          {formatSize(d.sizeBytes)} ·{' '}
                          {new Date(d.uploadedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`/api/documents/${d.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-medium text-surface-700 hover:bg-white transition"
                        >
                          Ver
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(d)}
                          className="px-3 py-1.5 rounded-lg border border-error-600/30 text-xs font-medium text-error-600 hover:bg-error-50 transition"
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
