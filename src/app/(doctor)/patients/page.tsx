'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

// ─── Mock Data ────────────────────────────────────────────────────
interface Patient {
  id: string
  name: string
  cpf: string
  condition: string
  treatmentStatus: 'ativo' | 'pausado' | 'novo' | 'encerrado'
  adherence: number
  lastVisit: string
  trend: 'up' | 'down' | 'stable'
  email: string
  phone: string
}

const MOCK_PATIENTS: Patient[] = [
  { id: '1', name: 'Maria Silva', cpf: '123.456.789-00', condition: 'Insonia', treatmentStatus: 'ativo', adherence: 87, lastVisit: '2026-03-31', trend: 'up', email: 'maria@email.com', phone: '(11) 99999-0001' },
  { id: '2', name: 'Joao Santos', cpf: '234.567.890-11', condition: 'Dor Cronica', treatmentStatus: 'ativo', adherence: 92, lastVisit: '2026-03-31', trend: 'up', email: 'joao@email.com', phone: '(11) 99999-0002' },
  { id: '3', name: 'Roberto Lima', cpf: '345.678.901-22', condition: 'Ansiedade', treatmentStatus: 'ativo', adherence: 65, lastVisit: '2026-03-28', trend: 'down', email: 'roberto@email.com', phone: '(11) 99999-0003' },
  { id: '4', name: 'Carla Mendes', cpf: '456.789.012-33', condition: 'Depressao', treatmentStatus: 'pausado', adherence: 78, lastVisit: '2026-03-27', trend: 'stable', email: 'carla@email.com', phone: '(11) 99999-0004' },
  { id: '5', name: 'Fernando Souza', cpf: '567.890.123-44', condition: 'Autismo', treatmentStatus: 'ativo', adherence: 95, lastVisit: '2026-03-25', trend: 'up', email: 'fernando@email.com', phone: '(11) 99999-0005' },
  { id: '6', name: 'Ana Pereira', cpf: '678.901.234-55', condition: 'Ansiedade', treatmentStatus: 'novo', adherence: 0, lastVisit: '2026-03-30', trend: 'stable', email: 'ana@email.com', phone: '(11) 99999-0006' },
  { id: '7', name: 'Pedro Costa', cpf: '789.012.345-66', condition: 'Epilepsia', treatmentStatus: 'ativo', adherence: 88, lastVisit: '2026-03-29', trend: 'up', email: 'pedro@email.com', phone: '(11) 99999-0007' },
  { id: '8', name: 'Lucia Ferreira', cpf: '890.123.456-77', condition: 'Fibromialgia', treatmentStatus: 'ativo', adherence: 72, lastVisit: '2026-03-26', trend: 'down', email: 'lucia@email.com', phone: '(11) 99999-0008' },
  { id: '9', name: 'Marcos Oliveira', cpf: '901.234.567-88', condition: 'Dor Cronica', treatmentStatus: 'encerrado', adherence: 55, lastVisit: '2026-02-15', trend: 'down', email: 'marcos@email.com', phone: '(11) 99999-0009' },
  { id: '10', name: 'Juliana Ribeiro', cpf: '012.345.678-99', condition: 'TEPT', treatmentStatus: 'ativo', adherence: 81, lastVisit: '2026-03-24', trend: 'up', email: 'juliana@email.com', phone: '(11) 99999-0010' },
  { id: '11', name: 'Rafael Almeida', cpf: '111.222.333-44', condition: 'Insonia', treatmentStatus: 'ativo', adherence: 45, lastVisit: '2026-03-20', trend: 'down', email: 'rafael@email.com', phone: '(11) 99999-0011' },
  { id: '12', name: 'Camila Martins', cpf: '222.333.444-55', condition: 'Parkinson', treatmentStatus: 'ativo', adherence: 90, lastVisit: '2026-03-22', trend: 'stable', email: 'camila@email.com', phone: '(11) 99999-0012' },
]

const CONDITIONS = ['Todas', 'Insonia', 'Dor Cronica', 'Ansiedade', 'Depressao', 'Autismo', 'Epilepsia', 'Fibromialgia', 'TEPT', 'Parkinson']
const STATUSES = ['Todos', 'ativo', 'pausado', 'novo', 'encerrado']

type SortKey = keyof Pick<Patient, 'name' | 'condition' | 'treatmentStatus' | 'adherence' | 'lastVisit'>

function adherenceBadge(value: number) {
  if (value >= 80) return 'bg-brand-50 text-brand-700'
  if (value >= 60) return 'bg-yellow-50 text-yellow-700'
  return 'bg-red-50 text-red-700'
}

function statusBadge(status: Patient['treatmentStatus']) {
  const map: Record<Patient['treatmentStatus'], string> = {
    ativo: 'bg-brand-50 text-brand-700',
    pausado: 'bg-yellow-50 text-yellow-700',
    novo: 'bg-blue-50 text-blue-700',
    encerrado: 'bg-surface-100 text-surface-500',
  }
  return map[status]
}

