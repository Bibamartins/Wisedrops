'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import { formatCurrency } from '@/lib/utils'

// ---------- Mock data ----------

const FINANCIAL_SUMMARY = {
  gmv: 48750000,          // R$ 487.500,00
  netRevenue: 9750000,    // R$ 97.500,00
  platformFees: 7312500,  // R$ 73.125,00
  monthlyGrowth: 15.6,
}

const REVENUE_STREAMS = [
  { stream: 'Venda de Produtos', amount: 6825000, pct: 70.0, color: 'bg-brand-500' },
  { stream: 'Consultas Medicas', amount: 1462500, pct: 15.0, color: 'bg-blue-500' },
  { stream: 'Taxas ANVISA', amount: 975000, pct: 10.0, color: 'bg-amber-500' },
  { stream: 'Assinaturas Premium', amount: 487500, pct: 5.0, color: 'bg-purple-500' },
]

const MONTHLY_COMPARISON = [
  { month: 'Out/25', gmv: 32100000, net: 6420000, orders: 310, consultations: 180 },
  { month: 'Nov/25', gmv: 35800000, net: 7160000, orders: 345, consultations: 210 },
  { month: 'Dez/25', gmv: 33500000, net: 6700000, orders: 320, consultations: 195 },
  { month: 'Jan/26', gmv: 39200000, net: 7840000, orders: 390, consultations: 240 },
  { month: 'Fev/26', gmv: 42100000, net: 8420000, orders: 420, consultations: 265 },
  { month: 'Mar/26', gmv: 48750000, net: 9750000, orders: 487, consultations: 312 },
]

interface DoctorPayout {
  id: string
  doctor: string
  amount: number
  consultations: number
  period: string
  status: 'pending' | 'processing' | 'completed'
  [key: string]: unknown
}

const DOCTOR_PAYOUTS: DoctorPayout[] = [
  { id: '1', doctor: 'Dr. Carlos Oliveira', amount: 1845000, consultations: 41, period: 'Mar/26', status: 'pending' },
  { id: '2', doctor: 'Dra. Ana Beatriz Costa', amount: 1350000, consultations: 30, period: 'Mar/26', status: 'pending' },
  { id: '3', doctor: 'Dr. Paulo Henrique Dias', amount: 990000, consultations: 22, period: 'Mar/26', status: 'processing' },
  { id: '4', doctor: 'Dra. Juliana Martins', amount: 675000, consultations: 15, period: 'Mar/26', status: 'completed' },
  { id: '5', doctor: 'Dr. Carlos Oliveira', amount: 1620000, consultations: 36, period: 'Fev/26', status: 'completed' },
  { id: '6', doctor: 'Dra. Ana Beatriz Costa', amount: 1215000, consultations: 27, period: 'Fev/26', status: 'completed' },
]

const PAYOUT_STATUS_MAP = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  processing: { label: 'Processando', variant: 'info' as const },
  completed: { label: 'Pago', variant: 'success' as const },
}

// ---------- Component ----------

