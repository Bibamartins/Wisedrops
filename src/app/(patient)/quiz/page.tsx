'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ============================================================
// QUIZ DATA STRUCTURE
// ============================================================

interface QuizOption {
  value: string
  label: string
  icon?: string
  description?: string
  followUp?: string
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
  conditional?: { questionId: string; values: string[] }
  infoBox?: string
}

// 8-step quiz with conditional logic
const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── STEP 1: Quem é o paciente ────────────────────────
  {
    id: 'patient_for',
    step: 1,
    title: 'Para quem é o acompanhamento?',
    subtitle: 'Isso nos ajuda a personalizar cada pergunta para você.',
    type: 'single',
    required: true,
    options: [
      { value: 'myself', label: 'Para mim', description: 'Quero iniciar meu próprio tratamento' },
      { value: 'child', label: 'Para meu filho ou filha', description: 'Menor de 18 anos' },
      { value: 'family', label: 'Para um familiar', description: 'Pai, mãe, cônjuge ou outro' },
      { value: 'other', label: 'Para outra pessoa', description: 'Amigo ou conhecido' },
    ],
  },

  // ── STEP 2: Condições principais ─────────────────────
  {
    id: 'conditions',
    step: 2,
    title: 'O que você quer tratar?',
    subtitle: 'Selecione tudo que se aplicar — não há resposta errada.',
    type: 'multiple',
    required: true,
    options: [
      { value: 'insomnia', label: 'Insônia ou dificuldade para dormir' },
      { value: 'anxiety', label: 'Ansiedade' },
      { value: 'chronic_pain', label: 'Dor crônica' },
      { value: 'depression', label: 'Depressão' },
      { value: 'epilepsy', label: 'Epilepsia ou convulsões' },
      { value: 'autism', label: 'Autismo (TEA)' },
      { value: 'fibromyalgia', label: 'Fibromialgia' },
      { value: 'migraine', label: 'Enxaqueca ou cefaleia' },
      { value: 'parkinson', label: 'Parkinson' },
      { value: 'ptsd', label: 'Estresse pós-traumático (TEPT)' },
      { value: 'cancer', label: 'Oncologia — efeitos de quimioterapia' },
      { value: 'adhd', label: 'TDAH' },
      { value: 'appetite', label: 'Falta de apetite ou náusea' },
      { value: 'inflammation', label: 'Inflamação crônica' },
      { value: 'other', label: 'Outra condição' },
    ],
  },

  // ── STEP 3: Severidade ───────────────────────────────
  {
    id: 'severity',
    step: 3,
    title: 'Com que intensidade esses sintomas afetam você?',
    subtitle: 'Pense na média dos últimos 30 dias.',
    type: 'scale',
    required: true,
    min: 1,
    max: 10,
    scaleLabels: { min: 'Incomoda pouco', max: 'Impacta muito minha vida' },
  },
  {
    id: 'symptom_duration',
    step: 3,
    title: 'Há quanto tempo você convive com isso?',
    type: 'single',
    required: true,
    options: [
      { value: 'less_1month', label: 'Menos de 1 mês' },
      { value: '1_6months', label: '1 a 6 meses' },
      { value: '6_12months', label: '6 meses a 1 ano' },
      { value: '1_3years', label: '1 a 3 anos' },
      { value: '3_5years', label: '3 a 5 anos' },
      { value: 'more_5years', label: 'Mais de 5 anos' },
    ],
  },

  // ── STEP 4: Impacto na vida ──────────────────────────
  {
    id: 'daily_impact',
    step: 4,
    title: 'Em quais áreas da sua vida você sente esse impacto?',
    subtitle: 'Selecione tudo que se aplicar.',
    type: 'multiple',
    required: true,
    options: [
      { value: 'sleep', label: 'Sono — não consigo descansar bem' },
      { value: 'work', label: 'Trabalho ou estudos' },
      { value: 'social', label: 'Relacionamentos e vida social' },
      { value: 'exercise', label: 'Atividade física' },
      { value: 'mood', label: 'Humor e bem-estar emocional' },
      { value: 'appetite', label: 'Alimentação e apetite' },
      { value: 'focus', label: 'Concentração e memória' },
      { value: 'daily_tasks', label: 'Tarefas do dia a dia' },
      { value: 'none', label: 'Não afeta significativamente' },
    ],
  },

  // ── STEP 5: Tratamentos anteriores ───────────────────
  {
    id: 'previous_treatments',
    step: 5,
    title: 'Quais tratamentos você já experimentou?',
    subtitle: 'Selecione todos que já usou para esta condição.',
    type: 'multiple',
    required: true,
    options: [
      { value: 'conventional_meds', label: 'Medicamentos com receita médica' },
      { value: 'otc', label: 'Medicamentos sem receita (analgésicos etc.)' },
      { value: 'therapy', label: 'Psicoterapia ou terapia' },
      { value: 'acupuncture', label: 'Acupuntura' },
      { value: 'physiotherapy', label: 'Fisioterapia' },
      { value: 'meditation', label: 'Meditação ou mindfulness' },
      { value: 'cannabis_informal', label: 'Cannabis sem acompanhamento médico' },
      { value: 'cannabis_medical', label: 'Cannabis medicinal com prescrição' },
      { value: 'none', label: 'Nenhum tratamento ainda' },
    ],
    infoBox: 'Todas as suas respostas são confidenciais e protegidas pela LGPD.',
  },
  {
    id: 'conventional_effectiveness',
    step: 5,
    title: 'Como foi a sua experiência com os medicamentos convencionais?',
    type: 'single',
    required: true,
    conditional: { questionId: 'previous_treatments', values: ['conventional_meds'] },
    options: [
      { value: 'effective', label: 'Funcionaram bem' },
      { value: 'partial', label: 'Funcionaram parcialmente' },
      { value: 'side_effects', label: 'Funcionaram, mas com efeitos colaterais significativos' },
      { value: 'ineffective', label: 'Não funcionaram' },
      { value: 'stopped', label: 'Parei o uso por conta própria' },
    ],
  },

  // ── STEP 6: Experiência com cannabis ─────────────────
  {
    id: 'cannabis_experience',
    step: 6,
    title: 'Qual é a sua relação atual com a cannabis medicinal?',
    type: 'single',
    required: true,
    options: [
      { value: 'never', label: 'Nunca usei', description: 'Estou pesquisando pela primeira vez' },
      { value: 'researching', label: 'Estou pesquisando, mas nunca usei', description: 'Li artigos ou ouvi relatos' },
      { value: 'informal', label: 'Já usei sem acompanhamento médico', description: 'Uso próprio, sem prescrição' },
      { value: 'medical', label: 'Uso ou já usei com prescrição', description: 'Com acompanhamento médico' },
    ],
    infoBox: 'Cannabis medicinal é legal no Brasil com prescrição médica, regulamentada pela ANVISA (RDC 327/2019 e RDC 660/2022).',
  },
  {
    id: 'cannabis_products_used',
    step: 6,
    title: 'Quais tipos de produto você já usou?',
    type: 'multiple',
    required: true,
    conditional: { questionId: 'cannabis_experience', values: ['informal', 'medical'] },
    options: [
      { value: 'oil_cbd', label: 'Óleo de CBD' },
      { value: 'oil_thc', label: 'Óleo com THC' },
      { value: 'capsule', label: 'Cápsulas' },
      { value: 'gummy', label: 'Gomas ou comestíveis' },
      { value: 'topical', label: 'Tópico — creme ou pomada' },
      { value: 'flower', label: 'Flor ou vaporização' },
      { value: 'other', label: 'Outro' },
    ],
  },
  {
    id: 'cannabis_effectiveness',
    step: 6,
    title: 'Como a cannabis medicinal afetou seus sintomas?',
    type: 'single',
    required: true,
    conditional: { questionId: 'cannabis_experience', values: ['informal', 'medical'] },
    options: [
      { value: 'very_effective', label: 'Melhora significativa' },
      { value: 'somewhat', label: 'Alguma melhora' },
      { value: 'unsure', label: 'Não tenho certeza' },
      { value: 'not_effective', label: 'Não senti diferença' },
    ],
  },

  // ── STEP 7: Saúde geral ──────────────────────────────
  {
    id: 'current_medications',
    step: 7,
    title: 'Você toma algum medicamento atualmente?',
    type: 'single',
    required: true,
    options: [
      { value: 'yes', label: 'Sim' },
      { value: 'no', label: 'Não' },
    ],
    infoBox: 'Essa informação é essencial para o médico avaliar possíveis interações.',
  },
  {
    id: 'medications_list',
    step: 7,
    title: 'Quais medicamentos você toma?',
    subtitle: 'Liste os nomes — não precisa lembrar a dosagem exata.',
    type: 'text',
    required: false,
    conditional: { questionId: 'current_medications', values: ['yes'] },
    placeholder: 'Ex: Rivotril, Escitalopram, Tramadol, Dipirona…',
  },
  {
    id: 'allergies',
    step: 7,
    title: 'Você tem alguma alergia conhecida?',
    type: 'single',
    required: true,
    options: [
      { value: 'none', label: 'Nenhuma alergia conhecida' },
      { value: 'medications', label: 'Sim, a medicamentos' },
      { value: 'food', label: 'Sim, alimentar' },
      { value: 'multiple', label: 'Sim, múltiplas' },
    ],
  },
  {
    id: 'health_conditions',
    step: 7,
    title: 'Você tem alguma dessas condições de saúde?',
    subtitle: 'Selecione todas que se aplicam.',
    type: 'multiple',
    required: false,
    options: [
      { value: 'hypertension', label: 'Hipertensão' },
      { value: 'diabetes', label: 'Diabetes' },
      { value: 'heart_disease', label: 'Doença cardíaca' },
      { value: 'liver_disease', label: 'Doença hepática' },
      { value: 'kidney_disease', label: 'Doença renal' },
      { value: 'pregnancy', label: 'Gravidez ou amamentação' },
      { value: 'mental_health', label: 'Transtorno psiquiátrico diagnosticado' },
      { value: 'none', label: 'Nenhuma' },
    ],
  },

  // ── STEP 8: Expectativas ─────────────────────────────
  {
    id: 'treatment_goals',
    step: 8,
    title: 'O que você espera alcançar com o tratamento?',
    subtitle: 'Selecione seus principais objetivos.',
    type: 'multiple',
    required: true,
    options: [
      { value: 'reduce_pain', label: 'Reduzir a dor' },
      { value: 'better_sleep', label: 'Dormir melhor' },
      { value: 'less_anxiety', label: 'Diminuir a ansiedade' },
      { value: 'better_mood', label: 'Melhorar o humor' },
      { value: 'reduce_meds', label: 'Reduzir medicamentos convencionais' },
      { value: 'quality_of_life', label: 'Qualidade de vida geral' },
      { value: 'more_focus', label: 'Mais foco e concentração' },
      { value: 'appetite', label: 'Recuperar o apetite' },
    ],
  },
  {
    id: 'urgency',
    step: 8,
    title: 'Qual é a sua urgência?',
    type: 'single',
    required: true,
    options: [
      { value: 'asap', label: 'Quero começar o quanto antes' },
      { value: 'this_week', label: 'Nas próximas semanas' },
      { value: 'exploring', label: 'Ainda estou explorando' },
    ],
  },
  {
    id: 'product_preference',
    step: 8,
    title: 'Tem preferência por algum tipo de produto?',
    subtitle: 'O médico fará a recomendação final — isso é apenas uma preferência sua.',
    type: 'single',
    required: false,
    options: [
      { value: 'oil', label: 'Óleo sublingual', description: 'O mais versátil e comum' },
      { value: 'capsule', label: 'Cápsulas', description: 'Dosagem precisa e prática' },
      { value: 'gummy', label: 'Gomas', description: 'Fácil de incorporar à rotina' },
      { value: 'topical', label: 'Tópico', description: 'Para dor localizada' },
      { value: 'no_preference', label: 'Sem preferência — quero a indicação do médico' },
    ],
  },
]

