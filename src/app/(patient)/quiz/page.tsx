'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ============================================================
// QUIZ DATA STRUCTURE
// ============================================================

interface QuizOption {
  value: string
  label: string
  icon?: string
  description?: string
  followUp?: string // key of conditional question to show
}

interface QuizQuestion {
  id: string
  step: number
  title: string
  subtitle?: string
  type: 'single' | 'multiple' | 'scale' | 'text' | 'yesno' | 'slider'
  options?: QuizOption[]
  required: boolean
  min?: number
  max?: number
  scaleLabels?: { min: string; max: string }
  placeholder?: string
  conditional?: { questionId: string; values: string[] } // only show if previous answer matches
  infoBox?: string // educational tip shown below question
}

// 8-step quiz with conditional logic
const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── STEP 1: Quem e o paciente ────────────────────────
  {
    id: 'patient_for',
    step: 1,
    title: 'Para quem e o tratamento?',
    subtitle: 'Isso nos ajuda a personalizar as perguntas',
    type: 'single',
    required: true,
    options: [
      { value: 'myself', label: 'Para mim mesmo(a)', icon: '🙋' },
      { value: 'child', label: 'Para meu filho(a)', icon: '👶', description: 'Menor de 18 anos' },
      { value: 'family', label: 'Para um familiar', icon: '👨‍👩‍👧', description: 'Pai, mae, conjuge, etc.' },
      { value: 'other', label: 'Para outra pessoa', icon: '👤', description: 'Amigo(a) ou conhecido(a)' },
    ],
  },

  // ── STEP 2: Condicoes principais ─────────────────────
  {
    id: 'conditions',
    step: 2,
    title: 'Quais condicoes voce quer tratar?',
    subtitle: 'Selecione todas que se aplicam',
    type: 'multiple',
    required: true,
    options: [
      { value: 'insomnia', label: 'Insonia / Dificuldade para Dormir', icon: '😴' },
      { value: 'anxiety', label: 'Ansiedade', icon: '😰' },
      { value: 'chronic_pain', label: 'Dor Cronica', icon: '🤕' },
      { value: 'depression', label: 'Depressao', icon: '😔' },
      { value: 'epilepsy', label: 'Epilepsia / Convulsoes', icon: '⚡' },
      { value: 'autism', label: 'Autismo (TEA)', icon: '🧩' },
      { value: 'fibromyalgia', label: 'Fibromialgia', icon: '💆' },
      { value: 'migraine', label: 'Enxaqueca / Cefaleia', icon: '🤧' },
      { value: 'parkinson', label: 'Parkinson', icon: '🧠' },
      { value: 'ptsd', label: 'Estresse Pos-Traumatico (TEPT)', icon: '💭' },
      { value: 'cancer', label: 'Oncologia / Efeitos de Quimioterapia', icon: '🎗️' },
      { value: 'adhd', label: 'TDAH / Deficit de Atencao', icon: '🎯' },
      { value: 'appetite', label: 'Falta de Apetite / Nausea', icon: '🍽️' },
      { value: 'inflammation', label: 'Inflamacao Cronica', icon: '🔥' },
      { value: 'other', label: 'Outra condicao', icon: '➕' },
    ],
  },

  // ── STEP 3: Severidade ───────────────────────────────
  {
    id: 'severity',
    step: 3,
    title: 'Como voce classificaria a intensidade dos seus sintomas?',
    subtitle: 'Considere a media nos ultimos 30 dias',
    type: 'scale',
    required: true,
    min: 1,
    max: 10,
    scaleLabels: { min: 'Leve — incomoda pouco', max: 'Severo — impacta muito minha vida' },
  },
  {
    id: 'symptom_duration',
    step: 3,
    title: 'Ha quanto tempo voce convive com esses sintomas?',
    type: 'single',
    required: true,
    options: [
      { value: 'less_1month', label: 'Menos de 1 mes', icon: '📅' },
      { value: '1_6months', label: '1 a 6 meses', icon: '📅' },
      { value: '6_12months', label: '6 meses a 1 ano', icon: '📅' },
      { value: '1_3years', label: '1 a 3 anos', icon: '📅' },
      { value: '3_5years', label: '3 a 5 anos', icon: '📅' },
      { value: 'more_5years', label: 'Mais de 5 anos', icon: '📅' },
    ],
  },

  // ── STEP 4: Impacto na vida ──────────────────────────
  {
    id: 'daily_impact',
    step: 4,
    title: 'Como os sintomas afetam seu dia a dia?',
    subtitle: 'Selecione todos que se aplicam',
    type: 'multiple',
    required: true,
    options: [
      { value: 'sleep', label: 'Nao consigo dormir bem', icon: '🛏️' },
      { value: 'work', label: 'Atrapalha meu trabalho / estudos', icon: '💼' },
      { value: 'social', label: 'Afeta meus relacionamentos', icon: '👥' },
      { value: 'exercise', label: 'Nao consigo me exercitar', icon: '🏃' },
      { value: 'mood', label: 'Meu humor fica muito afetado', icon: '😞' },
      { value: 'appetite', label: 'Perdi o apetite ou como demais', icon: '🍽️' },
      { value: 'focus', label: 'Dificuldade de concentracao', icon: '🧠' },
      { value: 'daily_tasks', label: 'Tarefas simples ficam dificeis', icon: '🏠' },
      { value: 'none', label: 'Nao afeta significativamente', icon: '✅' },
    ],
  },

  // ── STEP 5: Tratamentos anteriores ───────────────────
  {
    id: 'previous_treatments',
    step: 5,
    title: 'Quais tratamentos voce ja tentou?',
    subtitle: 'Selecione todos que ja usou para esta condicao',
    type: 'multiple',
    required: true,
    options: [
      { value: 'conventional_meds', label: 'Medicamentos convencionais (receita medica)', icon: '💊' },
      { value: 'otc', label: 'Medicamentos sem receita (analgesicos, etc.)', icon: '🏪' },
      { value: 'therapy', label: 'Psicoterapia / Terapia', icon: '🛋️' },
      { value: 'acupuncture', label: 'Acupuntura', icon: '📍' },
      { value: 'physiotherapy', label: 'Fisioterapia', icon: '🏋️' },
      { value: 'meditation', label: 'Meditacao / Mindfulness', icon: '🧘' },
      { value: 'cannabis_informal', label: 'Cannabis (sem acompanhamento medico)', icon: '🌿' },
      { value: 'cannabis_medical', label: 'Cannabis medicinal (com acompanhamento)', icon: '🏥' },
      { value: 'none', label: 'Nenhum tratamento ainda', icon: '🚫' },
    ],
    infoBox: 'Nao se preocupe — todas as respostas sao confidenciais e protegidas pela LGPD.',
  },
  {
    id: 'conventional_effectiveness',
    step: 5,
    title: 'Os tratamentos convencionais funcionaram para voce?',
    type: 'single',
    required: true,
    conditional: { questionId: 'previous_treatments', values: ['conventional_meds'] },
    options: [
      { value: 'effective', label: 'Sim, funcionaram bem', icon: '✅' },
      { value: 'partial', label: 'Funcionaram parcialmente', icon: '⚠️' },
      { value: 'side_effects', label: 'Funcionaram mas com muitos efeitos colaterais', icon: '😵' },
      { value: 'ineffective', label: 'Nao funcionaram', icon: '❌' },
      { value: 'stopped', label: 'Parei por conta propria', icon: '🛑' },
    ],
  },

  // ── STEP 6: Experiencia com cannabis ─────────────────
  {
    id: 'cannabis_experience',
    step: 6,
    title: 'Qual sua experiencia com cannabis medicinal?',
    type: 'single',
    required: true,
    options: [
      { value: 'never', label: 'Nunca usei', icon: '🆕', description: 'Estou pesquisando pela primeira vez' },
      { value: 'researching', label: 'Estou pesquisando mas nunca usei', icon: '🔍', description: 'Li artigos ou ouvi relatos' },
      { value: 'informal', label: 'Ja usei sem acompanhamento medico', icon: '🌿', description: 'Uso proprio, sem receita' },
      { value: 'medical', label: 'Uso ou ja usei com acompanhamento', icon: '👨‍⚕️', description: 'Prescricao medica' },
    ],
    infoBox: 'Cannabis medicinal e legal no Brasil com prescricao medica, regulamentada pela ANVISA (RDC 327/2019 e RDC 660/2022).',
  },
  {
    id: 'cannabis_products_used',
    step: 6,
    title: 'Quais tipos de produtos voce ja usou?',
    type: 'multiple',
    required: true,
    conditional: { questionId: 'cannabis_experience', values: ['informal', 'medical'] },
    options: [
      { value: 'oil_cbd', label: 'Oleo de CBD', icon: '💧' },
      { value: 'oil_thc', label: 'Oleo com THC', icon: '💧' },
      { value: 'capsule', label: 'Capsulas', icon: '💊' },
      { value: 'gummy', label: 'Gomas / Comestiveis', icon: '🍬' },
      { value: 'topical', label: 'Topico (creme, pomada)', icon: '🧴' },
      { value: 'flower', label: 'Flor / Vaporizacao', icon: '🌿' },
      { value: 'other', label: 'Outro', icon: '📦' },
    ],
  },
  {
    id: 'cannabis_effectiveness',
    step: 6,
    title: 'A cannabis medicinal ajudou com seus sintomas?',
    type: 'single',
    required: true,
    conditional: { questionId: 'cannabis_experience', values: ['informal', 'medical'] },
    options: [
      { value: 'very_effective', label: 'Sim, muito — grande melhora', icon: '🌟' },
      { value: 'somewhat', label: 'Sim, parcialmente — alguma melhora', icon: '👍' },
      { value: 'unsure', label: 'Nao tenho certeza', icon: '🤔' },
      { value: 'not_effective', label: 'Nao senti diferenca', icon: '😐' },
    ],
  },

  // ── STEP 7: Saude geral ──────────────────────────────
  {
    id: 'current_medications',
    step: 7,
    title: 'Voce toma algum medicamento atualmente?',
    type: 'single',
    required: true,
    options: [
      { value: 'yes', label: 'Sim', icon: '💊' },
      { value: 'no', label: 'Nao', icon: '🚫' },
    ],
    infoBox: 'Isso e importante para o medico avaliar possiveis interacoes medicamentosas.',
  },
  {
    id: 'medications_list',
    step: 7,
    title: 'Quais medicamentos voce toma?',
    subtitle: 'Liste os nomes dos medicamentos (nao precisa lembrar a dosagem exata)',
    type: 'text',
    required: false,
    conditional: { questionId: 'current_medications', values: ['yes'] },
    placeholder: 'Ex: Rivotril, Escitalopram, Tramadol, Dipirona...',
  },
  {
    id: 'allergies',
    step: 7,
    title: 'Voce tem alguma alergia conhecida?',
    type: 'single',
    required: true,
    options: [
      { value: 'none', label: 'Nenhuma alergia conhecida', icon: '✅' },
      { value: 'medications', label: 'Sim, a medicamentos', icon: '💊' },
      { value: 'food', label: 'Sim, alimentar', icon: '🍽️' },
      { value: 'multiple', label: 'Sim, multiplas', icon: '⚠️' },
    ],
  },
  {
    id: 'health_conditions',
    step: 7,
    title: 'Possui alguma dessas condicoes de saude?',
    subtitle: 'Selecione todas que se aplicam',
    type: 'multiple',
    required: false,
    options: [
      { value: 'hypertension', label: 'Hipertensao', icon: '❤️' },
      { value: 'diabetes', label: 'Diabetes', icon: '🩸' },
      { value: 'heart_disease', label: 'Doenca cardiaca', icon: '🫀' },
      { value: 'liver_disease', label: 'Doenca hepatica', icon: '🫁' },
      { value: 'kidney_disease', label: 'Doenca renal', icon: '🫘' },
      { value: 'pregnancy', label: 'Gravidez / Amamentacao', icon: '🤰' },
      { value: 'mental_health', label: 'Transtorno psiquiatrico diagnosticado', icon: '🧠' },
      { value: 'none', label: 'Nenhuma', icon: '✅' },
    ],
  },

  // ── STEP 8: Expectativas ─────────────────────────────
  {
    id: 'treatment_goals',
    step: 8,
    title: 'O que voce espera alcançar com o tratamento?',
    subtitle: 'Selecione seus principais objetivos',
    type: 'multiple',
    required: true,
    options: [
      { value: 'reduce_pain', label: 'Reduzir dor', icon: '🎯' },
      { value: 'better_sleep', label: 'Dormir melhor', icon: '😴' },
      { value: 'less_anxiety', label: 'Diminuir ansiedade', icon: '🧘' },
      { value: 'better_mood', label: 'Melhorar humor', icon: '😊' },
      { value: 'reduce_meds', label: 'Reduzir medicamentos convencionais', icon: '💊' },
      { value: 'quality_of_life', label: 'Melhorar qualidade de vida geral', icon: '✨' },
      { value: 'more_focus', label: 'Mais foco e concentracao', icon: '🎯' },
      { value: 'appetite', label: 'Recuperar apetite', icon: '🍽️' },
    ],
  },
  {
    id: 'urgency',
    step: 8,
    title: 'Qual a urgencia do seu tratamento?',
    type: 'single',
    required: true,
    options: [
      { value: 'asap', label: 'Quero comecar o mais rapido possivel', icon: '🚀' },
      { value: 'this_week', label: 'Nas proximas semanas', icon: '📅' },
      { value: 'exploring', label: 'Estou apenas explorando por enquanto', icon: '🔍' },
    ],
  },
  {
    id: 'product_preference',
    step: 8,
    title: 'Tem preferencia por algum tipo de produto?',
    subtitle: 'O medico fara a recomendacao final — isso e apenas uma preferencia',
    type: 'single',
    required: false,
    options: [
      { value: 'oil', label: 'Oleo (sublingual)', icon: '💧', description: 'Mais comum e versatil' },
      { value: 'capsule', label: 'Capsulas', icon: '💊', description: 'Dosagem exata e pratica' },
      { value: 'gummy', label: 'Gomas', icon: '🍬', description: 'Facil de tomar' },
      { value: 'topical', label: 'Topico (dor localizada)', icon: '🧴', description: 'Aplicacao direta na pele' },
      { value: 'no_preference', label: 'Sem preferencia — quero a recomendacao do medico', icon: '👨‍⚕️' },
    ],
  },
]