export default function FinancesPage() {
  const maxGMV = Math.max(...MONTHLY_COMPARISON.map((m) => m.gmv))

  const payoutColumns: Column<DoctorPayout>[] = [
    {
      key: 'doctor',
      header: 'Medico',
      sortable: true,
      render: (p) => <span className="font-medium text-surface-900">{p.doctor}</span>,
    },
    {
      key: 'period',
      header: 'Periodo',
      render: (p) => <span className="text-surface-600">{p.period}</span>,
    },
    {
      key: 'consultations',
      header: 'Consultas',
      sortable: true,
      className: 'text-center',
      render: (p) => <span className="text-surface-700">{p.consultations}</span>,
    },
    {
      key: 'amount',
      header: 'Valor',
      sortable: true,
      className: 'text-right',
      render: (p) => <span className="font-medium text-surface-900">{formatCurrency(p.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => {
        const s = PAYOUT_STATUS_MAP[p.status]
        return <Badge variant={s.variant} dot>{s.label}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Visao Financeira</h1>
        <p className="text-surface-500 text-sm">Metricas financeiras e repasses da plataforma</p>
      </div>

      {/* Top-Level Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-surface-900">{formatCurrency(FINANCIAL_SUMMARY.gmv)}</p>
          <p className="text-xs text-surface-500">GMV (Volume Bruto)</p>
          <p className="text-xs text-green-600 font-medium mt-1">+{FINANCIAL_SUMMARY.monthlyGrowth}% vs mes anterior</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-brand-600">{formatCurrency(FINANCIAL_SUMMARY.netRevenue)}</p>
          <p className="text-xs text-surface-500">Receita Liquida</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-blue-600">{formatCurrency(FINANCIAL_SUMMARY.platformFees)}</p>
          <p className="text-xs text-surface-500">Taxas da Plataforma</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-heading font-bold text-amber-600">
            {formatCurrency(DOCTOR_PAYOUTS.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0))}
          </p>
          <p className="text-xs text-surface-500">Repasses Pendentes</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Canal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {REVENUE_STREAMS.map((stream) => (
              <div key={stream.stream}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-surface-700">{stream.stream}</span>
                  <span className="text-sm font-medium text-surface-900">{formatCurrency(stream.amount)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-surface-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stream.color}`}
                      style={{ width: `${stream.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-surface-400 w-10 text-right">{stream.pct}%</span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-surface-400">
              Total: {formatCurrency(REVENUE_STREAMS.reduce((s, r) => s + r.amount, 0))}
            </p>
          </CardFooter>
        </Card>

        {/* Monthly Comparison Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Comparativo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-3 px-2 font-medium text-surface-500">Mes</th>
                    <th className="text-right py-3 px-2 font-medium text-surface-500">GMV</th>
                    <th className="text-right py-3 px-2 font-medium text-surface-500">Receita Liq.</th>
                    <th className="text-center py-3 px-2 font-medium text-surface-500">Pedidos</th>
                    <th className="text-center py-3 px-2 font-medium text-surface-500">Consultas</th>
                    <th className="py-3 px-2 font-medium text-surface-500 w-32">GMV</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHLY_COMPARISON.map((m, idx) => {
                    const prev = MONTHLY_COMPARISON[idx - 1]
                    const growth = prev ? (((m.gmv - prev.gmv) / prev.gmv) * 100).toFixed(1) : null
                    return (
                      <tr key={m.month} className="border-b border-surface-100">
                        <td className="py-3 px-2 font-medium text-surface-900">{m.month}</td>
                        <td className="py-3 px-2 text-right text-surface-700">{formatCurrency(m.gmv)}</td>
                        <td className="py-3 px-2 text-right text-surface-700">{formatCurrency(m.net)}</td>
                        <td className="py-3 px-2 text-center text-surface-600">{m.orders}</td>
                        <td className="py-3 px-2 text-center text-surface-600">{m.consultations}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-surface-100 overflow-hidden">
                              <div
                                className="h-full rounded-full gradient-brand"
                                style={{ width: `${(m.gmv / maxGMV) * 100}%` }}
                              />
                            </div>
                            {growth && (
                              <span
                                className={`text-[10px] font-medium ${
                                  parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Payouts */}
      <Card noPadding>
        <div className="p-6">
          <CardHeader>
            <CardTitle>Repasses Medicos</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="warning">
                {DOCTOR_PAYOUTS.filter((p) => p.status === 'pending').length} pendentes
              </Badge>
              <Badge variant="info">
                {DOCTOR_PAYOUTS.filter((p) => p.status === 'processing').length} processando
              </Badge>
            </div>
          </CardHeader>
          <DataTable
            data={DOCTOR_PAYOUTS}
            columns={payoutColumns}
            searchable
            searchPlaceholder="Buscar medico..."
            searchKeys={['doctor']}
            pageSize={10}
            emptyMessage="Nenhum repasse encontrado."
          />
        </div>
      </Card>
    </div>
  )
}
