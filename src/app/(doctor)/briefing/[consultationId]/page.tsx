'use client'

/**
 * /briefing/[consultationId] — Briefing pré-consulta (PR 9).
 *
 * Tela ÚNICA do médico antes do atendimento. Substitui o ato de
 * abrir 3-4 telas pra montar o contexto da paciente.
 *
 * Conteúdo: paciente (idade, condições, alergias, medicações), quiz
 * mais recente, histórico de consultas, receitas anteriores, CTA pra
 * entrar na sala de vídeo.
 *
 * PHI: autorizado pelo regime art. 11 §2º, II LGPD (tratamento por
 * profissional de saúde). Posse validada no backend.
 */

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Video,
  FileText,
  AlertTriangle,
  Pill,
  ClipboardList,
  History,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
} from 'lucide-react'

function fmtDateTime(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
function fmtDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function BriefingPage() {
  const params = useParams<{ consultationId: string }>()
  const router = useRouter()
  const consultationId = params?.consultationId ?? ''
  const query = trpc.consultation.getBriefing.useQuery(
    { consultationId },
    { enabled: !!consultationId },
  )

  if (query.isLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton height="20px" width="180px" />
        <Card padding="lg">
          <div className="flex gap-4 items-start">
            <Skeleton circle width="80px" height="80px" />
            <div className="flex-1 space-y-2">
              <Skeleton height="28px" width="60%" />
              <Skeleton height="14px" width="40%" />
              <Skeleton height="60px" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Consulta não encontrada"
          description="Esta consulta não está disponível ou você não tem acesso a ela."
          action={
            <Button variant="secondary" onClick={() => router.push('/doctor-consultations')}>
              Voltar para consultas
            </Button>
          }
        />
      </div>
    )
  }

  const { consultation, patient, quiz, pastConsultations, prescriptions } = query.data

  const items = (val: unknown): string[] => (Array.isArray(val) ? val.map(String) : [])
  const answers = (quiz?.answers ?? {}) as Record<string, unknown>

  const canEnterRoom =
    consultation.status === 'SCHEDULED' ||
    consultation.status === 'WAITING_ROOM' ||
    consultation.status === 'IN_PROGRESS'

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href="/doctor-consultations"
        className="inline-flex items-center gap-1 text-small text-surface-600 hover:text-surface-900 transition"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para consultas
      </Link>

      {/* Header da paciente + CTA de entrar */}
      <Card padding="lg" variant="elevated">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <Avatar
            src={patient.avatarUrl ?? undefined}
            name={patient.fullName}
            size="xl"
            alt={`Foto de ${patient.fullName}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-overline uppercase tracking-widest text-brand-700 font-semibold">
              Briefing da consulta
            </p>
            <h1 className="mt-1 text-h1 font-heading font-bold text-surface-900">
              {patient.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-surface-600">
              {patient.age != null && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> {patient.age} anos
                </span>
              )}
              {patient.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {patient.email}
                </span>
              )}
              {patient.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {patient.phone}
                </span>
              )}
            </div>

            <div className="mt-4 p-4 rounded-md bg-surface-50 border border-surface-100">
              <p className="text-caption text-surface-500 uppercase tracking-wider">
                Consulta agendada
              </p>
              <p className="mt-1 text-h4 font-heading text-surface-900">
                {fmtDateTime(consultation.scheduledAt)}
                <span className="text-small text-surface-500 font-normal">
                  {' '}
                  · {consultation.durationMinutes ?? 30}min · vídeo
                </span>
              </p>
              {consultation.chiefComplaint && (
                <p className="mt-2 text-body text-surface-700">
                  <span className="text-caption text-surface-500 uppercase tracking-wider">
                    Queixa principal
                  </span>
                  <br />“{consultation.chiefComplaint}”
                </p>
              )}
            </div>
          </div>

          {canEnterRoom && (
            <div className="shrink-0 w-full lg:w-auto">
              <Link
                href={`/doctor-consultations/${consultation.id}/video`}
                className="block"
              >
                <Button variant="primary" size="lg" className="w-full lg:w-auto">
                  <Video className="h-4 w-4" />
                  Entrar na sala
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-heading font-semibold text-surface-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand-700" />
              Diagnóstico inicial
            </h2>
            {quiz && (
              <Badge variant="neutral" size="sm">
                {fmtDate(quiz.completedAt)}
              </Badge>
            )}
          </div>

          {!quiz && (
            <p className="text-small text-surface-500 italic">
              A paciente ainda não completou o quiz.
            </p>
          )}

          {quiz && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-surface-50 border border-surface-100">
                  <p className="text-caption text-surface-500 uppercase tracking-wider">
                    Prioridade
                  </p>
                  <p className="mt-1 text-body font-semibold text-surface-900 capitalize">
                    {quiz.riskLevel}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-surface-50 border border-surface-100">
                  <p className="text-caption text-surface-500 uppercase tracking-wider">
                    Condição prioritária
                  </p>
                  <p className="mt-1 text-body font-semibold text-surface-900">
                    {quiz.priorityCondition}
                  </p>
                </div>
              </div>

              {quiz.consultationFocus?.length > 0 && (
                <div>
                  <p className="text-caption text-surface-500 uppercase tracking-wider mb-2">
                    Foco da consulta
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quiz.consultationFocus.map((f: string) => (
                      <Badge key={f} variant="brand" size="sm">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {items(answers.conditions).length > 0 && (
                <div>
                  <p className="text-caption text-surface-500 uppercase tracking-wider mb-2">
                    Condições declaradas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items(answers.conditions).map((c) => (
                      <Badge key={c} variant="neutral" size="sm">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {Boolean(answers.severity) && (
                <div className="p-3 rounded-md bg-surface-50 border border-surface-100">
                  <p className="text-caption text-surface-500 uppercase tracking-wider">
                    Severidade
                  </p>
                  <p className="mt-1 text-body text-surface-700">{String(answers.severity)}</p>
                </div>
              )}

              {Boolean(answers.daily_impact) && (
                <div className="p-3 rounded-md bg-surface-50 border border-surface-100">
                  <p className="text-caption text-surface-500 uppercase tracking-wider">
                    Impacto no dia a dia
                  </p>
                  <p className="mt-1 text-body text-surface-700">
                    {String(answers.daily_impact)}
                  </p>
                </div>
              )}

              {quiz.personalizedMessage && (
                <div className="p-3 rounded-md bg-brand-50 border border-brand-200">
                  <p className="text-caption text-brand-700 uppercase tracking-wider">
                    Mensagem da paciente
                  </p>
                  <p className="mt-1 text-body text-surface-900 whitespace-pre-line">
                    {quiz.personalizedMessage}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Perfil clínico */}
        <Card padding="lg">
          <h2 className="text-h3 font-heading font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning-700" />
            Perfil clínico
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-caption text-surface-500 uppercase tracking-wider mb-2">
                Condições primárias
              </p>
              {patient.primaryConditions.length === 0 ? (
                <p className="text-small text-surface-500 italic">Nenhuma registrada</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {patient.primaryConditions.map((c) => (
                    <Badge key={c} variant="warning" size="sm">{c}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-caption text-surface-500 uppercase tracking-wider mb-2">
                Alergias
              </p>
              {patient.allergies.length === 0 ? (
                <p className="text-small text-surface-500 italic">Nenhuma registrada</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies.map((a) => (
                    <Badge key={a} variant="error" size="sm">{a}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-caption text-surface-500 uppercase tracking-wider mb-2">
                Medicações em uso
              </p>
              {patient.currentMedications.length === 0 ? (
                <p className="text-small text-surface-500 italic">Nenhuma registrada</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {patient.currentMedications.map((m) => (
                    <Badge key={m} variant="neutral" size="sm">{m}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Receitas anteriores */}
        <Card padding="lg">
          <h2 className="text-h3 font-heading font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <Pill className="h-5 w-5 text-sage-700" />
            Receitas anteriores
            <Badge variant="neutral" size="sm">{prescriptions.length}</Badge>
          </h2>

          {prescriptions.length === 0 ? (
            <p className="text-small text-surface-500 italic">
              Esta é a primeira receita pra esta paciente na plataforma.
            </p>
          ) : (
            <ul className="space-y-3">
              {prescriptions.map((p) => {
                const items = Array.isArray(p.items) ? (p.items as Array<Record<string, unknown>>) : []
                return (
                  <li
                    key={p.id}
                    className="p-3 rounded-md bg-surface-50 border border-surface-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-small font-medium text-surface-900">
                        {fmtDate(p.signedAt ?? p.validUntil)}
                      </p>
                      <Badge variant="neutral" size="sm">{p.prescriptionType}</Badge>
                    </div>
                    <p className="text-caption text-surface-500">por {p.doctorName}</p>
                    {items.length > 0 && (
                      <p className="mt-2 text-small text-surface-700">
                        {items
                          .slice(0, 2)
                          .map((it) => String(it.genericName ?? it.name ?? '—'))
                          .join(' · ')}
                        {items.length > 2 && ` · +${items.length - 2}`}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Histórico de consultas */}
        <Card padding="lg">
          <h2 className="text-h3 font-heading font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-surface-700" />
            Histórico de consultas
            <Badge variant="neutral" size="sm">{pastConsultations.length}</Badge>
          </h2>

          {pastConsultations.length === 0 ? (
            <p className="text-small text-surface-500 italic">
              Esta é a primeira consulta da paciente na plataforma.
            </p>
          ) : (
            <ul className="space-y-3">
              {pastConsultations.map((c) => (
                <li key={c.id} className="p-3 rounded-md bg-surface-50 border border-surface-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-small font-medium text-surface-900 inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {fmtDate(c.scheduledAt)}
                    </p>
                    <Badge variant="neutral" size="sm">{c.status}</Badge>
                  </div>
                  <p className="text-caption text-surface-500">
                    com {c.doctorName}
                    {c.durationMinutes && ` · ${c.durationMinutes}min`}
                  </p>
                  {c.consultationNotes && (
                    <p className="mt-2 text-small text-surface-700 line-clamp-2 italic">
                      “{c.consultationNotes}”
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
