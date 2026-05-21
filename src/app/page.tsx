'use client'

import { useState } from 'react'
import Link from 'next/link'

const CONDITIONS = [
  { icon: '😴', label: 'Insonia', description: 'Dificuldade para dormir' },
  { icon: '😰', label: 'Ansiedade', description: 'Transtorno de ansiedade' },
  { icon: '🤕', label: 'Dor Cronica', description: 'Dor persistente' },
  { icon: '😔', label: 'Depressao', description: 'Transtorno depressivo' },
  { icon: '⚡', label: 'Epilepsia', description: 'Crises convulsivas' },
  { icon: '🧠', label: 'Autismo', description: 'TEA - Espectro Autista' },
  { icon: '💆', label: 'Fibromialgia', description: 'Dor musculoesqueletica' },
  { icon: '🤧', label: 'Enxaqueca', description: 'Cefaleia cronica' },
]

const STEPS = [
  {
    number: '01',
    title: 'Quiz de Avaliacao Gratuito',
    description: 'Responda 8 perguntas sobre sua condicao, historico e objetivos. Nossa IA analisa seu perfil, identifica o nivel de atencao e recomenda o especialista ideal.',
    icon: '📋',
  },
  {
    number: '02',
    title: 'Consulta por Video',
    description: 'Consulte-se por video com um medico certificado em cannabis medicinal. Diferente de chats genericos — aqui voce tem atendimento humanizado.',
    icon: '🎥',
  },
  {
    number: '03',
    title: 'Receita Digital + ANVISA',
    description: 'Receba sua receita digital validada e a autorizacao ANVISA automatizada. Suportamos produtos nacionais (RDC 327) E importados (RDC 660).',
    icon: '📄',
  },
  {
    number: '04',
    title: 'Acompanhamento Continuo',
    description: 'Acompanhe sua evolucao com prontuario eletronico, diario de sintomas e monitoramento de aderencia. Seu medico acompanha tudo em tempo real.',
    icon: '📊',
  },
]

const DIFFERENTIALS = [
  {
    title: 'Prontuario Eletronico Real',
    description: 'Nao apenas um chat. Historico medico completo, resultados de exames e evolucao clinica acessiveis ao medico e ao paciente.',
    icon: '🏥',
  },
  {
    title: 'Consulta por Video',
    description: 'Atendimento humanizado por videochamada, nao por chat automatizado. Seu medico te ve, te ouve e te examina.',
    icon: '📹',
  },
  {
    title: 'Tracking de Aderencia',
    description: 'Lembretes de dosagem, confirmacao de uso e historico completo. Seu medico sabe se o tratamento esta funcionando.',
    icon: '✅',
  },
  {
    title: 'Produtos Nacionais + Importados',
    description: 'Unica plataforma que oferece tanto produtos nacionais (RDC 327) quanto importados (RDC 660). Mais opcoes, melhores precos.',
    icon: '🇧🇷',
  },
  {
    title: 'Diario de Sintomas',
    description: 'Registre diariamente como voce se sente. Algoritmos identificam padroes e ajudam o medico a ajustar o tratamento.',
    icon: '📓',
  },
  {
    title: 'Transparencia Total',
    description: 'Precos claros desde o inicio. Sem surpresas, sem taxas escondidas. Voce sabe exatamente o que vai pagar antes de comecar.',
    icon: '💎',
  },
]

const TESTIMONIALS = [
  {
    name: 'Maria S.',
    condition: 'Insonia',
    text: 'Depois de 3 anos sem dormir direito, em 2 semanas com o tratamento guiado pela WiseDrops eu voltei a ter noites completas de sono.',
    rating: 5,
  },
  {
    name: 'Carlos R.',
    condition: 'Dor Cronica',
    text: 'O acompanhamento faz toda a diferenca. Meu medico ajustou a dosagem 3 vezes ate achar o ponto ideal. Na Blis ninguem fez follow-up comigo.',
    rating: 5,
  },
  {
    name: 'Ana L.',
    condition: 'Ansiedade',
    text: 'A consulta por video foi incrivel. O medico realmente me ouviu, pediu exames, e montou um plano de tratamento personalizado.',
    rating: 5,
  },
]