// Step labels
const STEP_LABELS = [
  { num: 1, label: 'Paciente', icon: '👤' },
  { num: 2, label: 'Condicoes', icon: '🩺' },
  { num: 3, label: 'Sintomas', icon: '📊' },
  { num: 4, label: 'Impacto', icon: '💭' },
  { num: 5, label: 'Historico', icon: '📋' },
  { num: 6, label: 'Cannabis', icon: '🌿' },
  { num: 7, label: 'Saude', icon: '❤️' },
  { num: 8, label: 'Objetivos', icon: '🎯' },
]

const TOTAL_STEPS = 8

// ============================================================
// RECOMMENDATION ENGINE
// ============================================================

interface QuizResult {
  recommendedSpecialties: string[]
  riskLevel: 'low' | 'medium' | 'high'
  personalizedMessage: string
  suggestedProducts: string[]
  estimatedConsultationFocus: string[]
  priorityCondition: string
}

function generateRecommendation(answers: Record<string, string | string[] | number>): QuizResult {
  const conditions = (answers.conditions as string[]) || []
  const severity = (answers.severity as number) || 5
  const goals = (answers.treatment_goals as string[]) || []
  const experience = answers.cannabis_experience as string
  const healthConditions = (answers.health_conditions as string[]) || []

  // Determine specialties
  const specialties: string[] = []
  if (conditions.includes('epilepsy') || conditions.includes('parkinson') || conditions.includes('migraine')) {
    specialties.push('Neurologia')
  }
  if (conditions.includes('anxiety') || conditions.includes('depression') || conditions.includes('ptsd') || conditions.includes('adhd')) {
    specialties.push('Psiquiatria')
  }
  if (conditions.includes('chronic_pain') || conditions.includes('fibromyalgia')) {
    specialties.push('Clinica da Dor')
  }
  if (conditions.includes('cancer')) {
    specialties.push('Oncologia')
  }
  if (conditions.includes('autism')) {
    specialties.push('Neurologia', 'Psiquiatria')
  }
  if (specialties.length === 0) specialties.push('Clinica Geral', 'Cannabis Medicinal')

  // Risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (severity >= 8 || healthConditions.includes('pregnancy') || healthConditions.includes('heart_disease')) {
    riskLevel = 'high'
  } else if (severity >= 5 || conditions.length >= 3 || healthConditions.length >= 2) {
    riskLevel = 'medium'
  }

  // Priority condition
  const conditionPriority: Record<string, number> = {
    epilepsy: 10, cancer: 10, parkinson: 9, autism: 8,
    chronic_pain: 7, fibromyalgia: 7, depression: 6, anxiety: 5,
    insomnia: 4, migraine: 4, ptsd: 6, adhd: 3,
  }
  const priorityCondition = conditions.sort(
    (a, b) => (conditionPriority[b] || 0) - (conditionPriority[a] || 0)
  )[0] || 'general'

  // Product suggestions
  const products: string[] = []
  if (conditions.includes('insomnia')) products.push('CBD Oil + Melatonina', 'CBD Sleep Gummies')
  if (conditions.includes('chronic_pain') || conditions.includes('fibromyalgia')) products.push('CBD Full Spectrum Oil', 'CBD Topical Roll-On')
  if (conditions.includes('anxiety') || conditions.includes('depression')) products.push('CBD Broad Spectrum Oil', 'CBD Capsulas')
  if (conditions.includes('epilepsy')) products.push('CBD Isolate Oil (alta concentracao)')
  if (products.length === 0) products.push('CBD Full Spectrum Oil')

  // Personalized message
  const conditionLabels: Record<string, string> = {
    insomnia: 'insonia', anxiety: 'ansiedade', chronic_pain: 'dor cronica',
    depression: 'depressao', epilepsy: 'epilepsia', autism: 'autismo',
    fibromyalgia: 'fibromialgia', migraine: 'enxaqueca', parkinson: 'parkinson',
    ptsd: 'estresse pos-traumatico', cancer: 'suporte oncologico', adhd: 'TDAH',
    appetite: 'apetite', inflammation: 'inflamacao',
  }

  const mainConditions = conditions.slice(0, 2).map((c) => conditionLabels[c] || c).join(' e ')
  let message = `Com base nas suas respostas, identificamos que voce busca tratamento para ${mainConditions}.`

  if (experience === 'never' || experience === 'researching') {
    message += ' Como e sua primeira experiencia com cannabis medicinal, nosso medico vai explicar tudo com calma e começar com doses baixas.'
  } else if (experience === 'medical') {
    message += ' Como voce ja tem experiencia com tratamento medico, podemos otimizar seu regime atual.'
  }

  if (riskLevel === 'high') {
    message += ' Identificamos alguns pontos que merecem atencao especial — o medico vai avaliar com cuidado.'
  }

  // Consultation focus
  const focus: string[] = ['Avaliacao clinica completa']
  if (experience === 'never') focus.push('Educacao sobre cannabis medicinal')
  if (answers.current_medications === 'yes') focus.push('Revisao de interacoes medicamentosas')
  if (severity >= 7) focus.push('Plano de manejo de sintomas intensos')
  if (goals.includes('reduce_meds')) focus.push('Estrategia de reducao de medicamentos')
  focus.push('Prescricao personalizada')

  return {
    recommendedSpecialties: [...new Set(specialties)],
    riskLevel,
    personalizedMessage: message,
    suggestedProducts: [...new Set(products)],
    estimatedConsultationFocus: focus,
    priorityCondition,
  }
}