const TOTAL_STEPS = 8

// Step labels — sem emojis, usados só na barra de progresso interna
const STEP_LABELS = [
  'Paciente', 'Condições', 'Sintomas', 'Impacto',
  'Histórico', 'Cannabis', 'Saúde', 'Objetivos',
]

// ============================================================
// RECOMMENDATION ENGINE (lógica preservada integralmente)
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

  const specialties: string[] = []
  if (conditions.includes('epilepsy') || conditions.includes('parkinson') || conditions.includes('migraine')) {
    specialties.push('Neurologia')
  }
  if (conditions.includes('anxiety') || conditions.includes('depression') || conditions.includes('ptsd') || conditions.includes('adhd')) {
    specialties.push('Psiquiatria')
  }
  if (conditions.includes('chronic_pain') || conditions.includes('fibromyalgia')) {
    specialties.push('Clínica da Dor')
  }
  if (conditions.includes('cancer')) {
    specialties.push('Oncologia')
  }
  if (conditions.includes('autism')) {
    specialties.push('Neurologia', 'Psiquiatria')
  }
  if (specialties.length === 0) specialties.push('Clínica Geral', 'Cannabis Medicinal')

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (severity >= 8 || healthConditions.includes('pregnancy') || healthConditions.includes('heart_disease')) {
    riskLevel = 'high'
  } else if (severity >= 5 || conditions.length >= 3 || healthConditions.length >= 2) {
    riskLevel = 'medium'
  }

  const conditionPriority: Record<string, number> = {
    epilepsy: 10, cancer: 10, parkinson: 9, autism: 8,
    chronic_pain: 7, fibromyalgia: 7, depression: 6, anxiety: 5,
    insomnia: 4, migraine: 4, ptsd: 6, adhd: 3,
  }
  const priorityCondition = conditions.sort(
    (a, b) => (conditionPriority[b] || 0) - (conditionPriority[a] || 0)
  )[0] || 'general'

  const products: string[] = []
  if (conditions.includes('insomnia')) products.push('CBD Oil + Melatonina', 'CBD Sleep Gummies')
  if (conditions.includes('chronic_pain') || conditions.includes('fibromyalgia')) products.push('CBD Full Spectrum Oil', 'CBD Topical Roll-On')
  if (conditions.includes('anxiety') || conditions.includes('depression')) products.push('CBD Broad Spectrum Oil', 'CBD Cápsulas')
  if (conditions.includes('epilepsy')) products.push('CBD Isolate Oil (alta concentração)')
  if (products.length === 0) products.push('CBD Full Spectrum Oil')

  const conditionLabels: Record<string, string> = {
    insomnia: 'insônia', anxiety: 'ansiedade', chronic_pain: 'dor crônica',
    depression: 'depressão', epilepsy: 'epilepsia', autism: 'autismo',
    fibromyalgia: 'fibromialgia', migraine: 'enxaqueca', parkinson: 'parkinson',
    ptsd: 'estresse pós-traumático', cancer: 'suporte oncológico', adhd: 'TDAH',
    appetite: 'apetite', inflammation: 'inflamação',
  }

  const mainConditions = conditions.slice(0, 2).map((c) => conditionLabels[c] || c).join(' e ')
  let message = `Com base nas suas respostas, identificamos que você busca tratamento para ${mainConditions}.`

  if (experience === 'never' || experience === 'researching') {
    message += ' Como é sua primeira experiência com cannabis medicinal, nosso médico vai explicar tudo com calma e começar com doses baixas.'
  } else if (experience === 'medical') {
    message += ' Como você já tem experiência com tratamento médico, podemos otimizar seu regime atual.'
  }

  if (riskLevel === 'high') {
    message += ' Identificamos alguns pontos que merecem atenção especial — o médico vai avaliar com cuidado.'
  }

  const focus: string[] = ['Avaliação clínica completa']
  if (experience === 'never') focus.push('Educação sobre cannabis medicinal')
  if (answers.current_medications === 'yes') focus.push('Revisão de interações medicamentosas')
  if (severity >= 7) focus.push('Plano de manejo de sintomas intensos')
  if (goals.includes('reduce_meds')) focus.push('Estratégia de redução de medicamentos')
  focus.push('Prescrição personalizada')

  return {
    recommendedSpecialties: Array.from(new Set(specialties)),
    riskLevel,
    personalizedMessage: message,
    suggestedProducts: Array.from(new Set(products)),
    estimatedConsultationFocus: focus,
    priorityCondition,
  }
}

