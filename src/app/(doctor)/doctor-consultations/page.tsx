'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

// ─── Helpers ──────────────────────────────────────────────────────
type TabKey = 'hoje' | 'proximas' | 'passadas'

const STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  SCHEDULED:    { label: 'Agendada',     classes: 'bg-surface-100 text-surface-600' },
  WAITING_ROOM: { label: 'Sala de Espera', classes: 'bg-accent-50 text-accent-700' },
  IN_PROGRESS: { label: 'Em Andamento',  classes: 'bg-blue-50 text-blue-700' },
  COMPLETED:    { label: 'Concluída',    classes: 'bg-sage-50 text-sage-700' },
  CANCELLED:    { label: 'Cancelada',    classes: 'bg-red-50 text-red-700' },
  NO_SHOW:      { label: 'Não compareceu', classes: 'bg-surface-100 text-surface-500' },
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const fmtDate = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ─── Quiz Modal ───────────────────────────────────────────────────
function QuizModal({ patientId, patientName, onClose }: { patientId: string; patientName: string; onClose: () => void }) {
  const { data, isLoading, error } = trpc.quiz.getForPatient.useQuery({ patientId }, { enabled: !!patientId })
  const quiz = Array.isArray(data) ? data[0] : null

  const answers = (quiz?.answers ?? {}) as Record<string, unknown>
  const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])

  return (
    <div className="fixed inset-0 z-50 bg-surface-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-surface-200 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-surface-900">Respostas do quiz</h2>
            <p className="text-sm text-surface-500">{patientName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-100 transition flex items-center justify-center" aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {isLoading && <p className="text-sm text-surface-500">Carregando…</p>}
          {error && <p className="text-sm text-red-600">Erro ao carregar quiz: {error.message}</p>}
          {!isLoading && !error && !quiz && (
            <p className="text-sm text-surface-500 italic">Esta paciente ainda não completou o quiz.</p>
          )}

          {quiz && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface-50 border border-surface-200">
                  <p className="text-xs text-surface-500">Prioridade</p>
                  <p className="font-medium text-surface-900 capitalize">{quiz.riskLevel}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-50 border border-surface-200">
                  <p className="text-xs text-surface-500">Condição prioritária</p>
                  <p className="font-medium text-surface-900">{quiz.priorityCondition}</p>
                </div>
              </div>

              {quiz.recommendedSpecialties?.length > 0 && (
                <div>
                  <p className="text-xs text-surface-500 mb-2">Especialidades recomendadas</p>
                  <div className="flex flex-wrap gap-2">
                    {quiz.recommendedSpecialties.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {quiz.consultationFocus?.length > 0 && (
                <div>
                  <p className="text-xs text-surface-500 mb-2">Foco da consulta</p>
                  <div className="flex flex-wrap gap-2">
                    {quiz.consultationFocus.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-sage-50 text-sage-700 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {list(answers.conditions).length > 0 && (
                <div>
                  <p className="text-xs text-surface-500 mb-2">Condições declaradas</p>
                  <div className="flex flex-wrap gap-2">
                    {list(answers.conditions).map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded-full bg-surface-100 text-surface-700 text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {answers.severity && (
                <div className="p-3 rounded-lg bg-surface-50 border border-surface-200">
                  <p className="text-xs text-surface-500">Severidade</p>
                  <p className="text-sm text-surface-900">{String(answers.severity)}</p>
                </div>
              )}

              {answers.daily_impact && (
                <div className="p-3 rounded-lg bg-surface-50 border border-surface-200">
                  <p className="text-xs text-surface-500">Impacto no dia a dia</p>
                  <p className="text-sm text-surface-900">{String(answers.daily_impact)}</p>
                </div>
              )}

              {quiz.personalizedMessage && (
                <div className="p-3 rounded-lg bg-brand-50 border border-brand-200">
                  <p className="text-xs text-brand-600 mb-1">Mensagem personalizada</p>
                  <p className="text-sm text-surface-900 whitespace-pre-line">{quiz.personalizedMessage}</p>
                </div>
              )}

              {quiz.suggestedProducts?.length > 0 && (
                <div>
                  <p className="text-xs text-surface-500 mb-2">Produtos sugeridos</p>
                  <div className="flex flex-wrap gap-2">
                    {quiz.suggestedProducts.map((p: string) => (
                      <span key={p} className="px-2.5 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-surface-100">
                <details className="text-sm">
                  <summary className="cursor-pointer text-surface-500 hover:text-surface-700">Respostas brutas (JSON)</summary>
                  <pre className="mt-2 p-3 bg-surface-50 rounded-lg text-xs overflow-x-auto">{JSON.stringify(answers, null, 2)}</pre>
                </details>
              </div>

              <p className="text-xs text-surface-400 pt-2">
                Quiz concluído em {fmtDate(new Date(quiz.completedAt))} às {fmtTime(new Date(quiz.completedAt))}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────
export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('hoje')
  const [quizFor, setQuizFor] = useState<{ patientId: string; name: string } | null>(null)

  const { data, isLoading, error } = trpc.consultation.listForDoctor.useQuery({ page: 1, limit: 50 })
  const consultations = data?.consultations ?? []

  const now = new Date()
  const today = useMemo(() => consultations.filter((c) => isSameDay(new Date(c.scheduledAt), now)), [consultations])
  const upcoming = useMemo(
    () =>
      consultations
        .filter((c) => new Date(c.scheduledAt) > now && !isSameDay(new Date(c.scheduledAt), now))
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [consultations],
  )
  const past = useMemo(
    () =>
      consultations
        .filter((c) => new Date(c.scheduledAt) < now && !isSameDay(new Date(c.scheduledAt), now))
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [consultations],
  )

  const waitingCount = today.filter((c) => c.status === 'WAITING_ROOM').length
  const inProgressCount = today.filter((c) => c.status === 'IN_PROGRESS').length
  const completedTodayCount = today.filter((c) => c.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Consultas</h1>
        <p className="text-surface-500">{fmtDate(now)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-accent-500">{waitingCount}</p>
          <p className="text-xs text-surface-500">Sala de Espera</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-blue-600">{inProgressCount}</p>
          <p className="text-xs text-surface-500">Em Andamento</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-sage-600">{completedTodayCount}</p>
          <p className="text-xs text-surface-500">Concluídas Hoje</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-surface-900">{today.length}</p>
          <p className="text-xs text-surface-500">Total Hoje</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1">
          {([
            { key: 'hoje' as TabKey, label: `Hoje (${today.length})` },
            { key: 'proximas' as TabKey, label: `Próximas (${upcoming.length})` },
            { key: 'passadas' as TabKey, label: `Passadas (${past.length})` },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-surface-500 hover:text-surface-900 hover:border-surface-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* States */}
      {isLoading && <p className="text-sm text-surface-500">Carregando consultas…</p>}
      {error && <p className="text-sm text-red-600">Erro: {error.message}</p>}

      {/* Lists */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {(activeTab === 'hoje' ? today : activeTab === 'proximas' ? upcoming : past).length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-dashed border-surface-200 text-center">
              <p className="text-sm text-surface-500">
                {activeTab === 'hoje'
                  ? 'Nenhuma consulta agendada para hoje.'
                  : activeTab === 'proximas'
                  ? 'Nenhuma consulta futura agendada.'
                  : 'Sem consultas passadas registradas.'}
              </p>
            </div>
          ) : (
            (activeTab === 'hoje' ? today : activeTab === 'proximas' ? upcoming : past).map((c) => {
              const dt = new Date(c.scheduledAt)
              const patientName = c.patient.user.fullName
              const patientId = c.patient.id
              const st = STATUS_LABEL[c.status] ?? { label: c.status, classes: 'bg-surface-100 text-surface-600' }
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="text-center min-w-[70px]">
                    <p className="text-lg font-bold text-surface-900">{fmtTime(dt)}</p>
                    <p className="text-xs text-surface-400">{fmtDate(dt)}</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/patients/${patientId}`} className="font-medium text-surface-900 hover:text-brand-600 transition">
                        {patientName}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.classes}`}>{st.label}</span>
                      {c.chiefComplaint && <span className="text-sm text-surface-500">· {c.chiefComplaint}</span>}
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">{c.type === 'VIDEO' ? 'Vídeo' : c.type} · {c.durationMinutes ?? 30}min</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setQuizFor({ patientId, name: patientName })}
                      className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition"
                    >
                      Ver respostas do quiz
                    </button>
                    {(c.status === 'SCHEDULED' || c.status === 'WAITING_ROOM') && (
                      <Link
                        href={`/consultations/${c.id}/room`}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition"
                      >
                        Entrar na sala
                      </Link>
                    )}
                    {c.status === 'IN_PROGRESS' && (
                      <Link
                        href={`/prescriptions/new?consultation=${c.id}`}
                        className="px-3 py-1.5 rounded-lg bg-sage-600 text-white text-xs font-medium hover:bg-sage-700 transition"
                      >
                        Gerar receita
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Quiz Modal */}
      {quizFor && (
        <QuizModal patientId={quizFor.patientId} patientName={quizFor.name} onClose={() => setQuizFor(null)} />
      )}
    </div>
  )
}
