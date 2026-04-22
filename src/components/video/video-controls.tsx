'use client'

import { useCallback, useState } from 'react'
import {
  useLocalParticipant,
  useScreenShare,
  useDaily,
  useDailyEvent,
} from '@daily-co/daily-react'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

interface VideoControlsProps {
  onEndCall: () => void
  onToggleChat: () => void
  isChatOpen: boolean
  isRecording: boolean
  onToggleRecording?: () => void
  canRecord: boolean
  callDuration: string
}

interface ControlButtonProps {
  onClick: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
  label: string
  icon: React.ReactNode
  badge?: string | number
}

// ============================================================
// Control Button Component
// ============================================================

function ControlButton({
  onClick,
  active = false,
  danger = false,
  disabled = false,
  label,
  icon,
  badge,
}: ControlButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          danger
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : active
              ? 'bg-surface-700 text-white hover:bg-surface-600'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30',
          'lg:w-14 lg:h-14'
        )}
      >
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {badge}
          </span>
        )}
      </button>
      <span className="text-[10px] text-white/80 font-medium lg:text-xs">
        {label}
      </span>
    </div>
  )
}

// ============================================================
// SVG Icons
// ============================================================

function MicOnIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18M12 19v4M8 23h8" />
    </svg>
  )
}

function CamOnIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function CamOffIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function ScreenShareIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}

function RecordIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}

function PhoneEndIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

// ============================================================
// Main Controls Component
// ============================================================

export function VideoControls({
  onEndCall,
  onToggleChat,
  isChatOpen,
  isRecording,
  onToggleRecording,
  canRecord,
  callDuration,
}: VideoControlsProps) {
  const localParticipant = useLocalParticipant()
  const daily = useDaily()
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare()

  const [unreadMessages, setUnreadMessages] = useState(0)

  const isMicOn = !localParticipant?.tracks?.audio?.off
  const isCamOn = !localParticipant?.tracks?.video?.off

  // Count unread messages when chat is closed
  useDailyEvent('app-message', () => {
    if (!isChatOpen) {
      setUnreadMessages((prev) => prev + 1)
    }
  })

  // Reset unread when chat opens
  const handleToggleChat = useCallback(() => {
    onToggleChat()
    if (!isChatOpen) {
      setUnreadMessages(0)
    }
  }, [isChatOpen, onToggleChat])

  const toggleMic = useCallback(() => {
    daily?.setLocalAudio(!isMicOn)
  }, [daily, isMicOn])

  const toggleCam = useCallback(() => {
    daily?.setLocalVideo(!isCamOn)
  }, [daily, isCamOn])

  const toggleScreenShare = useCallback(() => {
    if (isSharingScreen) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }, [isSharingScreen, startScreenShare, stopScreenShare])

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface-900/90 backdrop-blur-md rounded-2xl lg:rounded-full">
      {/* Call Duration */}
      <div className="hidden sm:flex items-center gap-2 min-w-[80px]">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          )}
        />
        <span className="text-sm text-white/80 font-mono tabular-nums">
          {callDuration}
        </span>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <ControlButton
          onClick={toggleMic}
          active={!isMicOn}
          label={isMicOn ? 'Mudo' : 'Ativar mic'}
          icon={isMicOn ? <MicOnIcon /> : <MicOffIcon />}
        />

        <ControlButton
          onClick={toggleCam}
          active={!isCamOn}
          label={isCamOn ? 'Desligar cam' : 'Ligar cam'}
          icon={isCamOn ? <CamOnIcon /> : <CamOffIcon />}
        />

        <ControlButton
          onClick={toggleScreenShare}
          active={isSharingScreen}
          label={isSharingScreen ? 'Parar compartilhamento' : 'Compartilhar tela'}
          icon={<ScreenShareIcon />}
        />

        <ControlButton
          onClick={handleToggleChat}
          active={isChatOpen}
          label="Chat"
          icon={<ChatIcon />}
          badge={unreadMessages > 0 ? unreadMessages : undefined}
        />

        {canRecord && onToggleRecording && (
          <ControlButton
            onClick={onToggleRecording}
            active={isRecording}
            label={isRecording ? 'Parar gravacao' : 'Gravar'}
            icon={<RecordIcon />}
          />
        )}

        <ControlButton
          onClick={onEndCall}
          danger
          label="Encerrar"
          icon={<PhoneEndIcon />}
        />
      </div>

      {/* Right spacer for balance (mobile shows duration here) */}
      <div className="flex sm:hidden items-center gap-2 min-w-[60px]">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          )}
        />
        <span className="text-xs text-white/80 font-mono tabular-nums">
          {callDuration}
        </span>
      </div>

      <div className="hidden sm:block min-w-[80px]" />
    </div>
  )
}

// ============================================================
// Connection Quality Indicator
// ============================================================

export type ConnectionQuality = 'good' | 'low' | 'very-low' | 'unknown'

interface ConnectionIndicatorProps {
  quality: ConnectionQuality
}

const QUALITY_CONFIG: Record<
  ConnectionQuality,
  { label: string; color: string; bars: number }
> = {
  good: { label: 'Conexao boa', color: 'bg-green-500', bars: 3 },
  low: { label: 'Conexao media', color: 'bg-yellow-500', bars: 2 },
  'very-low': { label: 'Conexao ruim', color: 'bg-red-500', bars: 1 },
  unknown: { label: 'Verificando...', color: 'bg-surface-400', bars: 0 },
}

export function ConnectionIndicator({ quality }: ConnectionIndicatorProps) {
  const config = QUALITY_CONFIG[quality]

  return (
    <div className="flex items-center gap-1.5" title={config.label}>
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              'w-1 rounded-full transition-all duration-300',
              bar <= config.bars ? config.color : 'bg-white/20',
              bar === 1 ? 'h-1.5' : bar === 2 ? 'h-2.5' : 'h-4'
            )}
          />
        ))}
      </div>
      <span className="text-[10px] text-white/70 hidden lg:inline">
        {config.label}
      </span>
    </div>
  )
}