// ============================================================
// SUB-COMPONENTES INTERNOS
// ============================================================

// Opção de seleção única — card interativo
function SingleOption({
  option,
  selected,
  onClick,
}: {
  option: QuizOption
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'w-full flex items-center gap-4 px-5 py-4 rounded-lg border text-left',
        'transition-all duration-150',
        selected
          ? 'bg-brand-50 border-brand-600 shadow-focus-brand'
          : 'bg-white border-surface-200 hover:border-surface-300 hover:shadow-sm',
      )}
    >
      {/* Conteúdo textual */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium leading-snug',
            selected ? 'text-brand-700' : 'text-surface-800',
          )}
        >
          {option.label}
        </p>
        {option.description && (
          <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">
            {option.description}
          </p>
        )}
      </div>

      {/* Indicador circular */}
      <span
        aria-hidden="true"
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-150',
          selected ? 'border-brand-600 bg-brand-600' : 'border-surface-300',
        )}
      >
        {selected && <Check size={11} strokeWidth={3} className="text-white" />}
      </span>
    </button>
  )
}

// Opção de seleção múltipla — card compacto com checkbox
function MultipleOption({
  option,
  selected,
  onClick,
}: {
  option: QuizOption
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border text-left w-full',
        'transition-all duration-150',
        selected
          ? 'bg-brand-50 border-brand-600'
          : 'bg-white border-surface-200 hover:border-surface-300 hover:bg-surface-50',
      )}
    >
      {/* Checkbox */}
      <span
        aria-hidden="true"
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-150',
          selected ? 'border-brand-600 bg-brand-600' : 'border-surface-300',
        )}
      >
        {selected && <Check size={10} strokeWidth={3} className="text-white" />}
      </span>
      <span
        className={cn(
          'text-sm font-medium flex-1 leading-snug',
          selected ? 'text-brand-700' : 'text-surface-700',
        )}
      >
        {option.label}
      </span>
    </button>
  )
}

