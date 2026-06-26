'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { ClipboardCheck, ChevronRight } from 'lucide-react'

// ---------- Mock data ----------

const KPI_DATA = [
  { label: 'Receita Total', value: formatCurrency(284750000), change: '+12.3%', trend: 'up' as const },
  { label: 'Pacientes Ativos', value: '1.842', change: '+8.1%', trend: 'up' as const },
  { label: 'Medicos Ativos', value: '67', change: '+3', trend: 'up' as const },
  { label: 'Consultas Hoje', value: '34', change: '-2', trend: 'down' as const },
  { label: 'Pedidos no Mes', value: '487', change: '+15.6%', trend: 'up' as const },
  { label: 'ANVISA Pendentes', value: '12', change: '+4', trend: 'down' as const },
]

const REVENUE_MONTHS = [
  { month: 'Out', value: 180000 },
  { month: 'Nov', value: 210000 },
  { month: 'Dez', value: 195000 },
  { month: 'Jan', value: 240000 },
  { month: 'Fev', value: 265000 },
  { month: 'Mar', value: 284750 },
]

const FUNNEL_DATA = [
  { stage: 'Cadastros', count: 3240, pct: 100 },
  { stage: 'Consultas Agendadas', count: 1842, pct: 56.9 },
  { stage: 'Prescricoes Emitidas', count: 1520, pct: 46.9 },
  { stage: 'Pedidos Realizados', count: 1180, pct: 36.4 },
  { stage: 'Recompras', count: 680, pct: 21.0 },
]

const RECENT_ACTIVITY = [
  { time: '14:32', text: 'Novo medico Dr. Ricardo Mendes aguardando verificacao', type: 'info' as const },
  { time: '14:15', text: 'Pedido #4872 marcado como enviado — rastreio BR123456789', type: 'success' as const },
  { time: '13:58', text: 'Autorizacao ANVISA aprovada para Maria Silva (protocolo #78234)', type: 'success' as const },
  { time: '13:42', text: 'Reembolso processado para pedido #4801 — R$ 342,00', type: 'warning' as const },
  { time: '13:20', text: 'Paciente Joao Santos completou 30 dias de tratamento', type: 'info' as const },
  { time: '12:55', text: 'Estoque baixo: CBD Full Spectrum 3000mg (restam 8 unidades)', type: 'error' as const },
  { time: '12:30', text: 'Nova consulta agendada — Ana Pereira com Dr. Carlos Oliveira', type: 'info' as const },
]

const SYSTEM_ALERTS = [
  { severity: 'error' as const, title: 'Estoque Critico', description: 'CBD Full Spectrum 3000mg abaixo do minimo (8 un.). Reposicao urgente.' },
  { severity: 'error' as const, title: 'Rejeicao ANVISA', description: '2 autorizacoes rejeitadas hoje. Verificar documentacao dos protocolos #78240 e #78243.' },
  { severity: 'warning' as const, title: 'Reclamacoes', description: '5 novas reclamacoes esta semana (+150% vs semana anterior). Principal motivo: atraso na entrega.' },
  { severity: 'warning' as const, title: 'Payout Pendente', description: '3 medicos com pagamento atrasado ha mais de 7 dias.' },
]

// ---------- Component ----------

export default function AdminDashboard() {
  const maxRevenue = Math.max(...REVENUE_MONTHS.map((r) => r.value))
  const externalRxQuery = trpc.externalPrescription.listPending.useQuery({ page: 1, limit: 1 })
  const pendingCount = externalRxQuery.data?.total ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Painel Administrativo</h1>
        <p className="text-surface-500 text-sm">Visao geral da plataforma WiseDrops</p>
      </div>

      {/* Banner: receitas externas pendentes */}
      {pendingCount > 0 && (
        <Link
          href="/operacional/receitas-externas"
          className="block p-5 rounded-2xl bg-gradient-to-r from-warning-50 to-brand-50 border border-warning-200 hover:border-warning-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning-100">
                <ClipboardCheck className="h-6 w-6 text-warning-700" />
              </div>
              <div>
                <p className="font-heading font-bold text-h3 text-surface-900">
                  {pendingCount} receita{pendingCount === 1 ? '' : 's'} externa{pendingCount === 1 ? '' : 's'} pra revisar
                </p>
                <p className="text-small text-surface-600">
                  Pacientes que enviaram documentação pelo caminho &quot;Já tenho receita&quot; e aguardam sua aprovação.
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-surface-500 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPI_DATA.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-2xl font-heading font-bold text-surface-900">{kpi.value}</p>
            <p className="text-xs text-surface-500 mt-1">{kpi.label}</p>
            <p
              className={`text-xs font-medium mt-2 ${
                kpi.trend === 'up' && !kpi.label.includes('Pendentes')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {kpi.change} vs mes anterior
            </p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita Mensal (BRL)</CardTitle>
            <span className="text-xs text-surface-400">Ultimos 6 meses</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48">
              {REVENUE_MONTHS.map((m) => {
                const heightPct = (m.value / maxRevenue) * 100
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-medium text-surface-600">
                      {formatCurrency(m.value * 100)}
                    </span>
                    <div className="w-full relative" style={{ height: '160px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg gradient-brand transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-surface-500">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {FUNNEL_DATA.map((step, idx) => (
              <div key={step.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-surface-700">{step.stage}</span>
                  <span className="text-sm font-medium text-surface-900">
                    {step.count.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${step.pct}%`,
                      background: `hsl(${142 - idx * 15}, 60%, ${40 + idx * 5}%)`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-surface-400 mt-0.5">{step.pct}% do total</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {RECENT_ACTIVITY.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-xs text-surface-400 font-mono mt-0.5 min-w-[40px]">
                  {activity.time}
                </span>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <Badge variant={activity.type} dot className="mt-0.5 shrink-0">
                      {activity.type === 'success'
                        ? 'OK'
                        : activity.type === 'warning'
                        ? 'Atencao'
                        : activity.type === 'error'
                        ? 'Critico'
                        : 'Info'}
                    </Badge>
                    <p className="text-sm text-surface-700">{activity.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <button className="text-sm text-brand-600 hover:underline">Ver historico completo</button>
          </CardFooter>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas do Sistema</CardTitle>
            <Badge variant="error">{SYSTEM_ALERTS.length} ativos</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {SYSTEM_ALERTS.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  alert.severity === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                  />
                  <p
                    className={`text-sm font-semibold ${
                      alert.severity === 'error' ? 'text-red-800' : 'text-amber-800'
                    }`}
                  >
                    {alert.title}
                  </p>
                </div>
                <p
                  className={`text-sm ${
                    alert.severity === 'error' ? 'text-red-700' : 'text-amber-700'
                  }`}
                >
                  {alert.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