const FAQ = [
  {
    q: 'Cannabis medicinal e legal no Brasil?',
    a: 'Sim. A ANVISA regulamenta o uso de cannabis medicinal atraves das RDC 327/2019 (produtos nacionais) e RDC 660/2022 (importacao). A WiseDrops opera em total conformidade com ambas.',
  },
  {
    q: 'Quanto custa a consulta?',
    a: 'A consulta por video custa R$89,00, podendo ser parcelada em ate 10x sem juros. O valor inclui o atendimento completo, receita digital e criacao do seu prontuario eletronico.',
  },
  {
    q: 'Qual a diferenca entre produtos nacionais e importados?',
    a: 'Produtos nacionais (RDC 327) ja possuem registro ANVISA e sao vendidos em farmacias autorizadas — entrega mais rapida e geralmente mais acessiveis. Produtos importados (RDC 660) vem dos EUA e exigem autorizacao individual da ANVISA — mais variedade mas prazo de ate 30 dias.',
  },
  {
    q: 'Como funciona o acompanhamento do tratamento?',
    a: 'Apos a consulta, voce recebe lembretes de dosagem, pode registrar sintomas no diario e seu medico acompanha sua evolucao em tempo real. Consultas de retorno sao agendadas conforme necessidade.',
  },
  {
    q: 'Meu convenio cobre?',
    a: 'Atualmente a maioria dos convenios nao cobre cannabis medicinal. Estamos trabalhando com operadoras para ampliar a cobertura. A WiseDrops oferece os melhores precos do mercado para tornar o tratamento acessivel.',
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-surface-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-heading font-bold text-xl text-surface-900">
                Wise<span className="text-brand-600">Drops</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#beneficios" className="text-sm text-surface-600 hover:text-brand-600 transition">
                Beneficios
              </a>
              <a href="#como-funciona" className="text-sm text-surface-600 hover:text-brand-600 transition">
                Como Funciona
              </a>
              <a href="#medicos" className="text-sm text-surface-600 hover:text-brand-600 transition">
                Medicos
              </a>
              <a href="#faq" className="text-sm text-surface-600 hover:text-brand-600 transition">
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-surface-700 hover:text-brand-600 transition"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium px-4 py-2 rounded-lg gradient-brand text-white hover:opacity-90 transition"
              >
                Comecar Agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 text-sage-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
              Regulamentado pela ANVISA
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-surface-900 leading-tight mb-6">
              Tratamento com{' '}
              <span className="text-brand-600">Cannabis Medicinal</span> Personalizado
            </h1>
            <p className="text-lg sm:text-xl text-surface-500 mb-8 max-w-2xl mx-auto">
              Conectamos voce com medicos especializados para um tratamento seguro, legal e baseado em evidencias cientificas
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl gradient-brand text-white font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-brand-500/25"
              >
                Cadastre-se Gratis
              </Link>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-sage-300 text-sage-700 font-semibold text-lg hover:border-sage-500 hover:text-sage-800 hover:bg-sage-50 transition"
              >
                Como Funciona
              </a>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-surface-400">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★★★★★</span>
                <span>4.9/5</span>
              </div>
              <div>500+ medicos certificados</div>
              <div>25.000+ pacientes atendidos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="py-16 bg-sage-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-heading font-bold text-center text-surface-900 mb-2">
            Tratamos diversas condicoes
          </h2>
          <p className="text-center text-surface-500 mb-10">
            Cannabis medicinal pode ajudar com mais de 50 condicoes clinicas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CONDITIONS.map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center p-4 rounded-xl bg-white border border-surface-200 hover:border-sage-400 hover:shadow-lg transition cursor-pointer"
              >
                <span className="text-3xl mb-2">{c.icon}</span>
                <span className="font-semibold text-surface-900">{c.label}</span>
                <span className="text-xs text-surface-400">{c.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center text-surface-900 mb-4">
            Como Funciona
          </h2>
          <p className="text-center text-surface-500 mb-12 max-w-xl mx-auto">
            4 passos simples para comecar seu tratamento com cannabis medicinal
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-4xl font-heading font-bold text-sage-300">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-surface-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section id="diferenciais" className="py-20 bg-surface-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center text-white mb-4">
            Por que a WiseDrops e diferente
          </h2>
          <p className="text-center text-surface-400 mb-12 max-w-xl mx-auto">
            Nao somos apenas mais um app de consulta. Somos a unica plataforma com acompanhamento medico real.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIFFERENTIALS.map((d) => (
              <div
                key={d.title}
                className="p-6 rounded-2xl bg-surface-800 border border-surface-700 hover:border-sage-500/50 transition"
              >
                <span className="text-3xl mb-4 block">{d.icon}</span>
                <h3 className="text-lg font-heading font-semibold text-white mb-2">{d.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center text-surface-900 mb-12">
            WiseDrops vs Concorrentes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-surface-200">
                  <th className="text-left py-4 px-4 font-heading font-semibold text-surface-900">
                    Funcionalidade
                  </th>
                  <th className="text-center py-4 px-4 font-heading font-semibold text-brand-600">
                    WiseDrops
                  </th>
                  <th className="text-center py-4 px-4 font-heading font-semibold text-surface-400">
                    Blis
                  </th>
                  <th className="text-center py-4 px-4 font-heading font-semibold text-surface-400">
                    Outros
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Consulta por Video', true, false, false],
                  ['Prontuario Eletronico', true, false, false],
                  ['Tracking de Aderencia', true, false, false],
                  ['Diario de Sintomas', true, false, false],
                  ['Produtos Nacionais (RDC 327)', true, false, true],
                  ['Produtos Importados (RDC 660)', true, true, true],
                  ['Automacao ANVISA', true, true, false],
                  ['Acompanhamento Longitudinal', true, false, false],
                  ['CRM Medico', true, false, false],
                ].map(([feature, wise, blis, others], i) => (
                  <tr key={i} className="border-b border-surface-100">
                    <td className="py-3 px-4 text-surface-700">{feature as string}</td>
                    <td className="py-3 px-4 text-center">
                      {wise ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sage-100 text-sage-700">✓</span>
                      ) : (
                        <span className="text-surface-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {blis ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 text-surface-500">✓</span>
                      ) : (
                        <span className="text-surface-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {others ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-100 text-surface-500">✓</span>
                      ) : (
                        <span className="text-surface-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 bg-sage-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center text-surface-900 mb-12">
            O que nossos pacientes dizem
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
                <div className="flex items-center gap-1 text-yellow-400 mb-4">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="text-surface-600 mb-4 italic">&quot;{t.text}&quot;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-surface-900">{t.name}</p>
                    <p className="text-xs text-surface-400">{t.condition}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-sage-100 text-sage-700">
                    Verificado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center text-surface-900 mb-12">
            Perguntas Frequentes
          </h2>
          <div className="space-y-3">
            {FAQ.map((faq, i) => (
              <div
                key={i}
                className="border border-surface-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-50 transition"
                >
                  <span className="font-medium text-surface-900">{faq.q}</span>
                  <span className="text-surface-400 text-xl ml-4">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-surface-500 leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-sage-500 to-sage-700 text-white">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Comece seu tratamento hoje
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Agende uma consulta por video com um medico certificado e descubra como cannabis medicinal pode transformar sua qualidade de vida.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700 transition shadow-lg shadow-brand-900/20"
            >
              Cadastre-se Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 text-surface-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="font-heading font-bold text-lg text-white">
                  WiseDrops
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Plataforma completa de cannabis medicinal. Da consulta ao acompanhamento.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4">Plataforma</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition">Como Funciona</a>
                <a href="#" className="block hover:text-white transition">Para Medicos</a>
                <a href="#" className="block hover:text-white transition">Produtos</a>
                <a href="#" className="block hover:text-white transition">Precos</a>
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4">Suporte</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition">Central de Ajuda</a>
                <a href="#" className="block hover:text-white transition">Contato</a>
                <a href="#" className="block hover:text-white transition">WhatsApp</a>
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition">Termos de Uso</a>
                <a href="#" className="block hover:text-white transition">Politica de Privacidade</a>
                <a href="#" className="block hover:text-white transition">LGPD</a>
              </div>
            </div>
          </div>
          <div className="border-t border-surface-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">
              &copy; 2024 WiseDrops. Todos os direitos reservados
            </p>
            <div className="flex items-center gap-4 text-xs">
              <a href="https://wa.me/5519929318700" className="hover:text-white transition">WhatsApp: +55 19 92931-8700</a>
              <a href="https://instagram.com/wisedrops.br" className="hover:text-white transition">@wisedrops.br</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