// Escala de 1–10 com track colorido
function ScaleInput({
  questionId,
  value,
  scaleLabels,
  onChange,
}: {
  questionId: string
  value: number | undefined
  scaleLabels?: { min: string; max: string }
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-5">
      {/* Botões numéricos */}
      <div className="flex gap-1.5" role="group" aria-label="Escala de 1 a 10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
          const isSelected = value === val
          const isFilled = value !== undefined && val <= value
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              aria-pressed={isSelected}
              aria-label={`${val} de 10`}
              className={cn(
                'flex-1 h-11 rounded-md text-sm font-semibold transition-all duration-150',
                isSelected
                  ? 'bg-brand-600 text-white shadow-focus-brand scale-105'
                  : isFilled
                  ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                  : 'bg-surface-100 text-surface-500 hover:bg-surface-200',
              )}
            >
              {val}
            </button>
          )
        })}
      </div>

      {/* Track visual */}
      <div className="h-1 bg-surface-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-200 ease-out"
          style={{ width: value ? `${((value - 1) / 9) * 100}%` : '0%' }}
        />
      </div>

      {/* Labels */}
      {scaleLabels && (
        <div className="flex justify-between">
          <span className="text-xs text-surface-500">{scaleLabels.min}</span>
          <span className="text-xs text-surface-500">{scaleLabels.max}</span>
        </div>
      )}
    </div>
  )
}

