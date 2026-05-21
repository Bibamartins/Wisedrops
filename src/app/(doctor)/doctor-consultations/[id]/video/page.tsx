'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { VideoRoom } from '@/components/video/video-room'
import { trpc } from '@/lib/trpc'

// Local, simpler shape derived from tRPC Consultation for this page
interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  doctorSpecialty?: string
  patientId: string
  patientName: string
  patientCondition?: string
  consultationKind: string
  type: 'video' | 'in_person'
  chiefComplaint?: string
  videoRoomUrl?: string
}

type PageState = 'loading' | 'pre-call' | 'in-call' | 'post-call' | 'error'

const CURRENT_DOCTOR_NAME = 'Dr. Carlos Oliveira'

// ============================================================
// Device Check
// ============================================================

function DeviceCheck({
  onJoin,
  appointment,
}: {
  onJoin: () => void
  appointment: Appointment
}) {
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
        try {
          const v = await navigator.mediaDevices.getUserMedia({ video: true })
          setHasCameraPermission(true)
          v.getTracks().forEach((t) => t.stop())
        } catch {
          setHasCameraPermission(false)
        }
        try {
          const a = await navigator.mediaDevices.getUserMedia({ audio: true })
          setHasMicPermission(true)
          a.getTracks().forEach((t) => t.stop())
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
        <div className="relative aspect-video bg-surface-800 rounded-t-2xl overflow-hidden">
          {previewStream ? (
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
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
          <div className="mb-2 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
              Portal Medico
            </span>
            <span className="text-xs text-surface-500">Consulta por video</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-surface-900 mb-1">
            {appointment.patientName}
          </h1>
          <p className="text-sm text-surface-500 mb-4">
            {appointment.consultationKind}
            {appointment.patientCondition && ` • ${appointment.patientCondition}`}
          </p>

          {appointment.chiefComplaint && (
            <div className="mb-4 p-3 rounded-xl bg-surface-50 border border-surface-200">
              <p className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">
                Queixa principal
              </p>
              <p className="text-sm text-surface-700">{appointment.chiefComplaint}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <DeviceStatusRow label="Camera" status={hasCameraPermission} />
            <DeviceStatusRow label="Microfone" status={hasMicPermission} />
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
            Iniciar consulta
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
// Post-Call Summary
// ============================================================

function PostCallSummary({ appointment }: { appointment: Appointment }) {
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
        <p className="text-sm text-surface-500 mb-6">
          Paciente: <strong>{appointment.patientName}</strong>
        </p>

        <div className="space-y-3">
          <Link
            href="/prescriptions/new"
            className="block w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition"
          >
            Emitir receita
          </Link>
          <button
            onClick={() => router.push('/schedule')}
            className="w-full py-3 rounded-xl border border-surface-200 text-surface-700 font-medium hover:bg-surface-50 transition"
          >
            Voltar para a agenda
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function DoctorVideoPage() {
  const params = useParams()
  const router = useRouter()
  const consultationId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [emrOpen, setEmrOpen] = useState(false)

  const consultationQuery = trpc.consultation.getById.useQuery(
    { id: consultationId },
    { enabled: !!consultationId }
  )
  const getVideoToken = trpc.consultation.getVideoToken.useMutation()
  const endConsultation = trpc.consultation.endConsultation.useMutation()
  const [videoToken, setVideoToken] = useState<string | null>(null)
  const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null)

  useEffect(() => {
    if (consultationQuery.isError) {
      setErrorMessage(consultationQuery.error.message)
      setPageState('error')
      return
    }
    const c = consultationQuery.data
    if (!c) return

    setAppointment({
      id: c.id,
      doctorId: c.doctorId,
      doctorName: c.doctor.user.fullName,
      doctorSpecialty: c.doctor.specialty?.[0],
      patientId: c.patient.userId,
      patientName: c.patient.user.fullName,
      patientCondition: undefined,
      consultationKind: 'Consulta',
      type: c.type === 'VIDEO' ? 'video' : 'in_person',
      chiefComplaint: c.chiefComplaint ?? undefined,
      videoRoomUrl: undefined, // filled on join
    })
    setPageState('pre-call')
  }, [consultationQuery.data, consultationQuery.isError, consultationQuery.error])

  const handleJoinCall = useCallback(async () => {
    try {
      const result = await getVideoToken.mutateAsync({ consultationId })
      setVideoToken(result.token)
      setVideoRoomUrl(result.roomUrl)
      setPageState('in-call')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar consulta'
      setErrorMessage(msg)
      setPageState('error')
    }
  }, [consultationId, getVideoToken])

  const handleCallEnd = useCallback(() => {
    setPageState('post-call')
    // Mark the consultation completed (idempotent + ownership-checked server-side)
    endConsultation.mutate({ id: consultationId })
  }, [consultationId, endConsultation])

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
            onClick={() => router.push('/schedule')}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
          >
            Voltar para a agenda
          </button>
        </div>
      </div>
    )
  }

  if (pageState === 'pre-call' && appointment) {
    return <DeviceCheck onJoin={handleJoinCall} appointment={appointment} />
  }

  if (pageState === 'post-call' && appointment) {
    return <PostCallSummary appointment={appointment} />
  }

  if (pageState === 'in-call' && appointment && videoRoomUrl && videoToken) {
    return (
      <div className="h-screen w-screen flex overflow-hidden">
        <div className="flex-1 h-full">
          <VideoRoom
            roomUrl={videoRoomUrl}
            token={videoToken}
            userName={`Dr(a). ${appointment.doctorName}`}
            isDoctor={true}
            consultationId={consultationId}
            onCallEnd={handleCallEnd}
          />
        </div>

        {/* Side EMR toggle - simple mock */}
        {!emrOpen && (
          <button
            onClick={() => setEmrOpen(true)}
            className="hidden lg:flex absolute top-4 right-16 z-30 items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition"
            title="Abrir prontuario"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Prontuario
          </button>
        )}

        {emrOpen && (
          <div className="hidden lg:flex h-full bg-white border-l border-surface-200 w-80 flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-surface-50">
              <h3 className="text-sm font-bold text-surface-800">Prontuario — {appointment.patientName}</h3>
              <button
                onClick={() => setEmrOpen(false)}
                className="p-1 text-surface-400 hover:text-surface-600 transition"
                aria-label="Fechar prontuario"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <section>
                <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                  Condicao
                </h4>
                <p className="text-sm text-surface-700">
                  {appointment.patientCondition ?? 'Nao informada'}
                </p>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                  Tipo de consulta
                </h4>
                <p className="text-sm text-surface-700">{appointment.consultationKind}</p>
              </section>

              {appointment.chiefComplaint && (
                <section>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                    Queixa principal
                  </h4>
                  <p className="text-sm text-surface-700">{appointment.chiefComplaint}</p>
                </section>
              )}

              <section>
                <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                  Acoes rapidas
                </h4>
                <div className="space-y-2">
                  <Link
                    href={`/patients`}
                    className="block w-full py-2 rounded-lg bg-surface-50 border border-surface-200 text-sm text-surface-700 hover:bg-surface-100 transition text-center"
                  >
                    Ver prontuario completo
                  </Link>
                  <Link
                    href={`/prescriptions/new`}
                    className="block w-full py-2 rounded-lg bg-brand-50 border border-brand-200 text-sm text-brand-700 hover:bg-brand-100 transition text-center"
                  >
                    Emitir receita
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
