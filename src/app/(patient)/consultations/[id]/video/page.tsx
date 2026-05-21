'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VideoRoom } from '@/components/video/video-room'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/lib/use-auth'

// ============================================================
// Types
// ============================================================

interface ConsultationData {
  id: string
  doctorName: string
  doctorSpecialty: string[]
  patientName: string
  chiefComplaint: string | null
  scheduledAt: string
  status: string
  videoRoomUrl: string | null
  videoToken: string | null
  isDoctor: boolean
}

interface PatientEMRSummary {
  allergies: string[]
  currentMedications: string[]
  primaryConditions: string[]
  recentRecords: Array<{
    id: string
    recordType: string
    createdAt: string
    narrativeNote: string | null
  }>
}

type PageState = 'loading' | 'pre-call' | 'in-call' | 'post-call' | 'error'

// ============================================================
// Device Check Component
// ============================================================

interface DeviceCheckProps {
  onJoin: () => void
  consultation: ConsultationData
}

function DeviceCheck({ onJoin, consultation }: DeviceCheckProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function checkPermissions() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setHasCameraPermission(true)
        setHasMicPermission(true)
        setPreviewStream(stream)
      } catch {
        // Try individually
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
          setHasCameraPermission(true)
          videoStream.getTracks().forEach((t) => t.stop())
        } catch {
          setHasCameraPermission(false)
        }
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          setHasMicPermission(true)
          audioStream.getTracks().forEach((t) => t.stop())
        } catch {
          setHasMicPermission(false)
        }
      }
    }

    checkPermissions()

    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (videoRef && previewStream) {
      videoRef.srcObject = previewStream
    }
  }, [videoRef, previewStream])

  const canJoin = hasCameraPermission !== false && hasMicPermission !== false

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-surface-200 max-w-lg w-full overflow-hidden">
        {/* Preview */}
        <div className="relative aspect-video bg-surface-800 rounded-t-2xl overflow-hidden">
          {previewStream ? (
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-surface-700 flex items-center justify-center">
                <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Consultation info */}
          <h1 className="text-xl font-heading font-bold text-surface-900 mb-1">
            Consulta por video
          </h1>
          <p className="text-sm text-surface-500 mb-6">
            {consultation.isDoctor
              ? `Paciente: ${consultation.patientName}`
              : `Dr(a). ${consultation.doctorName}`}
            {consultation.chiefComplaint && ` - ${consultation.chiefComplaint}`}
          </p>

          {/* Device status */}
          <div className="space-y-3 mb-6">
            <DeviceStatusRow
              label="Camera"
              status={hasCameraPermission}
            />
            <DeviceStatusRow
              label="Microfone"
              status={hasMicPermission}
            />
          </div>

          {!canJoin && (
            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 mb-4">
              <p className="text-xs text-yellow-800">
                Permita o acesso a camera e microfone nas configuracoes do seu navegador para participar da consulta.
              </p>
            </div>
          )}

          <button
            onClick={onJoin}
            disabled={!canJoin}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Entrar na consulta
          </button>
        </div>
      </div>
    </div>
  )
}

function DeviceStatusRow({ label, status }: { label: string; status: boolean | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-surface-700">{label}</span>
      {status === null ? (
        <span className="text-xs text-surface-400">Verificando...</span>
      ) : status ? (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Funcionando
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sem acesso
        </span>
      )}
    </div>
  )
}

// ============================================================
// EMR Sidebar (Doctor Only)
// ============================================================

interface EMRSidebarProps {
  consultationId: string
  patientSummary: PatientEMRSummary | null
  onClose: () => void
}