// Card de pergunta individual
function QuestionCard({ question, answers, onSingle, onMultiple, onScale, onText }: {
  question: QuizQuestion
  answers: Record<string, string | string[] | number>
  onSingle: (id: string, v: string) => void
  onMultiple: (id: string, v: string) => void
  onScale: (id: string, v: number) => void
  onText: (id: string, v: string) => void
}) {
  return (
    <div className="animate-[slide-up_200ms_cubic-bezier(0.16,1,0.3,1)]">
      {/* Texto da pergunta */}
      <div className="mb-8">
        <h2 className="font-heading text-h2 text-surface-900 tracking-tight text-balance">
          {question.title}
        </h2>
        {question.subtitle && (
          <p className="mt-2 text-body-lg text-surface-600 leading-relaxed">
            {question.subtitle}
          </p>
        )}
      </div>

      {/* SINGLE SELECT */}
      {question.type === 'single' && (
        <div className="space-y-2.5">
          {question.options?.map((opt) => (
            <SingleOption
              key={opt.value}
              option={opt}
              selected={answers[question.id] === opt.value}
              onClick={() => onSingle(question.id, opt.value)}
            />
          ))}
        </div>
      )}

      {/* MULTIPLE SELECT */}
      {question.type === 'multiple' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options?.map((opt) => (
            <MultipleOption
              key={opt.value}
              option={opt}
              selected={((answers[question.id] as string[]) || []).includes(opt.value)}
              onClick={() => onMultiple(question.id, opt.value)}
            />
          ))}
        </div>
      )}

      {/* SCALE */}
      {question.type === 'scale' && (
        <ScaleInput
          questionId={question.id}
          value={answers[question.id] as number | undefined}
          scaleLabels={question.scaleLabels}
          onChange={(v) => onScale(question.id, v)}
        />
      )}

      {/* TEXT */}
      {question.type === 'text' && (
        <textarea
          value={(answers[question.id] as string) || ''}
          onChange={(e) => onText(question.id, e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className={cn(
            'w-full px-4 py-3 rounded-lg border border-surface-300 bg-white',
            'text-sm text-surface-800 placeholder:text-surface-400',
            'transition-colors duration-150 resize-none',
            'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
          )}
        />
      )}

      {/* Info Box */}
      {question.infoBox && (
        <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-lg bg-info-50 border border-info-100">
          <Info size={14} strokeWidth={2} className="text-info-600 mt-0.5 shrink-0" />
          <p className="text-xs text-info-700 leading-relaxed">{question.infoBox}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PatientQuizPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // Filtra perguntas do step atual respeitando condicionais
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

  // Verifica se o step está completo
  const isStepComplete = currentQuestions
    .filter((q) => q.required)
    .every((q) => {
      const answer = answers[q.id]
      if (answer === undefined || answer === null) return false
      if (Array.isArray(answer)) return answer.length > 0
      if (typeof answer === 'string') return answer.length > 0
      return true
    })

  // Progresso em %
  const progress = showResult ? 100 : Math.round(((currentStep - 1) / TOTAL_STEPS) * 100)

  const handleNext = () => {
    if (!isStepComplete) return
    if (currentStep < TOTAL_STEPS) {
      setTransitioning(true)
      setTimeout(() => {
        setCurrentStep((s) => s + 1)
        setTransitioning(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 200)
    } else {
      const recommendation = generateRecommendation(answers)
      setResult(recommendation)
      setShowResult(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (showResult) {
      setShowResult(false)
      return
    }
    if (currentStep > 1) {
      setTransitioning(true)
      setTimeout(() => {
        setCurrentStep((s) => s - 1)
        setTransitioning(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 200)
    }
  }

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleMultipleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || []
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
    localStorage.setItem('wisedrops_quiz', JSON.stringify({ answers, result }))
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

  // ── RENDER ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-50">

      {/* ── HEADER FIXO ────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md"
          >
            <div className="w-7 h-7 rounded-md gradient-brand flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs font-heading">W</span>
            </div>
            <span className="font-heading font-semibold text-surface-900 text-sm">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>

          {/* Contador de pergunta */}
          {!showResult && (
            <span className="text-overline text-surface-500 uppercase tracking-wider text-[11px]">
              Etapa {currentStep} de {TOTAL_STEPS}
            </span>
          )}
        </div>

        {/* Progress bar premium */}
        <div className="h-0.5 bg-surface-200">
          <div
            className="h-full bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso do diagnóstico: ${progress}%`}
          />
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ─────────────────────────────── */}
      <main className="pt-20 pb-32 px-5">
        <div className="max-w-2xl mx-auto">

          {/* Step dots — minimalistas, só indicadores de posição */}
          {!showResult && (
            <div className="flex items-center justify-center gap-1.5 mt-8 mb-10" aria-hidden="true">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                const step = i + 1
                const isActive = step === currentStep
                const isDone = step < currentStep
                return (
                  <span
                    key={step}
                    title={STEP_LABELS[i]}
                    className={cn(
                      'rounded-full transition-all duration-200',
                      isActive ? 'w-5 h-1.5 bg-brand-600' : isDone ? 'w-1.5 h-1.5 bg-brand-300' : 'w-1.5 h-1.5 bg-surface-200',
                    )}
                  />
                )
              })}
            </div>
          )}

          {/* ── PERGUNTAS ──────────────────────────────────── */}
          {!showResult && (
            <div
              className={cn(
                'space-y-12 transition-opacity duration-200',
                transitioning ? 'opacity-0' : 'opacity-100',
              )}
            >
              {currentQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  answers={answers}
                  onSingle={handleSingleAnswer}
                  onMultiple={handleMultipleAnswer}
                  onScale={handleScaleAnswer}
                  onText={handleTextAnswer}
                />
              ))}
            </div>
          )}

          {/* ── TELA DE RESULTADO ──────────────────────────── */}
          {showResult && result && (
            <div className="pt-8 space-y-6 animate-[slide-up_300ms_cubic-bezier(0.16,1,0.3,1)]">

              {/* Hero de conclusão */}
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success-50 mb-6">
                  <CheckCircle2 size={32} strokeWidth={1.5} className="text-success-600" />
                </div>
                <h1 className="font-heading text-h1 text-surface-900 tracking-tight mb-3">
                  Diagnóstico completo
                </h1>
                <p className="text-body-lg text-surface-600 max-w-md mx-auto leading-relaxed">
                  {result.personalizedMessage}
                </p>
              </div>

              {/* Nível de atenção */}
              <div
                className={cn(
                  'rounded-xl border px-5 py-4',
                  result.riskLevel === 'high'
                    ? 'bg-error-50 border-error-100'
                    : result.riskLevel === 'medium'
                    ? 'bg-warning-50 border-warning-100'
                    : 'bg-success-50 border-success-100',
                )}
              >
                <p
                  className={cn(
                    'text-sm font-semibold mb-0.5',
                    result.riskLevel === 'high'
                      ? 'text-error-700'
                      : result.riskLevel === 'medium'
                      ? 'text-warning-700'
                      : 'text-success-700',
                  )}
                >
                  Nível de atenção:{' '}
                  {result.riskLevel === 'high' ? 'Alto' : result.riskLevel === 'medium' ? 'Moderado' : 'Baixo'}
                </p>
                <p
                  className={cn(
                    'text-xs',
                    result.riskLevel === 'high'
                      ? 'text-error-600'
                      : result.riskLevel === 'medium'
                      ? 'text-warning-600'
                      : 'text-success-600',
                  )}
                >
                  {result.riskLevel === 'high'
                    ? 'Recomendamos consulta prioritária com especialista'
                    : result.riskLevel === 'medium'
                    ? 'Avaliação médica padrão recomendada'
                    : 'Caso de baixa complexidade — ótimo prognóstico'}
                </p>
              </div>

              {/* Especialidades e foco — lado a lado em desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Especialidades recomendadas */}
                <div className="bg-white border border-surface-200 rounded-xl shadow-xs p-5">
                  <p className="text-overline text-surface-500 uppercase tracking-wider mb-3">
                    Especialidades
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedSpecialties.map((spec) => (
                      <Badge key={spec} variant="brand">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Foco da consulta */}
                <div className="bg-white border border-surface-200 rounded-xl shadow-xs p-5">
                  <p className="text-overline text-surface-500 uppercase tracking-wider mb-3">
                    O médico vai abordar
                  </p>
                  <ol className="space-y-2">
                    {result.estimatedConsultationFocus.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-sm bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-surface-700 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Produtos sugeridos */}
              <div className="bg-white border border-surface-200 rounded-xl shadow-xs p-5">
                <p className="text-overline text-surface-500 uppercase tracking-wider mb-1">
                  Produtos que podem ser indicados
                </p>
                <p className="text-xs text-surface-500 mb-4">
                  A prescrição final será feita pelo médico durante a consulta.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.suggestedProducts.map((product) => (
                    <div
                      key={product}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-50 border border-surface-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                      <span className="text-sm text-surface-700">{product}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investimento */}
              <div className="bg-white border border-surface-200 rounded-xl shadow-xs p-5">
                <p className="text-overline text-surface-500 uppercase tracking-wider mb-4">
                  Investimento
                </p>
                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-50 border border-surface-200 mb-3">
                  <div>
                    <p className="text-sm font-medium text-surface-900">Consulta por vídeo</p>
                    <p className="text-xs text-surface-500 mt-0.5">30–45 min com especialista</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-h3 text-brand-700 font-semibold">R$&nbsp;89</p>
                    <p className="text-xs text-surface-400">ou 10x de R$&nbsp;8,90</p>
                  </div>
                </div>
                <p className="text-xs text-surface-500 leading-relaxed">
                  Inclui consulta completa, receita digital, prontuário eletrônico e plano de tratamento.
                </p>
              </div>

              {/* CTAs finais */}
              <div className="space-y-3 pb-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleBookConsultation}
                  iconRight={<ArrowRight size={20} strokeWidth={2} />}
                >
                  Encontrar meu médico — R$&nbsp;89
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setShowResult(false)
                    setCurrentStep(1)
                    setAnswers({})
                    setResult(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Refazer o diagnóstico
                </Button>
                <p className="text-center text-xs text-surface-400 leading-relaxed">
                  Suas respostas serão compartilhadas com o médico para agilizar a consulta.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── NAVEGAÇÃO INFERIOR FIXA ────────────────────────── */}
      {!showResult && (
        <nav
          aria-label="Navegação do quiz"
          className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-surface-200 shadow-lg"
        >
          <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-3">
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                size="lg"
                onClick={handleBack}
                iconLeft={<ArrowLeft size={20} strokeWidth={2} />}
                className="shrink-0"
                aria-label="Voltar para a etapa anterior"
              >
                Voltar
              </Button>
            ) : (
              // Placeholder para manter o botão Continuar à direita no step 1
              <div className="shrink-0 w-[108px]" />
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={!isStepComplete}
              iconRight={<ArrowRight size={20} strokeWidth={2} />}
              className="flex-1"
              aria-disabled={!isStepComplete}
            >
              {currentStep === TOTAL_STEPS ? 'Ver meu diagnóstico' : 'Continuar'}
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
