'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────
interface Transaction {
  id: string
  date: string
  patient: string
  type: 'consulta' | 'retorno' | 'urgencia'
  amount: number // cents
  status: 'pago' | 'pendente' | 'processando' | 'cancelado'
}

interface Payout {
  id: string
  date: string
  amount: number
  status: 'concluido' | 'agendado' | 'processando'
  bank: string
}

// ─── Mock Data ────────────────────────────────────────────────────
function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

const EARNINGS = {
  today: 75000,
  thisWeek: 375000,
  thisMonth: 1245000,
  total: 8970000,
}

const MONTHLY_REVENUE = [
  { month: 'Out/25', amount: 980000 },
  { month: 'Nov/25', amount: 1050000 },
  { month: 'Dez/25', amount: 870000 },
  { month: 'Jan/26', amount: 1120000 },
  { month: 'Fev/26', amount: 1150000 },
  { month: 'Mar/26', amount: 1245000 },
]

const TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-03-31', patient: 'Maria Silva', type: 'retorno', amount: 25000, status: 'pendente' },
  { id: 't2', date: '2026-03-31', patient: 'Joao Santos', type: 'retorno', amount: 25000, status: 'pendente' },
  { id: 't3', date: '2026-03-31', patient: 'Roberto Lima', type: 'retorno', amount: 25000, status: 'processando' },
  { id: 't4', date: '2026-03-30', patient: 'Fernando Souza', type: 'retorno', amount: 25000, status: 'pago' },
  { id: 't5', date: '2026-03-30', patient: 'Carla Mendes', type: 'retorno', amount: 25000, status: 'pago' },
  { id: 't6', date: '2026-03-30', patient: 'Lucia Ferreira', type: 'retorno', amount: 25000, status: 'pago' },
  { id: 't7', date: '2026-03-30', patient: 'Pedro Costa', type: 'consulta', amount: 35000, status: 'pago' },
  { id: 't8', date: '2026-03-29', patient: 'Juliana Ribeiro', type: 'retorno', amount: 25000, status: 'pago' },
  { id: 't9', date: '2026-03-29', patient: 'Rafael Almeida', type: 'urgencia', amount: 45000, status: 'pago' },
  { id: 't10', date: '2026-03-29', patient: 'Camila Martins', type: 'retorno', amount: 25000, status: 'pago' },
  { id: 't11', date: '2026-03-28', patient: 'Marcos Oliveira', type: 'retorno', amount: 25000, status: 'cancelado' },
  { id: 't12', date: '2026-03-28', patient: 'Ana Pereira', type: 'consulta', amount: 35000, status: 'pago' },
  { id: 't13', date: '2026-03-27', patient: 'Maria Silva', type: 'retorno', amount: 25000, status: 'pago' },
  { id: 't14', date: '2026-03-27', patient: 'Fernando Souza', type: 'retorno', amount: 25000, status: 'pago' },
  { id: 't15', date: '2026-03-26', patient: 'Pedro Costa', type: 'consulta', amount: 35000, status: 'pago' },
]

const PAYOUTS: Payout[] = [
  { id: 'py1', date: '2026-04-05', amount: 375000, status: 'agendado', bank: 'Banco do Brasil •••• 1234' },
  { id: 'py2', date: '2026-03-20', amount: 620000, status: 'concluido', bank: 'Banco do Brasil •••• 1234' },
  { id: 'py3', date: '2026-03-05', amount: 580000, status: 'concluido', bank: 'Banco do Brasil •••• 1234' },
  { id: 'py4', date: '2026-02-20', amount: 545000, status: 'concluido', bank: 'Banco do Brasil •••• 1234' },
  { id: 'py5', date: '2026-02-05', amount: 605000, status: 'concluido', bank: 'Banco do Brasil •••• 1234' },
]

const METRICS = {
  avgTicket: 27500,
  consultationsThisMonth: 45,
  consultationsLastMonth: 42,
  firstConsultations: 8,
  returns: 37,
}