function EMRSidebar({ consultationId, patientSummary, onClose }: EMRSidebarProps) {
  if (!patientSummary) {
    return (
      <div className="h-full bg-white border-l border-surface-200 w-80 p-4 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full bg-white border-l border-surface-200 w-80 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-surface-50">
        <h3 className="text-sm font-bold text-surface-800">Prontuario do Paciente</h3>
        <button
          onClick={onClose}
          className="p-1 text-surface-400 hover:text-surface-600 transition"
          aria-label="Fechar prontuario"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Allergies */}
        <section>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Alergias
          </h4>
          {patientSummary.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {patientSummary.allergies.map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs text-red-700"
                >
                  {a}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-surface-400">Nenhuma alergia registrada</p>
          )}
        </section>

        {/* Current Medications */}
        <section>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Medicamentos atuais
          </h4>
          {patientSummary.currentMedications.length > 0 ? (
            <ul className="space-y-1">
              {patientSummary.currentMedications.map((med) => (
                <li key={med} className="text-xs text-surface-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" />
                  {med}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-surface-400">Nenhum medicamento registrado</p>
          )}
        </section>

        {/* Conditions */}
        <section>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Condicoes primarias
          </h4>
          {patientSummary.primaryConditions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {patientSummary.primaryConditions.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-xs text-brand-700"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-surface-400">Nenhuma condicao registrada</p>
          )}
        </section>

        {/* Recent Records */}
        <section>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Registros recentes
          </h4>
          {patientSummary.recentRecords.length > 0 ? (
            <div className="space-y-2">
              {patientSummary.recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-2 rounded-lg bg-surface-50 border border-surface-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-surface-500 uppercase">
                      {record.recordType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-surface-400">
                      {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {record.narrativeNote && (
                    <p className="text-xs text-surface-600 line-clamp-3">
                      {record.narrativeNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-surface-400">Nenhum registro encontrado</p>
          )}
        </section>
      </div>
    </div>
  )
}

// ============================================================
// Post-Call Summary
// ============================================================

interface PostCallProps {
  consultation: ConsultationData
  duration: string
}

function PostCallSummary({ consultation, duration }: PostCallProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-surface-200 max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-xl font-heading font-bold text-surface-900 mb-2">
          Consulta encerrada
        </h1>
        <p className="text-sm text-surface-500 mb-1">
          {consultation.isDoctor
            ? `Paciente: ${consultation.patientName}`
            : `Dr(a). ${consultation.doctorName}`}
        </p>
        <p className="text-sm text-surface-400 mb-6">
          Duracao: {duration}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/consultations/${consultation.id}`)}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
          >
            Ver detalhes da consulta
          </button>
          <button
            onClick={() => router.push('/consultations')}
            className="w-full py-3 rounded-xl border border-surface-200 text-surface-700 font-medium hover:bg-surface-50 transition"
          >
            Voltar para consultas
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

export default function VideoConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const consultationId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [consultation, setConsultation] = useState<ConsultationData | null>(null)
  const [patientSummary, setPatientSummary] = useState<PatientEMRSummary | null>(null)
  const [emrSidebarOpen, setEmrSidebarOpen] = useState(false)
  const [callDuration, setCallDuration] = useState('00:00')
  const [errorMessage, setErrorMessage] = useState('')

  const { user } = useAuth()
  const consultationQuery = trpc.consultation.getById.useQuery(
    { id: consultationId },
    { enabled: !!consultationId && !!user }
  )
  const getVideoToken = trpc.consultation.getVideoToken.useMutation()
  const endConsultation = trpc.consultation.endConsultation.useMutation()

  // Populate `consultation` state from tRPC query (without token yet)
  useEffect(() => {
    if (consultationQuery.isError) {
      setErrorMessage(consultationQuery.error.message)
      setPageState('error')
      return
    }
    if (!consultationQuery.data) return

    const c = consultationQuery.data
    const scheduledAt = c.scheduledAt instanceof Date
      ? c.scheduledAt.toISOString()
      : new Date(c.scheduledAt).toISOString()

    setConsultation({
      id: c.id,
      doctorName: c.doctor.user.fullName,
      doctorSpecialty: c.doctor.specialty ?? [],
      patientName: c.patient.user.fullName,
      chiefComplaint: c.chiefComplaint ?? null,
      scheduledAt,
      status: c.status,
      videoRoomUrl: null, // filled on join
      videoToken: null,
      isDoctor: user?.role === 'DOCTOR',
    })
    setPageState('pre-call')
  }, [consultationQuery.data, consultationQuery.isError, consultationQuery.error, user])

  const handleJoinCall = useCallback(async () => {
    try {
      const result = await getVideoToken.mutateAsync({ consultationId })
      setConsultation((prev) =>
        prev ? { ...prev, videoRoomUrl: result.roomUrl, videoToken: result.token } : prev
      )
      setPageState('in-call')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar na consulta'
      setErrorMessage(msg)
      setPageState('error')
    }
  }, [consultationId, getVideoToken])

  const handleCallEnd = useCallback(() => {
    setPageState('post-call')
    // Mark the consultation completed (idempotent + ownership-checked server-side)
    endConsultation.mutate({ id: consultationId })
  }, [consultationId, endConsultation])

  // -------- Loading --------

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
          <p className="text-sm text-surface-500">Carregando consulta...</p>
        </div>
      </div>
    )
  }

  // -------- Error --------

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-surface-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-surface-900 mb-2">
            Nao foi possivel carregar a consulta
          </h1>
          <p className="text-sm text-surface-500 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push('/consultations')}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
          >
            Voltar para consultas
          </button>
        </div>
      </div>
    )
  }

  // -------- Pre-call device check --------

  if (pageState === 'pre-call' && consultation) {
    return <DeviceCheck onJoin={handleJoinCall} consultation={consultation} />
  }

  // -------- Post-call summary --------

  if (pageState === 'post-call' && consultation) {
    return <PostCallSummary consultation={consultation} duration={callDuration} />
  }

  // -------- In-call --------

  if (pageState === 'in-call' && consultation?.videoRoomUrl && consultation?.videoToken) {
    return (
      <div className="h-screen w-screen flex overflow-hidden">
        {/* Video Room */}
        <div className="flex-1 h-full">
          <VideoRoom
            roomUrl={consultation.videoRoomUrl}
            token={consultation.videoToken}
            userName={consultation.isDoctor ? `Dr(a). ${consultation.doctorName}` : consultation.patientName}
            isDoctor={consultation.isDoctor}
            consultationId={consultationId}
            onCallEnd={handleCallEnd}
          />
        </div>

        {/* EMR Sidebar toggle (doctor only) */}
        {consultation.isDoctor && !emrSidebarOpen && (
          <button
            onClick={() => setEmrSidebarOpen(true)}
            className="hidden lg:flex absolute top-4 right-16 z-30 items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition"
            title="Abrir prontuario"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Prontuario
          </button>
        )}

        {/* EMR Sidebar (doctor only, desktop) */}
        {consultation.isDoctor && emrSidebarOpen && (
          <div className="hidden lg:block h-full">
            <EMRSidebar
              consultationId={consultationId}
              patientSummary={patientSummary}
              onClose={() => setEmrSidebarOpen(false)}
            />
          </div>
        )}
      </div>
    )
  }

  return null
}
