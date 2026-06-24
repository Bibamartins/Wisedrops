'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  ClipboardList,
  Pill,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Star,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Quiz de avaliacao',
    description:
      'Responda 8 perguntas sobre sua condicao e objetivos. Identificamos o perfil clinico e recomendamos o especialista ideal.',
  },
  {
    icon: Stethoscope,
    step: '02',
    title: 'Consulta por video',
    description:
      'Atendimento humanizado com medico certificado em cannabis medicinal. Voce e visto, ouvido e avaliado — nao um ticket de suporte.',
  },
  {
    icon: Pill,
    step: '03',
    title: 'Tratamento prescrito',
    description:
      'Receita digital validada e autorizacao ANVISA automatizada. Produtos nacionais (RDC 327) e importados (RDC 660).',
  },
]

const FEATURES = [
  {
    icon: FileText,
    title: 'Prontuario eletronico real',
    description:
      'Historico medico completo, resultados de exames e evolucao clinica acessiveis ao medico e ao paciente.',
  },
  {
    icon: Calendar,
    title: 'Acompanhamento continuo',
    description:
      'Lembretes de dosagem, diario de sintomas e monitoramento de aderencia. Seu medico acompanha em tempo real.',
  },
  {
    icon: CheckCircle,
    title: 'Transparencia total',
    description:
      'Precos claros desde o inicio. Sem surpresas, sem taxas escondidas. Voce sabe exatamente o que vai pagar.',
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
    a: 'Produtos nacionais (RDC 327) ja possuem registro ANVISA e sao vendidos em farmacias autorizadas — entrega mais rapida e geralmente mais acessiveis. Produtos importados (RDC 660) vem dos EUA e exigem autorizacao individual da ANVISA — mais variedade, prazo de ate 30 dias.',
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
    text: 'O acompanhamento faz toda a diferenca. Meu medico ajustou a dosagem 3 vezes ate achar o ponto ideal. Nunca tive esse nivel de cuidado antes.',
    rating: 5,
  },
  {
    name: 'Ana L.',
    condition: 'Ansiedade',
    text: 'A consulta por video foi incrivel. O medico realmente me ouviu, pediu exames e montou um plano de tratamento personalizado.',
    rating: 5,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-surface-50">

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                           */}
      {/* ------------------------------------------------------------------ */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-surface-200 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-xs">
                <span className="text-white font-heading font-bold text-sm leading-none">W</span>
              </div>
              <span className="font-heading font-semibold text-lg text-surface-900 tracking-tight">
                Wise<span className="text-brand-600">Drops</span>
              </span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#como-funciona"
                className="text-sm text-surface-600 hover:text-surface-900 transition-colors duration-150"
              >
                Como funciona
              </a>
              <a
                href="#medicos"
                className="text-sm text-surface-600 hover:text-surface-900 transition-colors duration-150"
              >
                Medicos
              </a>
              <a
                href="#faq"
                className="text-sm text-surface-600 hover:text-surface-900 transition-colors duration-150"
              >
                FAQ
              </a>
              <Link
                href="/blog"
                className="text-sm text-surface-600 hover:text-surface-900 transition-colors duration-150"
              >
                Blog
              </Link>
            </div>

            {/* Auth */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-surface-700 hover:text-brand-700 transition-colors duration-150"
              >
                Entrar
              </Link>
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 active:bg-brand-800 transition-colors duration-150 shadow-xs"
              >
                Comecar agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="pt-40 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl">

            {/* Eyebrow */}
            <p className="text-overline text-brand-700 uppercase tracking-widest font-semibold mb-8">
              Cannabis medicinal
            </p>

            {/* Headline — recalibração premium: display-xl dominante, frase curta de impacto.
                Apple Health/Function Health usam tipo ~80-120px no hero. */}
            <h1 className="font-heading font-extrabold text-surface-900 text-balance text-5xl sm:text-6xl md:text-7xl xl:text-display-xl leading-[0.95] tracking-[-0.04em] mb-8">
              O médico que <span className="text-brand-700">te ouve</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-body-lg md:text-xl text-surface-600 max-w-xl mb-12 leading-relaxed">
              Cannabis medicinal com médicos prescritores de verdade. Consulta por vídeo, receita digital e acompanhamento contínuo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-brand-600 text-white text-base font-medium hover:bg-brand-700 active:bg-brand-800 transition-colors duration-150 shadow-xs"
              >
                Fazer meu diagnostico
              </Link>
              <Link
                href="/medicos"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md border border-surface-300 bg-white text-surface-700 text-base font-medium hover:bg-surface-50 hover:border-surface-400 active:bg-surface-100 transition-colors duration-150"
              >
                Ver medicos
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-surface-500">
              <div className="flex items-center gap-1.5">
                <span className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} strokeWidth={0} className="fill-brand-500 text-brand-500" />
                  ))}
                </span>
                <span>4.9 de satisfacao</span>
              </div>
              <div className="w-px h-4 bg-surface-300" aria-hidden="true" />
              <span>500+ medicos certificados</span>
              <div className="w-px h-4 bg-surface-300" aria-hidden="true" />
              <span>25.000+ pacientes atendidos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Como funciona                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="mb-16">
            <p className="text-overline text-brand-700 mb-3">Como funciona</p>
            <h2 className="font-heading font-semibold text-h1 text-surface-900 tracking-tight text-balance max-w-md">
              Do primeiro contato ao tratamento em andamento.
            </h2>
          </div>

          {/* Steps — recalibração premium: número de step como elemento decorativo dominante. */}
          <div className="grid sm:grid-cols-3 gap-12 md:gap-8">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="relative pt-8">
                <span
                  aria-hidden
                  className="absolute -top-2 left-0 font-heading font-extrabold text-[6rem] md:text-[8rem] leading-none tracking-[-0.06em] text-surface-100 select-none"
                >
                  {step}
                </span>
                <div className="relative pl-2">
                  <h3 className="font-heading font-semibold text-h2 text-surface-900 mb-3 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-body text-surface-600 leading-relaxed max-w-xs">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Diferenciais                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="beneficios" className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-50">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16 max-w-xl">
            <p className="text-overline text-brand-700 mb-3">Por que a WiseDrops</p>
            <h2 className="font-heading font-semibold text-h1 text-surface-900 tracking-tight text-balance">
              Nao somos mais um app de consulta.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white border border-surface-200 rounded-xl shadow-xs p-6 transition-shadow duration-150 hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-sage-50 flex items-center justify-center mb-5">
                  <Icon size={20} strokeWidth={1.5} className="text-sage-700" />
                </div>
                <h3 className="font-heading font-semibold text-h3 text-surface-900 mb-2 tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-surface-600 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Medicos                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section id="medicos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Text */}
            <div>
              <p className="text-overline text-brand-700 mb-3">Nossa equipe medica</p>
              <h2 className="font-heading font-semibold text-h1 text-surface-900 tracking-tight text-balance mb-6">
                Medicos especializados em cannabis medicinal.
              </h2>
              <p className="text-body-lg text-surface-600 leading-relaxed mb-8">
                Todos os medicos da plataforma sao certificados, com formacao especifica em cannabis medicinal e experiencia clinica comprovada. Nenhum atendimento automatizado. Voce fala com um medico de verdade.
              </p>
              <Link
                href="/medicos"
                className="inline-flex items-center justify-center h-10 px-5 rounded-md border border-surface-300 bg-white text-surface-700 text-sm font-medium hover:bg-surface-50 hover:border-surface-400 transition-colors duration-150"
              >
                Conhecer os medicos
              </Link>
            </div>

            {/* Stats — recalibração premium: fundo preto contrastante, números brancos grandes,
                laranja só como acento. Para a seção sair do bg-white circundante. */}
            <div className="grid grid-cols-2 gap-px bg-surface-900 rounded-2xl overflow-hidden">
              {[
                { value: '500+', label: 'Médicos certificados' },
                { value: '25k+', label: 'Pacientes atendidos' },
                { value: '4.9', label: 'Satisfação média' },
                { value: '48h', label: 'Para primeira consulta' },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-surface-900 p-8"
                >
                  <p className="font-heading font-extrabold text-5xl xl:text-6xl text-white leading-none mb-3 tracking-[-0.04em]">
                    {value}
                  </p>
                  <p className="text-caption uppercase tracking-widest font-semibold text-white/50 leading-snug">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Depoimentos                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-50">
        <div className="max-w-6xl mx-auto">

          <div className="mb-16">
            <p className="text-overline text-brand-700 mb-3">Depoimentos</p>
            <h2 className="font-heading font-semibold text-h1 text-surface-900 tracking-tight text-balance max-w-md">
              O que nossos pacientes dizem.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-surface-200 rounded-xl shadow-xs p-6"
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} strokeWidth={0} className="fill-brand-500 text-brand-500" />
                  ))}
                </div>

                <p className="text-surface-700 text-sm leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-surface-900">{t.name}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{t.condition}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-sage-100 text-sage-700 text-xs font-medium">
                    <CheckCircle size={10} strokeWidth={2} />
                    Verificado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">

          <div className="mb-12">
            <p className="text-overline text-brand-700 mb-3">FAQ</p>
            <h2 className="font-heading font-semibold text-h1 text-surface-900 tracking-tight text-balance">
              Perguntas frequentes.
            </h2>
          </div>

          <div className="divide-y divide-surface-100">
            {FAQ.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-surface-900 text-sm">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={16} strokeWidth={1.5} className="text-surface-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} strokeWidth={1.5} className="text-surface-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <p className="pb-5 text-sm text-surface-600 leading-relaxed animate-fade-in">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA final                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-surface-200 rounded-2xl shadow-xs px-8 py-16 text-center max-w-2xl mx-auto">
            <p className="text-overline text-brand-700 mb-4">Comece agora</p>
            <h2 className="font-heading font-bold text-h1 text-surface-900 tracking-tight text-balance mb-4">
              Seu tratamento comeca com uma pergunta.
            </h2>
            <p className="text-body-lg text-surface-600 max-w-lg mx-auto mb-8">
              Faca o quiz gratuito e descubra qual medico e mais indicado para o seu caso. Em menos de 5 minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-brand-600 text-white text-base font-medium hover:bg-brand-700 active:bg-brand-800 transition-colors duration-150 shadow-xs"
              >
                Fazer meu diagnostico
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md border border-surface-300 bg-white text-surface-700 text-base font-medium hover:bg-surface-50 hover:border-surface-400 transition-colors duration-150"
              >
                Ja tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                               */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-surface-900 px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="max-w-6xl mx-auto">

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
                  <span className="text-white font-heading font-bold text-xs leading-none">W</span>
                </div>
                <span className="font-heading font-semibold text-base text-white">WiseDrops</span>
              </div>
              <p className="text-sm text-surface-500 leading-relaxed">
                Plataforma completa de cannabis medicinal. Da consulta ao acompanhamento continuo.
              </p>
            </div>

            {/* Plataforma */}
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Plataforma</p>
              <div className="space-y-3">
                <a href="#como-funciona" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Como funciona</a>
                <Link href="/medicos" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Medicos</Link>
                <Link href="/blog" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Blog</Link>
                <a href="#faq" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">FAQ</a>
              </div>
            </div>

            {/* Suporte */}
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Suporte</p>
              <div className="space-y-3">
                <a href="#" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Central de ajuda</a>
                <a href="#" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Contato</a>
                <a href="https://wa.me/5519929318700" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">WhatsApp</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Legal</p>
              <div className="space-y-3">
                <a href="#" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Termos de uso</a>
                <a href="#" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Politica de privacidade</a>
                <a href="#" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">LGPD</a>
                <Link href="/seja-medico" className="block text-sm text-surface-500 hover:text-white transition-colors duration-150">Para medicos</Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-surface-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-surface-600">
              &copy; 2024 WiseDrops. Todos os direitos reservados.
            </p>
            <p className="text-xs text-surface-600">
              Regulamentado pela ANVISA — RDC 327/2019 e RDC 660/2022
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
