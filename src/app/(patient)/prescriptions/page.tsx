'use client'

import { useState } from 'react'
import Link from 'next/link'

// --- Types ---
interface Prescription {
  id: string
  type: 'A' | 'B'
  code: string
  doctor: string
  specialty: string
  issuedDate: string
  expiresDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON'
  products: {
    name: string
    dosage: string
    quantity: string
  }[]
  renewalRequested: boolean
}

// --- Mock Data ---
const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    type: 'B',
    code: 'RX-2026-00847',
    doctor: 'Dr. Carlos Oliveira',
    specialty: 'Neurologia',
    issuedDate: '2026-02-15',
    expiresDate: '2026-08-15',
    status: 'ACTIVE',
    products: [
      { name: 'CBD Full Spectrum 30mg/mL', dosage: '0.5mL 2x ao dia', quantity: '2 frascos (30mL)' },
    ],
    renewalRequested: false,
  },
  {
    id: 'rx-002',
    type: 'A',
    code: 'RX-2026-00623',
    doctor: 'Dr. Carlos Oliveira',
    specialty: 'Neurologia',
    issuedDate: '2026-01-10',
    expiresDate: '2026-04-10',
    status: 'EXPIRING_SOON',
    products: [
      { name: 'THC:CBD 1:1 Oleo 10mg/mL', dosage: '0.3mL antes de dormir', quantity: '1 frasco (30mL)' },
    ],
    renewalRequested: false,
  },
  {
    id: 'rx-003',
    type: 'B',
    code: 'RX-2025-04291',
    doctor: 'Dra. Ana Beatriz Costa',
    specialty: 'Psiquiatria',
    issuedDate: '2025-06-20',
    expiresDate: '2025-12-20',
    status: 'EXPIRED',
    products: [
      { name: 'CBD Isolado 50mg/mL', dosage: '0.25mL 3x ao dia', quantity: '3 frascos (30mL)' },
    ],
    renewalRequested: false,
  },
  {
    id: 'rx-004',
    type: 'B',
    code: 'RX-2025-03105',
    doctor: 'Dr. Carlos Oliveira',
    specialty: 'Neurologia',
    issuedDate: '2025-03-01',
    expiresDate: '2025-09-01',
    status: 'EXPIRED',
    products: [
      { name: 'CBD Full Spectrum 30mg/mL', dosage: '0.25mL 1x ao dia', quantity: '1 frasco (30mL)' },
    ],
    renewalRequested: true,
  },
]

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function PrescriptionsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [prescriptions, setPrescriptions] = useState(MOCK_PRESCRIPTIONS)

  const filtered = prescriptions.filter((rx) => {
    if (filter === 'active') return rx.status === 'ACTIVE' || rx.status === 'EXPIRING_SOON'
    if (filter === 'expired') return rx.status === 'EXPIRED'
    return true
  })

  const activeCount = prescriptions.filter((rx) => rx.status === 'ACTIVE' || rx.status === 'EXPIRING_SOON').length
  const expiredCount = prescriptions.filter((rx) => rx.status === 'EXPIRED').length

  const handleRequestRenewal = (id: string) => {
    setPrescriptions((prev) =>
      prev.map((rx) => (rx.id === id ? { ...rx, renewalRequested: true } : rx))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Minhas Receitas</h1>
        <p className="text-surface-500">Gerencie suas prescricoes de cannabis medicinal</p>
      </div>

      {/* Renewal Alert */}
      {prescriptions.some((rx) => rx.status === 'EXPIRING_SOON' && !rx.renewalRequested) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-amber-800">Receita proxima do vencimento</p>
              <p className="text-sm text-amber-600 mt-1">
                Voce tem uma receita que vence em breve. Solicite a renovacao para nao interromper seu tratamento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
        {[
          { key: 'all' as const, label: `Todas (${prescriptions.length})` },
          { key: 'active' as const, label: `Ativas (${activeCount})` },
          { key: 'expired' as const, label: `Expiradas (${expiredCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              filter === tab.key
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filtered.map((rx) => {
          const daysLeft = getDaysUntil(rx.expiresDate)
          return (
            <div
              key={rx.id}
              className={`p-6 rounded-2xl bg-white border shadow-sm ${
                rx.status === 'EXPIRING_SOON'
                  ? 'border-amber-300'
                  : rx.status === 'EXPIRED'
                  ? 'border-surface-200 opacity-75'
                  : 'border-surface-200'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      rx.type === 'A'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    Tipo {rx.type}
                  </span>
                  <span className="font-mono text-sm text-surface-600">{rx.code}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rx.status === 'ACTIVE'
                      ? 'bg-brand-100 text-brand-700'
                      : rx.status === 'EXPIRING_SOON'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-surface-100 text-surface-500'
                  }`}
                >
                  {rx.status === 'ACTIVE' && 'Ativa'}
                  {rx.status === 'EXPIRING_SOON' && `Vence em ${daysLeft} dias`}
                  {rx.status === 'EXPIRED' && 'Expirada'}
                </span>
              </div>

              {/* Doctor Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-lg">👨‍⚕️</span>
                </div>
                <div>
                  <p className="font-medium text-surface-900">{rx.doctor}</p>
                  <p className="text-xs text-surface-500">{rx.specialty}</p>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-2 mb-4">
                {rx.products.map((product, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                    <p className="font-medium text-sm text-surface-900">{product.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-surface-500">
                      <span>Dosagem: {product.dosage}</span>
                      <span>Qtd: {product.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="flex items-center gap-6 mb-4 text-sm text-surface-600">
                <div className="flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Emissao: {formatDate(rx.issuedDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>⏳</span>
                  <span>Validade: {formatDate(rx.expiresDate)}</span>
                </div>
              </div>

              {/* Validity Bar */}
              {(rx.status === 'ACTIVE' || rx.status === 'EXPIRING_SOON') && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-surface-500 mb-1">
                    <span>Validade</span>
                    <span>{daysLeft} dias restantes</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        daysLeft > 30 ? 'bg-brand-500' : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${Math.max(5, Math.min(100, (daysLeft / 180) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 text-surface-700 text-sm font-medium hover:bg-surface-50 transition">
                  <span>📥</span> Baixar PDF
                </button>

                {(rx.status === 'ACTIVE' || rx.status === 'EXPIRING_SOON') && (
                  <Link
                    href="/products"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
                  >
                    <span>🛒</span> Comprar Produtos
                  </Link>
                )}

                {rx.status === 'EXPIRING_SOON' && !rx.renewalRequested && (
                  <button
                    onClick={() => handleRequestRenewal(rx.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
                  >
                    <span>🔄</span> Solicitar Renovacao
                  </button>
                )}

                {rx.renewalRequested && (
                  <span className="flex items-center gap-2 px-4 py-2 text-sm text-amber-600 font-medium">
                    <span>⏳</span> Renovacao solicitada
                  </span>
                )}

                {rx.status === 'EXPIRED' && !rx.renewalRequested && (
                  <button
                    onClick={() => handleRequestRenewal(rx.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition"
                  >
                    <span>📋</span> Agendar Consulta para Renovacao
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📄</span>
          <p className="text-surface-500">Nenhuma receita encontrada nesta categoria</p>
        </div>
      )}
    </div>
  )
}
