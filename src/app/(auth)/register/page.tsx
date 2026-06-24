'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// Register Page — layout split 2 colunas, wizard 3 etapas
// Logica de mutation/auth mantida intacta (trpc.auth.registerPatient)
// ---------------------------------------------------------------------------

const CONDITION_OPTIONS = [
  'Dor Cronica',
  'Insonia',
  'Ansiedade',
  'Depressao',
  'Epilepsia',
  'Autismo',
  'Fibromialgia',
  'Enxaqueca',
  'Parkinson',
  'Oncologia',
  'Outra condicao',
]

const EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'Nunca usei cannabis medicinal' },
  { value: 'unsupervised', label: 'Ja usei sem acompanhamento medico' },
  { value: 'supervised', label: 'Uso com acompanhamento medico' },
  { value: 'prefer_not_to_say', label: 'Prefiro nao dizer' },
]

const PATIENT_FOR_OPTIONS = [
  'Para mim',
  'Para meu filho(a)',
  'Para familiar',
  'Para outra pessoa',
]

const STEP_LABELS = ['Avaliacao', 'Dados pessoais', 'Criar conta']

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8" aria-label="Progresso do cadastro">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const isPast = step < current
        const isCurrent = step === current
        return (
          <div key={label} className="flex-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                isPast || isCurrent ? 'bg-brand-600' : 'bg-surface-200'
              }`}
              role="presentation"
            />
            <p
              className={`text-[10px] mt-1.5 font-medium ${
                isCurrent ? 'text-brand-700' : 'text-surface-400'
              }`}
            >
              {label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    // Step 1: Conditions
    conditions: [] as string[],
    patientFor: '',
    experience: '',
    // Step 2: Personal
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
    dateOfBirth: '',
    gender: '',
    // Step 3: Password
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptLgpd: false,
  })

  const toggleCondition = (c: string) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter((x) => x !== c)
        : [...prev.conditions, c],
    }))
  }

  const registerMutation = trpc.auth.registerPatient.useMutation()

  const handleSubmit = async () => {
    setLoading(true)
    setErrorMsg('')

    // Validacao basica de senha
    if (form.password.length < 8) {
      setErrorMsg('A senha deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg('As senhas nao coincidem. Verifique e tente novamente.')
      setLoading(false)
      return
    }

    // Strip non-digits
    const cpfClean = form.cpf.replace(/\D/g, '')
    const genderUpper = form.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'

    try {
      await registerMutation.mutateAsync({
        email: form.email.toLowerCase().trim(),
        password: form.password,
        fullName: form.fullName,
        cpf: cpfClean,
        phone: form.phone.replace(/\D/g, ''),
        dateOfBirth: form.dateOfBirth,
        gender: genderUpper,
      })

      // Auto-login apos cadastro
      const signInResult = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      })

      setLoading(false)

      if (!signInResult || signInResult.error) {
        setErrorMsg('Conta criada! Mas nao conseguimos fazer login automatico. Tente entrar manualmente.')
        router.push('/login')
        return
      }

      // Sucesso: redirecionar para quiz
      router.push('/quiz')
      router.refresh()
    } catch (err: unknown) {
      setLoading(false)
      const message = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.'
      setErrorMsg(message)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-50">

      {/* ------------------------------------------------------------------ */}
      {/* Coluna esquerda — wizard de cadastro (100% mobile, ~45% desktop)   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 lg:max-w-[560px] flex items-start justify-center px-5 sm:px-10 py-10">
        <div className="w-full max-w-lg">

          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-xs group-hover:bg-brand-700 transition-colors duration-150">
              <span className="text-white font-heading font-bold text-sm leading-none">W</span>
            </div>
            <span className="font-heading font-semibold text-lg text-surface-900 tracking-tight">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>

          {/* Progresso */}
          <StepIndicator current={step} />

          {/* ---- Step 1: Avaliacao ---- */}
          {step === 1 && (
            <Card variant="default" padding="lg" className="shadow-sm">
              <div className="mb-6">
                <h2 className="font-heading font-semibold text-h2 text-surface-900 tracking-tight mb-1.5">
                  Vamos comecar
                </h2>
                <p className="text-sm text-surface-600">
                  Em 1 minuto voce esta dentro. Conte-nos um pouco sobre voce.
                </p>
              </div>

              <div className="space-y-6">
                {/* Condicoes */}
                <div>
                  <p className="text-sm font-medium text-surface-700 mb-3">
                    Quais condicoes voce quer tratar?{' '}
                    <span className="text-error-600 ml-0.5" aria-hidden="true">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CONDITION_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCondition(c)}
                        aria-pressed={form.conditions.includes(c)}
                        className={`px-3 py-2.5 rounded text-sm font-medium border transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          form.conditions.includes(c)
                            ? 'bg-brand-50 border-brand-300 text-brand-700'
                            : 'bg-white border-surface-200 text-surface-700 hover:border-surface-300 hover:bg-surface-50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Para quem */}
                <div>
                  <p className="text-sm font-medium text-surface-700 mb-3">
                    O tratamento e para quem?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PATIENT_FOR_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, patientFor: opt }))}
                        aria-pressed={form.patientFor === opt}
                        className={`px-3 py-2.5 rounded text-sm font-medium border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          form.patientFor === opt
                            ? 'bg-brand-50 border-brand-300 text-brand-700'
                            : 'bg-white border-surface-200 text-surface-700 hover:border-surface-300 hover:bg-surface-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experiencia */}
                <div>
                  <p className="text-sm font-medium text-surface-700 mb-3">
                    Sua experiencia com cannabis medicinal
                  </p>
                  <div className="space-y-2">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, experience: opt.value }))}
                        aria-pressed={form.experience === opt.value}
                        className={`w-full px-4 py-3 rounded text-sm font-medium border transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          form.experience === opt.value
                            ? 'bg-brand-50 border-brand-300 text-brand-700'
                            : 'bg-white border-surface-200 text-surface-700 hover:border-surface-300 hover:bg-surface-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                disabled={form.conditions.length === 0}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </Card>
          )}

          {/* ---- Step 2: Dados pessoais ---- */}
          {step === 2 && (
            <Card variant="default" padding="lg" className="shadow-sm">
              <div className="mb-6">
                <h2 className="font-heading font-semibold text-h2 text-surface-900 tracking-tight mb-1.5">
                  Seus dados
                </h2>
                <p className="text-sm text-surface-600">
                  Protegidos pela LGPD — usados exclusivamente para seu tratamento.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nome completo"
                  type="text"
                  placeholder="Seu nome completo"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  autoComplete="name"
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    autoComplete="tel"
                    required
                  />
                  <Input
                    label="CPF"
                    type="text"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Data de nascimento"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    autoComplete="bday"
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="gender" className="text-sm font-medium text-surface-700 leading-none">
                      Genero <span className="text-error-600 ml-0.5" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="gender"
                      value={form.gender}
                      onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                      className="w-full rounded border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors duration-150 hover:border-surface-400 disabled:bg-surface-50 disabled:text-surface-400"
                    >
                      <option value="">Selecione</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Feminino</option>
                      <option value="OTHER">Outro</option>
                      <option value="PREFER_NOT_TO_SAY">Prefiro nao dizer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(3)}
                >
                  Continuar
                </Button>
              </div>
            </Card>
          )}

          {/* ---- Step 3: Criar conta ---- */}
          {step === 3 && (
            <Card variant="default" padding="lg" className="shadow-sm">
              <div className="mb-6">
                <h2 className="font-heading font-semibold text-h2 text-surface-900 tracking-tight mb-1.5">
                  Crie sua conta
                </h2>
                <p className="text-sm text-surface-600">
                  Ultimo passo — escolha uma senha segura.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                  helper="Use pelo menos 8 caracteres com letras e numeros"
                  required
                />

                <Input
                  label="Confirmar senha"
                  type="password"
                  placeholder="Repita a senha"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                  error={
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'As senhas nao coincidem'
                      : undefined
                  }
                  required
                />

                {/* Checkboxes de consentimento */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.acceptTerms}
                      onChange={(e) => setForm((p) => ({ ...p, acceptTerms: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm text-surface-600 leading-relaxed">
                      Li e aceito os{' '}
                      <a href="#" className="text-brand-700 hover:text-brand-800 underline underline-offset-2">
                        Termos de Uso
                      </a>{' '}
                      e a{' '}
                      <a href="#" className="text-brand-700 hover:text-brand-800 underline underline-offset-2">
                        Politica de Privacidade
                      </a>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.acceptLgpd}
                      onChange={(e) => setForm((p) => ({ ...p, acceptLgpd: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm text-surface-600 leading-relaxed">
                      Autorizo o tratamento dos meus dados pessoais e de saude conforme a{' '}
                      <a href="#" className="text-brand-700 hover:text-brand-800 underline underline-offset-2">
                        LGPD
                      </a>{' '}
                      para fins de tratamento medico
                    </span>
                  </label>
                </div>

                {/* Erro de submit */}
                {errorMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 p-3 rounded bg-error-50 border border-error-100"
                  >
                    <AlertCircle size={14} strokeWidth={2} className="text-error-600 mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="text-xs text-error-700">{errorMsg}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={loading}
                  disabled={!form.acceptTerms || !form.acceptLgpd}
                  onClick={handleSubmit}
                >
                  Criar conta
                </Button>
              </div>
            </Card>
          )}

          {/* Links de rodape */}
          <p className="mt-6 text-center text-sm text-surface-600">
            Ja tem conta?{' '}
            <Link
              href="/login"
              className="text-brand-700 font-medium hover:text-brand-800 transition-colors duration-150"
            >
              Entrar
            </Link>
          </p>
          <p className="mt-1.5 text-center text-sm text-surface-500">
            E medico?{' '}
            <Link
              href="/seja-medico"
              className="text-sage-700 font-medium hover:text-sage-800 transition-colors duration-150"
            >
              Credencie-se aqui
            </Link>
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Coluna direita — hero visual (oculto em mobile, ~55% desktop)      */}
      {/* ------------------------------------------------------------------ */}
      {/* Recalibração premium: bg-surface-900 (preto editorial), tipografia editorial dominante. */}
      <div className="hidden lg:flex flex-1 bg-surface-900 flex-col justify-between px-20 py-24 relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 -right-32 text-[20rem] font-heading font-extrabold text-white/[0.02] leading-none tracking-tighter select-none">
          W
        </div>

        <div className="relative">
          <p className="text-overline text-brand-400 uppercase tracking-widest font-semibold">
            Cadastro gratuito
          </p>
        </div>

        <div className="max-w-lg relative">
          <h2 className="font-heading font-extrabold text-white tracking-[-0.04em] leading-[0.95] text-5xl xl:text-6xl text-balance">
            Em um minuto,<br />
            <span className="text-brand-400">você está dentro.</span>
          </h2>
          <p className="mt-8 text-body-lg text-white/60 leading-relaxed max-w-md">
            Cadastro gratuito. Diagnóstico inicial sem custo. Médico em até 48 horas.
            Tratamento sério, sem julgamento, do começo ao fim.
          </p>
        </div>

        <div className="relative pt-12 border-t border-white/10 max-w-md">
          <p className="text-body text-white/80 leading-relaxed italic">
            &ldquo;A consulta por vídeo foi incrível. O médico realmente me ouviu.&rdquo;
          </p>
          <p className="mt-2 text-caption text-white/40 uppercase tracking-widest font-semibold">
            Ana L. — paciente
          </p>
        </div>
      </div>
    </div>
  )
}
