'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import DailyIframe from '@daily-co/daily-js'
import {
  DailyProvider,
  useDaily,
  useLocalParticipant,
  useParticipantIds,
  useDailyEvent,
  useVideoTrack,
  useAudioTrack,
  DailyVideo,
  DailyAudio,
} from '@daily-co/daily-react'
import { VideoControls, ConnectionIndicator, type ConnectionQuality } from './video-controls'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

interface VideoRoomProps {
  roomUrl: string
  token: string
  userName: string
  isDoctor: boolean
  consultationId: string
  onCallEnd: () => void
  recordingConsent?: boolean
}

interface ChatMessage {
  id: string
  sender: string
  senderId: string
  content: string
  timestamp: Date
}

type RoomState = 'joining' | 'waiting' | 'in-call' | 'error' | 'left'

// ============================================================
// Chat Panel
// ============================================================

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (content: string) => void
  onClose: () => void
  currentUserId: string
}

function ChatPanel({ messages, onSendMessage, onClose, currentUserId }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xl border border-surface-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
        <h3 className="text-sm font-semibold text-surface-800">Chat da consulta</h3>
        <button
          onClick={onClose}
          className="p-1 text-surface-400 hover:text-surface-600 transition"
          aria-label="Fechar chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-surface-400 mt-8">
            Nenhuma mensagem ainda. Inicie a conversa!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId
          return (
            <div
              key={msg.id}
              className={cn('flex flex-col max-w-[85%]', isOwn ? 'ml-auto items-end' : 'items-start')}
            >
              <span className="text-[10px] text-surface-400 mb-0.5 px-1">
                {msg.sender}
              </span>
              <div
                className={cn(
                  'px-3 py-2 rounded-xl text-sm break-words',
                  isOwn
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-surface-100 text-surface-800 rounded-bl-sm'
                )}
              >
                {msg.content}
              </div>
              <span className="text-[9px] text-surface-300 mt-0.5 px-1">
                {msg.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Enviar mensagem"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Waiting Room State
// ============================================================

interface WaitingRoomProps {
  doctorName?: string
}

function WaitingRoom({ doctorName }: WaitingRoomProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-surface-50 to-brand-50 p-8">
      <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mb-6 animate-pulse">
        <svg className="w-10 h-10 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <h2 className="text-xl font-heading font-bold text-surface-900 mb-2 text-center">
        Sala de espera
      </h2>
      <p className="text-surface-500 text-center max-w-sm">
        {doctorName
          ? `Aguardando ${doctorName} iniciar a consulta...`
          : 'Aguardando o medico entrar na sala...'}
      </p>
      <div className="mt-8 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <div className="mt-8 p-4 rounded-xl bg-white/80 border border-surface-200 max-w-sm text-center">
        <p className="text-xs text-surface-500">
          Verifique se sua camera e microfone estao funcionando. A consulta iniciara
          automaticamente quando o medico entrar.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Participant Video Tile
// ============================================================

interface VideoTileProps {
  sessionId: string
  isLocal?: boolean
  isLarge?: boolean
  userName?: string
}

function VideoTile({ sessionId, isLocal = false, isLarge = false, userName }: VideoTileProps) {
  const videoTrack = useVideoTrack(sessionId)
  const audioTrack = useAudioTrack(sessionId)

  const isVideoOff = videoTrack.isOff

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-surface-800',
        isLarge ? 'w-full h-full' : 'w-36 h-28 lg:w-48 lg:h-36',
        isLocal && !isLarge && 'shadow-lg ring-2 ring-white/20'
      )}
    >
      {isVideoOff ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-700">
          <div className="w-16 h-16 rounded-full bg-surface-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {(userName ?? 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          {userName && (
            <span className="mt-2 text-xs text-white/70">{userName}</span>
          )}
        </div>
      ) : (
        <DailyVideo
          sessionId={sessionId}
          mirror={isLocal}
          type={isLocal ? 'video' : 'video'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
        {audioTrack.isOff && (
          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12" />
          </svg>
        )}
        <span className="text-xs text-white font-medium truncate max-w-[120px]">
          {userName ?? (isLocal ? 'Voce' : 'Participante')}
          {isLocal && ' (Voce)'}
        </span>
      </div>
    </div>
  )
}

// ============================================================
// Recording Consent Dialog
// ============================================================

interface RecordingConsentProps {
  onAccept: () => void
  onDecline: () => void
}

function RecordingConsentDialog({ onAccept, onDecline }: RecordingConsentProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-surface-900">
            Consentimento de gravacao
          </h3>
        </div>
        <p className="text-sm text-surface-600 mb-2">
          O medico solicitou a gravacao desta consulta. A gravacao pode ser usada para:
        </p>
        <ul className="text-sm text-surface-600 mb-6 list-disc pl-5 space-y-1">
          <li>Revisao do seu prontuario medico</li>
          <li>Documentacao clinica</li>
          <li>Acompanhamento do tratamento</li>
        </ul>
        <p className="text-xs text-surface-400 mb-6">
          A gravacao sera armazenada de forma segura e acessivel apenas ao seu medico e a voce.
          Voce pode solicitar a exclusao a qualquer momento.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition"
          >
            Recusar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
          >
            Autorizar gravacao
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Inner Room Component (must be wrapped in DailyProvider)
// ============================================================

interface InnerRoomProps {
  isDoctor: boolean
  consultationId: string
  userName: string
  onCallEnd: () => void
  recordingConsent?: boolean
}

function InnerRoom({
  isDoctor,
  consultationId,
  userName,
  onCallEnd,
  recordingConsent = false,
}: InnerRoomProps) {
  const daily = useDaily()
  const localParticipant = useLocalParticipant()
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' })

  const [roomState, setRoomState] = useState<RoomState>('joining')
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showRecordingConsent, setShowRecordingConsent] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('unknown')
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [callDuration, setCallDuration] = useState('00:00')
  const [errorMessage, setErrorMessage] = useState('')

  // Duration timer
  useEffect(() => {
    if (!callStartTime) return
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime.getTime()) / 1000)
      const hours = Math.floor(elapsed / 3600)
      const minutes = Math.floor((elapsed % 3600) / 60)
      const seconds = elapsed % 60
      const pad = (n: number) => n.toString().padStart(2, '0')
      setCallDuration(
        hours > 0
          ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
          : `${pad(minutes)}:${pad(seconds)}`
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [callStartTime])

  // Handle joining
  useDailyEvent('joined-meeting', () => {
    if (isDoctor) {
      setRoomState('in-call')
      setCallStartTime(new Date())
    } else {
      // Patient waits for doctor
      if (remoteParticipantIds.length > 0) {
        setRoomState('in-call')
        setCallStartTime(new Date())
      } else {
        setRoomState('waiting')
      }
    }
  })

  // Handle remote participant joining
  useDailyEvent('participant-joined', () => {
    if (roomState === 'waiting') {
      setRoomState('in-call')
      setCallStartTime(new Date())
    }
  })

  // Handle participant leaving
  useDailyEvent('participant-left', (event) => {
    if (event && 'participant' in event) {
      // If doctor leaves and we're patient, show waiting room again
      if (!isDoctor && remoteParticipantIds.length === 0) {
        setRoomState('waiting')
      }
    }
  })

  // Error handling
  useDailyEvent('error', (event) => {
    console.error('[VideoRoom] Daily error:', event)
    setRoomState('error')
    setErrorMessage(
      (event as { errorMsg?: string })?.errorMsg ?? 'Erro de conexao com a sala de video'
    )
  })

  // Left meeting
  useDailyEvent('left-meeting', () => {
    setRoomState('left')
    onCallEnd()
  })

  // Chat messages via app-message
  useDailyEvent('app-message', (event) => {
    if (!event) return
    const data = event as {
      data?: { type?: string; content?: string; sender?: string; senderId?: string }
      fromId?: string
    }
    if (data.data?.type === 'chat') {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          sender: data.data?.sender ?? 'Participante',
          senderId: data.data?.senderId ?? data.fromId ?? '',
          content: data.data?.content ?? '',
          timestamp: new Date(),
        },
      ])
    }
    // Handle recording consent request
    if (data.data?.type === 'recording-consent-request' && !isDoctor) {
      setShowRecordingConsent(true)
    }
    // Handle recording consent response
    if (data.data?.type === 'recording-consent-response' && isDoctor) {
      if (data.data?.content === 'accepted') {
        daily?.startRecording()
        setIsRecording(true)
      }
    }
  })

  // Recording state
  useDailyEvent('recording-started', () => setIsRecording(true))
  useDailyEvent('recording-stopped', () => setIsRecording(false))

  // Network quality
  useDailyEvent('network-quality-change', (event) => {
    const qualityEvent = event as { threshold?: string } | undefined
    const threshold = qualityEvent?.threshold
    if (threshold === 'good') setConnectionQuality('good')
    else if (threshold === 'low') setConnectionQuality('low')
    else if (threshold === 'very-low') setConnectionQuality('very-low')
    else setConnectionQuality('unknown')
  })

  const sendChatMessage = useCallback(
    (content: string) => {
      if (!daily || !localParticipant) return
      const messageData = {
        type: 'chat',
        content,
        sender: userName,
        senderId: localParticipant.session_id,
      }
      daily.sendAppMessage(messageData, '*')
      // Add own message locally
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-local`,
          sender: userName,
          senderId: localParticipant.session_id,
          content,
          timestamp: new Date(),
        },
      ])
    },
    [daily, localParticipant, userName]
  )

  const handleEndCall = useCallback(() => {
    daily?.leave()
  }, [daily])

  const handleToggleRecording = useCallback(() => {
    if (!daily) return
    if (isRecording) {
      daily.stopRecording()
      setIsRecording(false)
    } else {
      // Doctor must request consent from patient first
      if (isDoctor) {
        daily.sendAppMessage({ type: 'recording-consent-request' }, '*')
      }
    }
  }, [daily, isRecording, isDoctor])

  const handleRecordingConsentAccept = useCallback(() => {
    setShowRecordingConsent(false)
    daily?.sendAppMessage(
      { type: 'recording-consent-response', content: 'accepted' },
      '*'
    )
  }, [daily])

  const handleRecordingConsentDecline = useCallback(() => {
    setShowRecordingConsent(false)
    daily?.sendAppMessage(
      { type: 'recording-consent-response', content: 'declined' },
      '*'
    )
  }, [daily])

  // -------- Render states --------

  if (roomState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface-50 p-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-surface-900 mb-2">Erro na conexao</h2>
        <p className="text-sm text-surface-500 mb-6 text-center max-w-sm">{errorMessage}</p>
        <button
          onClick={onCallEnd}
          className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
        >
          Voltar
        </button>
      </div>
    )
  }

  if (roomState === 'left') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface-50 p-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-surface-900 mb-2">Consulta encerrada</h2>
        <p className="text-sm text-surface-500 mb-2">
          Duracao: {callDuration}
        </p>
        <button
          onClick={onCallEnd}
          className="mt-4 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
        >
          Voltar para consultas
        </button>
      </div>
    )
  }

  if (roomState === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface-50 p-8">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mb-4" />
        <p className="text-sm text-surface-500">Conectando a sala de video...</p>
      </div>
    )
  }

  if (roomState === 'waiting') {
    return <WaitingRoom />
  }

  // -------- In-call layout --------

  const remoteId = remoteParticipantIds[0]

  return (
    <div className="relative flex flex-col h-full bg-surface-900">
      {/* Recording consent dialog */}
      {showRecordingConsent && (
        <RecordingConsentDialog
          onAccept={handleRecordingConsentAccept}
          onDecline={handleRecordingConsentDecline}
        />
      )}

      {/* Recording indicator (top bar) */}
      {isRecording && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs text-white font-medium">Gravando</span>
        </div>
      )}

      {/* Connection quality (top right) */}
      <div className="absolute top-4 right-4 z-20">
        <ConnectionIndicator quality={connectionQuality} />
      </div>

      {/* Video area */}
      <div className="flex-1 relative flex">
        {/* Main video area + optional chat */}
        <div className={cn('flex-1 relative', chatOpen && 'lg:mr-80')}>
          {/* Remote video (large) */}
          <div className="absolute inset-0">
            {remoteId ? (
              <VideoTile sessionId={remoteId} isLarge />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-800">
                <p className="text-surface-400">Aguardando participante...</p>
              </div>
            )}
          </div>

          {/* Local video (PiP) */}
          {localParticipant && (
            <div className="absolute top-4 left-4 z-10">
              <VideoTile
                sessionId={localParticipant.session_id}
                isLocal
                userName={userName}
              />
            </div>
          )}
        </div>

        {/* Chat panel (side panel on desktop, overlay on mobile) */}
        {chatOpen && (
          <>
            {/* Desktop: side panel */}
            <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-80 z-30 p-2">
              <ChatPanel
                messages={messages}
                onSendMessage={sendChatMessage}
                onClose={() => setChatOpen(false)}
                currentUserId={localParticipant?.session_id ?? ''}
              />
            </div>
            {/* Mobile: overlay */}
            <div className="lg:hidden absolute inset-0 z-30 p-2">
              <ChatPanel
                messages={messages}
                onSendMessage={sendChatMessage}
                onClose={() => setChatOpen(false)}
                currentUserId={localParticipant?.session_id ?? ''}
              />
            </div>
          </>
        )}
      </div>

      {/* Controls bar */}
      <div className="relative z-20 p-3 lg:p-4">
        <VideoControls
          onEndCall={handleEndCall}
          onToggleChat={() => setChatOpen((prev) => !prev)}
          isChatOpen={chatOpen}
          isRecording={isRecording}
          onToggleRecording={isDoctor ? handleToggleRecording : undefined}
          canRecord={isDoctor && recordingConsent !== false}
          callDuration={callDuration}
        />
      </div>

      {/* Global audio for remote participants */}
      <DailyAudio />
    </div>
  )
}

// ============================================================
// Main Exported Component
// ============================================================

export function VideoRoom({
  roomUrl,
  token,
  userName,
  isDoctor,
  consultationId,
  onCallEnd,
  recordingConsent,
}: VideoRoomProps) {
  const callObject = useMemo(() => {
    const call = DailyIframe.createCallObject({
      url: roomUrl,
      token,
      userName,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
      },
    })
    return call
  }, [roomUrl, token, userName])

  useEffect(() => {
    if (!callObject) return

    callObject.join().catch((err) => {
      console.error('[VideoRoom] Failed to join:', err)
    })

    return () => {
      callObject.leave().catch(() => {})
      callObject.destroy().catch(() => {})
    }
  }, [callObject])

  return (
    <DailyProvider callObject={callObject}>
      <div className="h-full w-full">
        <InnerRoom
          isDoctor={isDoctor}
          consultationId={consultationId}
          userName={userName}
          onCallEnd={onCallEnd}
          recordingConsent={recordingConsent}
        />
      </div>
    </DailyProvider>
  )
}