// ============================================================
// QUIZ COMPONENT
// ============================================================

export default function PatientQuizPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [animating, setAnimating] = useState(false)

  // Get questions for current step (filtering conditionals)
  const currentQuestions = QUIZ_QUESTIONS.filter((q) => {
    if (q.step !== currentStep) return false
    if (q.conditional) {
      const depAnswer = answers[q.conditional.questionId]
      if (Array.isArray(depAnswer)) {
        return q.conditional.values.some((v) => depAnswer.includes(v))
      }
      return q.conditional.values.includes(depAnswer as string)
    }
    return true
  })

  // Check if current step is complete
  const isStepComplete = currentQuestions
    .filter((q) => q.required)
    .every((q) => {
      const answer = answers[q.id]
      if (answer === undefined || answer === null) return false
      if (Array.isArray(answer)) return answer.length > 0
      if (typeof answer === 'string') return answer.length > 0
      return true
    })

  // Progress percentage
  const progress = showResult ? 100 : Math.round(((currentStep - 1) / TOTAL_STEPS) * 100)

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setAnimating(true)
      setTimeout(() => {
        setCurrentStep((s) => s + 1)
        setAnimating(false)
      }, 200)
    } else {
      // Generate result
      const recommendation = generateRecommendation(answers)
      setResult(recommendation)
      setShowResult(true)
    }
  }

  const handleBack = () => {
    if (showResult) {
      setShowResult(false)
      return
    }
    if (currentStep > 1) {
      setAnimating(true)
      setTimeout(() => {
        setCurrentStep((s) => s - 1)
        setAnimating(false)
      }, 200)
    }
  }

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleMultipleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || []
      // "none" toggles off everything else
      if (value === 'none') return { ...prev, [questionId]: ['none'] }
      const filtered = current.filter((v) => v !== 'none')
      if (filtered.includes(value)) {
        return { ...prev, [questionId]: filtered.filter((v) => v !== value) }
      }
      return { ...prev, [questionId]: [...filtered, value] }
    })
  }

  const handleScaleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleBookConsultation = () => {
    // Save quiz answers to localStorage for the booking flow
    localStorage.setItem('wisedrops_quiz', JSON.stringify({ answers, result }))
    // Mark quiz as complete on current user
    try {
      const u = localStorage.getItem('wisedrops_current_user')
      if (u) {
        const user = JSON.parse(u)
        user.hasCompletedQuiz = true
        localStorage.setItem('wisedrops_current_user', JSON.stringify(user))
      }
    } catch {}
    router.push('/consultations/book')
  }

  // ── RENDER ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-surface-200 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="font-heading font-bold text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>
          {!showResult && (
            <span className="text-xs text-surface-400">
              Passo {currentStep} de {TOTAL_STEPS}
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-surface-100">
          <div
            className="h-full gradient-brand transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="pt-20 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Step indicators */}
          {!showResult && (
            <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
              {STEP_LABELS.map((step) => (
                <div
                  key={step.num}
                  className={`flex flex-col items-center min-w-[60px] transition ${
                    step.num === currentStep
                      ? 'opacity-100'
                      : step.num < currentStep
                      ? 'opacity-50'
                      : 'opacity-30'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${
                      step.num < currentStep
                        ? 'bg-brand-500 text-white'
                        : step.num === currentStep
                        ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                        : 'bg-surface-200 text-surface-400'
                    }`}
                  >
                    {step.num < currentStep ? '✓' : step.icon}
                  </div>
                  <span className="text-[10px] text-surface-500">{step.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Questions */}
          {!showResult && (
            <div className={`space-y-8 transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
              {currentQuestions.map((question) => (
                <div key={question.id} className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200">
                  <h2 className="text-xl font-heading font-bold text-surface-900 mb-1">
                    {question.title}
                  </h2>
                  {question.subtitle && (
                    <p className="text-sm text-surface-500 mb-4">{question.subtitle}</p>
                  )}

                  {/* SINGLE SELECT */}
                  {question.type === 'single' && (
                    <div className="space-y-2">
                      {question.options?.map((opt) => {
                        const selected = answers[question.id] === opt.value
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleSingleAnswer(question.id, opt.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                              selected
                                ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-400'
                                : 'bg-white border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                            }`}
                          >
                            {opt.icon && <span className="text-xl flex-shrink-0">{opt.icon}</span>}
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${selected ? 'text-brand-700' : 'text-surface-900'}`}>
                                {opt.label}
                              </p>
                              {opt.description && (
                                <p className="text-xs text-surface-400 mt-0.5">{opt.description}</p>
                              )}
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selected ? 'border-brand-500 bg-brand-500' : 'border-surface-300'
                            }`}>
                              {selected && <span className="text-white text-xs">✓</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* MULTIPLE SELECT */}
                  {question.type === 'multiple' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {question.options?.map((opt) => {
                        const selected = ((answers[question.id] as string[]) || []).includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleMultipleAnswer(question.id, opt.value)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition ${
                              selected
                                ? 'bg-brand-50 border-brand-400 ring-1 ring-brand-400'
                                : 'bg-white border-surface-200 hover:border-surface-300'
                            }`}
                          >
                            {opt.icon && <span className="text-lg flex-shrink-0">{opt.icon}</span>}
                            <span className={`text-sm font-medium flex-1 ${selected ? 'text-brand-700' : 'text-surface-700'}`}>
                              {opt.label}
                            </span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              selected ? 'border-brand-500 bg-brand-500' : 'border-surface-300'
                            }`}>
                              {selected && <span className="text-white text-[10px]">✓</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* SCALE */}
                  {question.type === 'scale' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                          const selected = answers[question.id] === val
                          const isLow = val <= 3
                          const isMid = val >= 4 && val <= 6
                          const isHigh = val >= 7
                          return (
                            <button
                              key={val}
                              onClick={() => handleScaleAnswer(question.id, val)}
                              className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                                selected
                                  ? isLow
                                    ? 'bg-brand-500 text-white ring-2 ring-brand-300'
                                    : isMid
                                    ? 'bg-yellow-500 text-white ring-2 ring-yellow-300'
                                    : 'bg-red-500 text-white ring-2 ring-red-300'
                                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                              }`}
                            >
                              {val}
                            </button>
                          )
                        })}
                      </div>
                      {question.scaleLabels && (
                        <div className="flex justify-between text-xs text-surface-400">
                          <span>{question.scaleLabels.min}</span>
                          <span>{question.scaleLabels.max}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TEXT */}
                  {question.type === 'text' && (
                    <textarea
                      value={(answers[question.id] as string) || ''}
                      onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none h-24 text-sm"
                      placeholder={question.placeholder}
                    />
                  )}

                  {/* Info Box */}
                  {question.infoBox && (
                    <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="text-blue-500 text-sm">ℹ️</span>
                      <p className="text-xs text-blue-700">{question.infoBox}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RESULT SCREEN */}
          {showResult && result && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200 text-center">
                <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-2xl font-heading font-bold text-surface-900 mb-2">
                  Avaliacao Completa!
                </h2>
                <p className="text-surface-500 text-sm max-w-md mx-auto">
                  {result.personalizedMessage}
                </p>
              </div>

              {/* Risk Level */}
              <div className={`p-4 rounded-2xl border ${
                result.riskLevel === 'high'
                  ? 'bg-red-50 border-red-200'
                  : result.riskLevel === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-brand-50 border-brand-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {result.riskLevel === 'high' ? '🔴' : result.riskLevel === 'medium' ? '🟡' : '🟢'}
                  </span>
                  <div>
                    <p className={`font-semibold text-sm ${
                      result.riskLevel === 'high' ? 'text-red-800' : result.riskLevel === 'medium' ? 'text-yellow-800' : 'text-brand-800'
                    }`}>
                      Nivel de atencao: {result.riskLevel === 'high' ? 'Alto' : result.riskLevel === 'medium' ? 'Moderado' : 'Baixo'}
                    </p>
                    <p className={`text-xs ${
                      result.riskLevel === 'high' ? 'text-red-600' : result.riskLevel === 'medium' ? 'text-yellow-600' : 'text-brand-600'
                    }`}>
                      {result.riskLevel === 'high'
                        ? 'Recomendamos consulta prioritaria com especialista'
                        : result.riskLevel === 'medium'
                        ? 'Avaliacao medica standard recomendada'
                        : 'Caso de baixa complexidade — otimo prognostico'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Specialties */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200">
                <h3 className="font-heading font-semibold text-surface-900 mb-3">
                  👨‍⚕️ Especialidades Recomendadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedSpecialties.map((spec) => (
                    <span
                      key={spec}
                      className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Consultation Focus */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200">
                <h3 className="font-heading font-semibold text-surface-900 mb-3">
                  📋 O que o medico vai abordar na consulta
                </h3>
                <div className="space-y-2">
                  {result.estimatedConsultationFocus.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-surface-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Products */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200">
                <h3 className="font-heading font-semibold text-surface-900 mb-3">
                  💊 Produtos que podem ser indicados
                </h3>
                <p className="text-xs text-surface-400 mb-3">
                  A prescricao final sera feita pelo medico durante a consulta
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.suggestedProducts.map((product) => (
                    <div
                      key={product}
                      className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200"
                    >
                      <span className="text-lg">💧</span>
                      <span className="text-sm text-surface-700">{product}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200">
                <h3 className="font-heading font-semibold text-surface-900 mb-3">
                  💰 Investimento
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                    <div>
                      <p className="text-sm font-medium text-surface-900">Consulta por video</p>
                      <p className="text-xs text-surface-400">30-45 min com especialista</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-heading font-bold text-brand-600">R$ 89,00</p>
                      <p className="text-xs text-surface-400">ou 10x de R$ 8,90</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <span>✅</span>
                    <span>Inclui: consulta completa + receita digital + prontuario eletronico + plano de tratamento</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <button
                  onClick={handleBookConsultation}
                  className="w-full py-4 rounded-2xl gradient-brand text-white font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-brand-500/25"
                >
                  Agendar Minha Consulta — R$89
                </button>
                <p className="text-center text-xs text-surface-400">
                  Suas respostas serao compartilhadas com o medico para agilizar a consulta
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      {!showResult && (
        <div className="fixed bottom-0 w-full bg-white border-t border-surface-200 p-4 z-50">
          <div className="max-w-2xl mx-auto flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl border border-surface-200 text-surface-600 font-medium hover:bg-surface-50 transition"
              >
                Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!isStepComplete}
              className="flex-1 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {currentStep === TOTAL_STEPS ? 'Ver Minha Avaliacao' : 'Continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
