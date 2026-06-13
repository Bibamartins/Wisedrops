'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    if (!result || result.error) {
      setLoading(false)
      setErrorMsg('Email ou senha invalidos.')
      return
    }

    // Fetch session to read role for redirect
    const session = await getSession()
    setLoading(false)

    const role = session?.user?.role
    if (role === 'DOCTOR') {
      router.push('/doctor-dashboard')
    } else if (role === 'ADMIN') {
      router.push('/admin-dashboard')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>
            <span className="font-heading font-bold text-2xl text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </div>

          <h1 className="text-3xl font-heading font-bold text-surface-900 mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-surface-500 mb-8">
            Entre na sua conta para continuar seu tratamento
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-surface-700">Senha</label>
                <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">
                  Esqueceu?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {errorMsg}
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              Não tem conta?{' '}
              <Link href="/register" className="text-brand-600 font-medium hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/seja-medico"
              className="block w-full text-center py-3 rounded-xl border-2 border-dashed border-surface-200 text-surface-500 text-sm hover:border-sage-400 hover:text-sage-700 transition"
            >
              Sou médico — credenciar-se na plataforma
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center gradient-brand p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-heading font-bold mb-6">
            Seu tratamento, acompanhado de perto
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎥</span>
              <div>
                <p className="font-semibold">Consulta por Video</p>
                <p className="text-sm text-white/70">Atendimento humanizado, nao chat automatizado</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-semibold">Acompanhamento Real</p>
                <p className="text-sm text-white/70">Prontuario eletronico e monitoramento de aderencia</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🇧🇷</span>
              <div>
                <p className="font-semibold">Produtos Nacionais + Importados</p>
                <p className="text-sm text-white/70">RDC 327 e RDC 660 — mais opcoes para voce</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