function statusLabel(status: Patient['treatmentStatus']) {
  const map: Record<Patient['treatmentStatus'], string> = {
    ativo: 'Ativo',
    pausado: 'Pausado',
    novo: 'Novo',
    encerrado: 'Encerrado',
  }
  return map[status]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [adherenceMin, setAdherenceMin] = useState(0)
  const [adherenceMax, setAdherenceMax] = useState(100)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    let list = MOCK_PATIENTS.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.cpf.includes(search)) return false
      if (conditionFilter !== 'Todas' && p.condition !== conditionFilter) return false
      if (statusFilter !== 'Todos' && p.treatmentStatus !== statusFilter) return false
      if (p.adherence < adherenceMin || p.adherence > adherenceMax) return false
      return true
    })
    list.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
    return list
  }, [search, conditionFilter, statusFilter, adherenceMin, adherenceMax, sortKey, sortAsc])

  const avgAdherence = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.adherence, 0) / filtered.length) : 0
  const needingAttention = filtered.filter((p) => p.adherence < 60 || p.trend === 'down').length

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  function sortArrow(key: SortKey) {
    if (sortKey !== key) return ''
    return sortAsc ? ' ▲' : ' ▼'
  }

  function exportCSV() {
    const header = 'Nome,CPF,Condicao,Status,Aderencia,Ultima Visita,Tendencia\n'
    const rows = filtered.map((p) => `${p.name},${p.cpf},${p.condition},${p.treatmentStatus},${p.adherence}%,${formatDate(p.lastVisit)},${p.trend}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pacientes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Pacientes (CRM)</h1>
          <p className="text-surface-500">Gerencie todos os seus pacientes</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-700 hover:bg-surface-50 transition"
        >
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-brand-600">{filtered.length}</p>
          <p className="text-xs text-surface-500">Total de Pacientes</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-surface-900">{avgAdherence}%</p>
          <p className="text-xs text-surface-500">Aderencia Media</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
          <p className="text-2xl font-heading font-bold text-accent-500">{needingAttention}</p>
          <p className="text-xs text-surface-500">Precisam de Atencao</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c === 'Todas' ? 'Todas as Condicoes' : c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'Todos' ? 'Todos os Status' : statusLabel(s as Patient['treatmentStatus'])}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-surface-500 whitespace-nowrap">Aderencia:</label>
            <input
              type="number"
              min={0}
              max={100}
              value={adherenceMin}
              onChange={(e) => setAdherenceMin(Number(e.target.value))}
              className="w-16 px-2 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-surface-400">-</span>
            <input
              type="number"
              min={0}
              max={100}
              value={adherenceMax}
              onChange={(e) => setAdherenceMax(Number(e.target.value))}
              className="w-16 px-2 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => { setSearch(''); setConditionFilter('Todas'); setStatusFilter('Todos'); setAdherenceMin(0); setAdherenceMax(100) }}
            className="px-3 py-2 rounded-lg text-sm text-brand-600 hover:bg-brand-50 transition font-medium"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th onClick={() => toggleSort('name')} className="text-left py-3 px-4 font-medium text-surface-500 cursor-pointer hover:text-surface-900 select-none">
                  Paciente{sortArrow('name')}
                </th>
                <th onClick={() => toggleSort('condition')} className="text-left py-3 px-4 font-medium text-surface-500 cursor-pointer hover:text-surface-900 select-none">
                  Condicao{sortArrow('condition')}
                </th>
                <th onClick={() => toggleSort('treatmentStatus')} className="text-left py-3 px-4 font-medium text-surface-500 cursor-pointer hover:text-surface-900 select-none">
                  Status{sortArrow('treatmentStatus')}
                </th>
                <th onClick={() => toggleSort('adherence')} className="text-center py-3 px-4 font-medium text-surface-500 cursor-pointer hover:text-surface-900 select-none">
                  Aderencia{sortArrow('adherence')}
                </th>
                <th onClick={() => toggleSort('lastVisit')} className="text-center py-3 px-4 font-medium text-surface-500 cursor-pointer hover:text-surface-900 select-none">
                  Ultima Visita{sortArrow('lastVisit')}
                </th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Tendencia</th>
                <th className="text-right py-3 px-4 font-medium text-surface-500">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-surface-100 hover:bg-surface-50 transition">
                  <td className="py-3 px-4">
                    <Link href={`/patients/${p.id}`} className="font-medium text-surface-900 hover:text-brand-600 transition">
                      {p.name}
                    </Link>
                    <p className="text-xs text-surface-400">{p.cpf}</p>
                  </td>
                  <td className="py-3 px-4 text-surface-600">{p.condition}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.treatmentStatus)}`}>
                      {statusLabel(p.treatmentStatus)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${adherenceBadge(p.adherence)}`}>
                      {p.adherence}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-surface-500">{formatDate(p.lastVisit)}</td>
                  <td className="py-3 px-4 text-center text-lg">
                    {p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '➡️'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/patients/${p.id}`}
                        className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition"
                      >
                        Ver Detalhes
                      </Link>
                      <Link
                        href={`/prescriptions/new?patient=${p.id}`}
                        className="px-3 py-1 rounded-lg bg-surface-100 text-surface-600 text-xs font-medium hover:bg-surface-200 transition"
                      >
                        Nova Receita
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-400">
                    Nenhum paciente encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-surface-200 bg-surface-50 text-xs text-surface-500">
          Exibindo {filtered.length} de {MOCK_PATIENTS.length} pacientes
        </div>
      </div>
    </div>
  )
}
