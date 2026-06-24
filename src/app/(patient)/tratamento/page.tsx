'use client'

import Link from 'next/link'
import { HeartPulse, Calendar, FileText, BookOpen, History, ClipboardList } from 'lucide-react'

const AREAS = [
  {
    href: '/tratamento/consultas',
    icon: Calendar,
    title: 'Minhas Consultas',
    description: 'Agende, acompanhe e acesse suas consultas com o medico.',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconBg: 'bg-blue-100',
  },
  {
    href: '/tratamento/receitas',
    icon: FileText,
    title: 'Minhas Receitas',
    description: 'Veja todas as prescricoes emitidas pelo seu medico.',
    color: 'bg-brand-50 border-brand-200 text-brand-700',
    iconBg: 'bg-brand-100',
  },
  {
    href: '/quiz',
    icon: ClipboardList,
    title: 'Avaliacao Medica',
    description: 'Responda o quiz para que seu medico entenda melhor sua condicao.',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    iconBg: 'bg-amber-100',
  },
  {
    href: '/tratamento/diario',
    icon: BookOpen,
    title: 'Diario de Sintomas',
    description: 'Registre como voce esta se sentindo e acompanhe sua evolucao diaria.',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    iconBg: 'bg-purple-100',
  },
  {
    href: '/tratamento/historico',
    icon: History,
    title: 'Historico Medico',
    description: 'Acesse seu prontuario, evolucao do tratamento e exames anteriores.',
    color: 'bg-surface-50 border-surface-200 text-surface-700',
    iconBg: 'bg-surface-100',
  },
]

export default function TratamentoHubPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-brand-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-surface-900">Tratamento</h1>
        </div>
        <p className="text-surface-500 ml-13">
          Tudo sobre o seu acompanhamento medico em um so lugar.
        </p>
      </div>

      {/* Area Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {AREAS.map((area) => {
          const Icon = area.icon
          return (
            <Link
              key={area.href}
              href={area.href}
              className={`flex items-start gap-4 p-5 rounded-2xl border bg-white hover:shadow-md transition group`}
              aria-label={area.title}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${area.iconBg}`}
              >
                <Icon className="w-5 h-5 text-surface-700" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading font-semibold text-surface-900 group-hover:text-brand-700 transition">
                  {area.title}
                </h2>
                <p className="text-sm text-surface-500 mt-0.5 leading-relaxed">
                  {area.description}
                </p>
              </div>
              <span className="text-surface-300 group-hover:text-brand-500 transition flex-shrink-0 mt-1">
                →
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
