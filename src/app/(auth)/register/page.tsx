'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

const CONDITION_OPTIONS = [
  'Dor Cronica', 'Insonia', 'Ansiedade', 'Depressao',
  'Epilepsia', 'Autismo', 'Fibromialgia', 'Enxaqueca',
  'Parkinson', 'Oncologia', 'Outra condicao',
]

const EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'Nunca usei cannabis medicinal' },
  { value: 'unsupervised', label: 'Ja usei sem acompanhamento medico' },
  { value: 'supervised', label: 'Uso com acompanhamento medico' },
  { value: 'prefer_not_to_say', label: 'Prefiro nao dizer' },
]

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

    // Basic validation
    if (form.password.length < 8) {
      setErrorMsg('A senha deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg('As senhas nao coincidem.')
      setLoading(false)
      return
    }

    // Strip non-digits from CPF (server expects exactly 11 digits)
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

      // Auto-login after registration
      const signInResult = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      })

      setLoading(false)

      if (!signInResult || signInResult.error) {
        setErrorMsg('Conta criada, mas falha ao fazer login. Tente entrar manualmente.')
        router.push('/login')
        return
      }

      // Success: redirect to quiz
      router.push('/quiz')
      router.refresh()
    } catch (err: unknown) {
      setLoading(false)
      const message = err instanceof Error ? err.message : 'Erro ao criar conta.'
      setErrorMsg(message)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <span className="text-white font-bold">W</span>
          </div>
          <span className="font-heading font-bold text-2xl text-surface-900">
            Wise<span className="text-brand-600">Drops</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? 'gradient-brand' : 'bg-surface-200'
                }`}
              />
              <p className="text-[10px] text-surface-400 mt-1">
                {s === 1 ? 'Avaliacao' : s === 2 ? 'Dados Pessoais' : 'Criar Conta'}
              </p>
            </div>
          ))}
        </div>

        {/* Step 1: Assessment */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-surface-200">
            <h2 className="text-2xl font-heading font-bold text-surface-900 mb-2">
              Vamos comecar
            </h2>
            <p className="text-surface-500 mb-6">
              Conte-nos sobre voce para conectar ao medico ideal
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-3">
                  Quais condicoes voce quer tratar?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCondition(c)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition text-left ${
                        form.conditions.includes(c)
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-3">
                  O tratamento e para quem?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Para mim', 'Para meu filho(a)', 'Para familiar', 'Para outra pessoa'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, patientFor: opt }))}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                        form.patientFor === opt
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-3">
                  Sua experiencia com cannabis medicinal
                </label>
                <div className="space-y-2">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, experience: opt.value }))}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition text-left ${
                        form.experience === opt.value
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={form.conditions.length === 0}
              className="w-full mt-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Personal Data */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-surface-200">
            <h2 className="text-2xl font-heading font-bold text-surface-900 mb-2">
              Seus dados
            </h2>
            <p className="text-surface-500 mb-6">
              Protegidos pela LGPD — usados apenas para seu tratamento
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="seu@email.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">CPF</label>
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Data de Nascimento</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Genero</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
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
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-surface-200 text-surface-600 font-semibold hover:bg-surface-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Create Account */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-surface-200">
            <h2 className="text-2xl font-heading font-bold text-surface-900 mb-2">
              Crie sua conta
            </h2>
            <p className="text-surface-500 mb-6">
              Ultimo passo — escolha uma senha segura
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Senha</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="Minimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirmar Senha</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="Repita a senha"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={(e) => setForm((p) => ({ ...p, acceptTerms: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-surface-600">
                    Li e aceito os{' '}
                    <a href="#" className="text-brand-600 underline">Termos de Uso</a> e{' '}
                    <a href="#" className="text-brand-600 underline">Politica de Privacidade</a>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptLgpd}
                    onChange={(e) => setForm((p) => ({ ...p, acceptLgpd: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-surface-600">
                    Autorizo o tratamento dos meus dados pessoais e de saude conforme a{' '}
                    <a href="#" className="text-brand-600 underline">LGPD</a> para fins de tratamento medico
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-surface-200 text-surface-600 font-semibold hover:bg-surface-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.acceptTerms || !form.acceptLgpd}
                className="flex-1 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Conta e Comecar'}
              </button>
            </div>
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-surface-400">
            Ja tem conta?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Entrar
            </Link>
          </p>
          <p className="text-sm text-surface-400 mt-1">
            É médico?{' '}
            <Link href="/seja-medico" className="text-sage-700 font-medium hover:underline">
              Credencie-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
