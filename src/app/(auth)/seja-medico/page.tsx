'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const SPECIALTIES = [
  'Clinica Medica', 'Neurologia', 'Psiquiatria', 'Medicina da Dor', 'Geriatria',
  'Pediatria', 'Oncologia', 'Reumatologia', 'Anestesiologia', 'Medicina de Familia', 'Outra',
]

export default function SejaMedicoPage() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', cpf: '',
    crm: '', crmState: '', specialty: [] as string[], bio: '',
    password: '', confirmPassword: '', acceptTerms: false,
  })

  const registerDoctor = trpc.auth.registerDoctor.useMutation()

  const toggleSpecialty = (s: string) =>
    setForm((p) => ({
      ...p,
      specialty: p.specialty.includes(s)
        ? p.specialty.filter((x) => x !== s)
        : [...p.specialty, s],
    }))

  const handleSubmit = async () => {
    setErrorMsg('')
    if (form.password.length < 8) return setErrorMsg('A senha deve ter pelo menos 8 caracteres.')
    if (form.password !== form.confirmPassword) return setErrorMsg('As senhas nao coincidem.')
    if (form.specialty.length === 0) return setErrorMsg('Selecione ao menos uma especialidade.')
    if (!form.crmState) return setErrorMsg('Selecione a UF do seu CRM.')

    setLoading(true)
    try {
      await registerDoctor.mutateAsync({
        email: form.email.toLowerCase().trim(),
        password: form.password,
        fullName: form.fullName,
        cpf: form.cpf.replace(/\D/g, ''),
        phone: form.phone.replace(/\D/g, ''),
        crm: form.crm.trim(),
        crmState: form.crmState,
        specialty: form.specialty,
        bio: form.bio || undefined,
      })
      setDone(true)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar cadastro.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-surface-200 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-sage-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-heading font-bold text-surface-900 mb-2">Cadastro recebido!</h1>
          <p className="text-sm text-surface-500 mb-6">
            Seu cadastro foi enviado para <strong>análise da nossa equipe</strong>. Vamos verificar
            seu CRM e te avisar por e-mail quando sua conta for aprovada. Isso costuma levar até 48h úteis.
          </p>
          <Link href="/login" className="inline-block px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition'

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <span className="text-white font-bold">W</span>
          </div>
          <span className="font-heading font-bold text-2xl text-surface-900">
            Wise<span className="text-brand-600">Drops</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-surface-200">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 text-sage-700 text-xs font-medium mb-3">
            Para médicos
          </span>
          <h1 className="text-2xl font-heading font-bold text-surface-900 mb-1">
            Credencie-se na WiseDrops
          </h1>
          <p className="text-surface-500 mb-6 text-sm">
            Atenda pacientes de cannabis medicinal por vídeo. Verificamos seu CRM antes de ativar a conta.
          </p>

          {/* Dados pessoais */}
          <h2 className="text-sm font-semibold text-surface-700 mb-3">Dados pessoais</h2>
          <div className="space-y-4 mb-6">
            <input className={inputCls} placeholder="Nome completo" value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
            <input className={inputCls} type="email" placeholder="E-mail profissional" value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <input className={inputCls} placeholder="Telefone" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className={inputCls} placeholder="CPF" value={form.cpf}
                onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))} />
            </div>
          </div>

          {/* Dados profissionais */}
          <h2 className="text-sm font-semibold text-surface-700 mb-3">Dados profissionais</h2>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <input className={`${inputCls} col-span-2`} placeholder="Número do CRM" value={form.crm}
                onChange={(e) => setForm((p) => ({ ...p, crm: e.target.value }))} />
              <select className={inputCls} value={form.crmState}
                onChange={(e) => setForm((p) => ({ ...p, crmState: e.target.value }))}>
                <option value="">UF</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Especialidade(s)</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      form.specialty.includes(s)
                        ? 'bg-sage-100 border-sage-400 text-sage-700'
                        : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Mini bio (opcional) — sua experiência com cannabis medicinal"
              value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
          </div>

          {/* Senha */}
          <h2 className="text-sm font-semibold text-surface-700 mb-3">Acesso</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input className={inputCls} type="password" placeholder="Senha" value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              <input className={inputCls} type="password" placeholder="Confirmar senha" value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.acceptTerms}
                onChange={(e) => setForm((p) => ({ ...p, acceptTerms: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-sm text-surface-600">
                Declaro que as informações são verdadeiras e aceito os{' '}
                <a href="#" className="text-brand-600 underline">Termos</a> e a{' '}
                <a href="#" className="text-brand-600 underline">Política de Privacidade</a>
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !form.acceptTerms}
            className="w-full mt-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar cadastro para análise'}
          </button>
        </div>

        <div className="mt-6 text-center space-y-1">
          <p className="text-sm text-surface-400">
            Já tem conta?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Entrar</Link>
          </p>
          <p className="text-sm text-surface-400">
            É paciente?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:underline">Cadastre-se aqui</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
