'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth, useMe } from '@/lib/use-auth'
import { trpc } from '@/lib/trpc'

// Mock data - will be replaced with tRPC queries
const MOCK_DATA = {
  patient: {
    name: 'Maria Silva',
    nextConsultation: {
      doctor: 'Dr. Carlos Oliveira',
      specialty: 'Neurologia',
      date: '2026-04-05',
      time: '14:00',
    },
  },
  adherence: {
    rate: 87,
    streak: 12,
    todayDoses: [
      { time: '08:00', product: 'CBD Full Spectrum 30mg/mL', taken: true },
      { time: '20:00', product: 'CBD Full Spectrum 30mg/mL', taken: false },
    ],
  },
  activeTreatment: {
    condition: 'Insonia',
    duration: '3 meses',
    improvement: '+45%',
  },
  recentOutcomes: {
    sleepQuality: [6, 7, 7, 8, 7, 8, 9],
    painLevel: [5, 4, 4, 3, 3, 3, 2],
    dates: ['25/03', '26/03', '27/03', '28/03', '29/03', '30/03', '31/03'],
  },
}

export default function PatientDashboard() {
  const { patient, adherence, activeTreatment, recentOutcomes } = MOCK_DATA
  const { user } = useAuth()
  const meQuery = useMe()
  const consultationsQuery = trpc.consultation.listForPatient.useQuery(
    { status: 'COMPLETED', page: 1, limit: 1 },
    { enabled: !!user }
  )

  const userName = user?.fullName?.split(' ')[0] || 'Paciente'
  const hasQuiz = meQuery.data?.patient?.onboardingCompleted ?? false
  // heuristic placeholder — will be replaced when /documents migrates to real API
  const hasDocuments = !!meQuery.data?.patient?.onboardingCompleted
  const hasCompletedConsultation =
    (consultationsQuery.data?.consultations?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">
          Ola, {userName} 👋
        </h1>
        <p className="text-surface-500">Aqui esta o resumo do seu tratamento</p>
      </div>

      {/* Onboarding Steps - Show if incomplete */}
      {!hasQuiz && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-50 to-orange-50 border border-accent-200">
          <h3 className="font-heading font-semibold text-surface-900 mb-3">
            ⚡ Complete sua avaliacao
          </h3>
          <Link
            href="/quiz"
            className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-surface-50 transition border border-surface-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-semibold text-surface-900">Avaliacao medica</p>
                <p className="text-xs text-surface-500">Responda o quiz para encontrar o medico ideal</p>
              </div>
            </div>
            <span className="text-brand-600">→</span>
          </Link>
        </div>
      )}

      {/* Post-consultation: Document Upload Required */}
      {hasCompletedConsultation && !hasDocuments && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">📎</span>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-surface-900 mb-1">
                Acao necessaria: envie seus documentos
              </h3>
              <p className="text-sm text-surface-600">
                Sua consulta foi concluida! Para que seu medico possa emitir a receita e
                voce possa comprar os produtos, precisamos dos seguintes documentos:
              </p>
            </div>
          </div>
          <ul className="text-sm text-surface-700 space-y-1 mb-4 ml-8">
            <li>• RG ou CNH (frente e verso)</li>
            <li>• Comprovante de residencia recente</li>
            <li>• Autorizacao ANVISA (se for produto importado)</li>
          </ul>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            Enviar documentos agora →
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-2xl font-heading font-bold text-brand-600">{adherence.rate}%</p>
          <p className="text-xs text-surface-500">Aderencia ao Tratamento</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-2xl font-heading font-bold text-accent-500">{adherence.streak}</p>
          <p className="text-xs text-surface-500">Dias Consecutivos</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-2xl font-heading font-bold text-brand-600">{activeTreatment.improvement}</p>
          <p className="text-xs text-surface-500">Melhora no Sono</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💊</span>
          </div>
          <p className="text-2xl font-heading font-bold text-surface-900">{activeTreatment.duration}</p>
          <p className="text-xs text-surface-500">Em Tratamento</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Doses */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-surface-900">Doses de Hoje</h2>
            <Link href="/treatment" className="text-sm text-brand-600 hover:underline">
              Ver Historico
            </Link>
          </div>
          <div className="space-y-3">
            {adherence.todayDoses.map((dose, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  dose.taken
                    ? 'bg-brand-50 border-brand-200'
                    : 'bg-white border-surface-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{dose.taken ? '✅' : '⏰'}</span>
                  <div>
                    <p className="font-medium text-surface-900">{dose.product}</p>
                    <p className="text-sm text-surface-500">Horario: {dose.time}</p>
                  </div>
                </div>
                {!dose.taken && (
                  <button className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition">
                    Tomei
                  </button>
                )}
                {dose.taken && (
                  <span className="text-sm text-brand-600 font-medium">Confirmado</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Next Consultation */}
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <h2 className="font-heading font-semibold text-surface-900 mb-4">Proxima Consulta</h2>
          {patient.nextConsultation ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center">
                    <span className="text-lg">👨‍⚕️</span>
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">
                      {patient.nextConsultation.doctor}
                    </p>
                    <p className="text-xs text-surface-500">
                      {patient.nextConsultation.specialty}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-surface-600">
                  <span>📅 {patient.nextConsultation.date}</span>
                  <span>🕐 {patient.nextConsultation.time}</span>
                </div>
              </div>
              <button className="w-full py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition">
                Entrar na Sala de Video
              </button>
              <button className="w-full py-3 rounded-xl border border-surface-200 text-surface-600 font-medium hover:bg-surface-50 transition">
                Reagendar
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-surface-400 mb-4">Nenhuma consulta agendada</p>
              <Link
                href="/consultations/book"
                className="inline-block px-6 py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition"
              >
                Agendar Consulta
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Outcome Chart Placeholder */}
      <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-semibold text-surface-900">Evolucao do Tratamento</h2>
            <p className="text-sm text-surface-500">Ultimos 7 dias</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-brand-500" /> Qualidade do Sono
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-accent-500" /> Nivel de Dor
            </span>
          </div>
        </div>

        {/* Simple Chart Visualization */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-surface-500 mb-2">Qualidade do Sono (0-10)</p>
            <div className="flex items-end gap-2 h-24">
              {recentOutcomes.sleepQuality.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-brand-500"
                    style={{ height: `${(val / 10) * 100}%` }}
                  />
                  <span className="text-[10px] text-surface-400">{recentOutcomes.dates[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-surface-500 mb-2">Nivel de Dor (0-10 — menor e melhor)</p>
            <div className="flex items-end gap-2 h-24">
              {recentOutcomes.painLevel.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-accent-400"
                    style={{ height: `${(val / 10) * 100}%` }}
                  />
                  <span className="text-[10px] text-surface-400">{recentOutcomes.dates[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz CTA for new patients */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-50 to-accent-50 border border-brand-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📋</span>
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-surface-900">Avaliacao de Saude</h3>
            <p className="text-sm text-surface-500">Responda nosso quiz para que o medico entenda melhor sua condicao antes da consulta</p>
          </div>
          <Link
            href="/quiz"
            className="flex-shrink-0 px-5 py-2.5 rounded-xl gradient-brand text-white font-medium text-sm hover:opacity-90 transition"
          >
            Fazer Agora
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          href="/quiz"
          className="p-4 rounded-2xl bg-white border border-brand-200 hover:border-brand-400 transition text-center bg-brand-50/50"
        >
          <span className="text-2xl block mb-2">📋</span>
          <p className="text-sm font-medium text-brand-700">Quiz de Avaliacao</p>
        </Link>
        <Link
          href="/treatment/journal"
          className="p-4 rounded-2xl bg-white border border-surface-200 hover:border-brand-300 transition text-center"
        >
          <span className="text-2xl block mb-2">📓</span>
          <p className="text-sm font-medium text-surface-900">Registrar Sintomas</p>
        </Link>
        <Link
          href="/consultations/book"
          className="p-4 rounded-2xl bg-white border border-surface-200 hover:border-brand-300 transition text-center"
        >
          <span className="text-2xl block mb-2">🎥</span>
          <p className="text-sm font-medium text-surface-900">Nova Consulta</p>
        </Link>
        <Link
          href="/products"
          className="p-4 rounded-2xl bg-white border border-surface-200 hover:border-brand-300 transition text-center"
        >
          <span className="text-2xl block mb-2">🛒</span>
          <p className="text-sm font-medium text-surface-900">Comprar Produtos</p>
        </Link>
        <Link
          href="/prescriptions"
          className="p-4 rounded-2xl bg-white border border-surface-200 hover:border-brand-300 transition text-center"
        >
          <span className="text-2xl block mb-2">📄</span>
          <p className="text-sm font-medium text-surface-900">Minhas Receitas</p>
        </Link>
      </div>
    </div>
  )
}