type TabKey = 'resumo' | 'transacoes' | 'repasses' | 'impostos'

function statusBadge(status: Transaction['status']) {
  const map: Record<Transaction['status'], { label: string; classes: string }> = {
    pago: { label: 'Pago', classes: 'bg-brand-50 text-brand-700' },
    pendente: { label: 'Pendente', classes: 'bg-yellow-50 text-yellow-700' },
    processando: { label: 'Processando', classes: 'bg-blue-50 text-blue-700' },
    cancelado: { label: 'Cancelado', classes: 'bg-red-50 text-red-700' },
  }
  return map[status]
}

function payoutStatusBadge(status: Payout['status']) {
  const map: Record<Payout['status'], { label: string; classes: string }> = {
    concluido: { label: 'Concluido', classes: 'bg-brand-50 text-brand-700' },
    agendado: { label: 'Agendado', classes: 'bg-blue-50 text-blue-700' },
    processando: { label: 'Processando', classes: 'bg-yellow-50 text-yellow-700' },
  }
  return map[status]
}

function typeLabel(type: Transaction['type']) {
  const map: Record<Transaction['type'], string> = {
    consulta: 'Primeira Consulta',
    retorno: 'Retorno',
    urgencia: 'Urgencia',
  }
  return map[type]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('resumo')

  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((r) => r.amount))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Financeiro</h1>
        <p className="text-surface-500">Acompanhe seus ganhos e repasses</p>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Hoje</p>
          <p className="text-2xl font-heading font-bold text-surface-900">{formatCurrency(EARNINGS.today)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Esta Semana</p>
          <p className="text-2xl font-heading font-bold text-surface-900">{formatCurrency(EARNINGS.thisWeek)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Este Mes</p>
          <p className="text-2xl font-heading font-bold text-brand-600">{formatCurrency(EARNINGS.thisMonth)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Total Acumulado</p>
          <p className="text-2xl font-heading font-bold text-brand-600">{formatCurrency(EARNINGS.total)}</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Ticket Medio</p>
          <p className="text-xl font-heading font-bold text-accent-500">{formatCurrency(METRICS.avgTicket)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Consultas no Mes</p>
          <p className="text-xl font-heading font-bold text-surface-900">{METRICS.consultationsThisMonth}</p>
          <p className="text-xs text-surface-400">vs. {METRICS.consultationsLastMonth} mes anterior</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Primeiras Consultas</p>
          <p className="text-xl font-heading font-bold text-surface-900">{METRICS.firstConsultations}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-xs text-surface-500 mb-1">Retornos</p>
          <p className="text-xl font-heading font-bold text-surface-900">{METRICS.returns}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1">
          {([
            { key: 'resumo' as TabKey, label: 'Receita Mensal' },
            { key: 'transacoes' as TabKey, label: 'Transacoes' },
            { key: 'repasses' as TabKey, label: 'Repasses' },
            { key: 'impostos' as TabKey, label: 'Impostos (IR)' },
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

      {/* Revenue Chart */}
      {activeTab === 'resumo' && (
        <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <h2 className="font-heading font-semibold text-surface-900 mb-6">Receita por Mes</h2>
          <div className="space-y-3">
            {MONTHLY_REVENUE.map((r) => (
              <div key={r.month} className="flex items-center gap-4">
                <span className="w-16 text-sm text-surface-500 text-right">{r.month}</span>
                <div className="flex-1 bg-surface-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="h-8 rounded-full gradient-brand flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${(r.amount / maxRevenue) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white whitespace-nowrap">
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-surface-200 flex items-center justify-between">
            <p className="text-sm text-surface-500">
              Crescimento mensal medio: <span className="font-bold text-brand-600">+5.2%</span>
            </p>
            <p className="text-sm text-surface-500">
              Projecao para Abril: <span className="font-bold text-surface-900">{formatCurrency(1310000)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeTab === 'transacoes' && (
        <div className="rounded-2xl bg-white border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Paciente</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Tipo</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-500">Valor</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t) => {
                  const badge = statusBadge(t.status)
                  return (
                    <tr key={t.id} className="border-b border-surface-100 hover:bg-surface-50 transition">
                      <td className="py-3 px-4 text-surface-500">{formatDate(t.date)}</td>
                      <td className="py-3 px-4 font-medium text-surface-900">{t.patient}</td>
                      <td className="py-3 px-4 text-surface-600">{typeLabel(t.type)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${t.status === 'cancelado' ? 'text-surface-400 line-through' : 'text-surface-900'}`}>
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-surface-200 bg-surface-50 flex items-center justify-between text-sm">
            <span className="text-surface-500">{TRANSACTIONS.length} transacoes</span>
            <span className="font-medium text-surface-900">
              Total: {formatCurrency(TRANSACTIONS.filter((t) => t.status !== 'cancelado').reduce((s, t) => s + t.amount, 0))}
            </span>
          </div>
        </div>
      )}

      {/* Payouts */}
      {activeTab === 'repasses' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-2">Conta de Recebimento</h2>
            <p className="text-sm text-surface-600">Banco do Brasil — Ag. 1234 — C/C •••• 5678-9</p>
            <p className="text-xs text-surface-400 mt-1">Repasses quinzenais (dias 5 e 20 de cada mes)</p>
          </div>

          <div className="space-y-3">
            {PAYOUTS.map((p) => {
              const badge = payoutStatusBadge(p.status)
              return (
                <div key={p.id} className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-surface-900">{formatCurrency(p.amount)}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 mt-1">
                      {p.status === 'agendado' ? 'Previsto para' : 'Depositado em'} {formatDate(p.date)}
                    </p>
                    <p className="text-xs text-surface-400">{p.bank}</p>
                  </div>
                  {p.status === 'concluido' && (
                    <button className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:bg-surface-50 transition">
                      Ver Comprovante
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tax Reports */}
      {activeTab === 'impostos' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-2">Informe de Rendimentos</h2>
            <p className="text-sm text-surface-500 mb-4">
              Baixe os informes de rendimentos para a sua declaracao do Imposto de Renda (IRPF).
            </p>
            <div className="space-y-3">
              {[
                { year: '2025', status: 'disponivel', total: 8970000 },
                { year: '2024', status: 'disponivel', total: 7230000 },
              ].map((report) => (
                <div key={report.year} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div>
                    <p className="font-medium text-surface-900">Informe de Rendimentos — Ano-Calendario {report.year}</p>
                    <p className="text-sm text-surface-500">Total de rendimentos: {formatCurrency(report.total)}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition flex items-center gap-2">
                    Baixar PDF
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
            <h2 className="font-heading font-semibold text-surface-900 mb-4">Resumo Fiscal — 2026 (Parcial)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-xs text-surface-500 mb-1">Rendimentos Brutos (Jan-Mar)</p>
                <p className="text-xl font-heading font-bold text-surface-900">{formatCurrency(3515000)}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-xs text-surface-500 mb-1">Taxa da Plataforma (15%)</p>
                <p className="text-xl font-heading font-bold text-red-600">-{formatCurrency(527250)}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-xs text-surface-500 mb-1">Rendimento Liquido</p>
                <p className="text-xl font-heading font-bold text-brand-600">{formatCurrency(2987750)}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-xs text-surface-500 mb-1">IRRF Retido</p>
                <p className="text-xl font-heading font-bold text-surface-900">{formatCurrency(0)}</p>
                <p className="text-xs text-surface-400">Medico responsavel pelo recolhimento (carne-leao)</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
            <h3 className="font-heading font-semibold text-amber-800 mb-2">Lembrete Fiscal</h3>
            <p className="text-sm text-amber-700">
              Como profissional autonomo, voce e responsavel pelo recolhimento mensal do carne-leao.
              Recomendamos consultar seu contador para garantir o correto recolhimento dos impostos.
              A WiseDrops nao realiza retencao de IR na fonte.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
