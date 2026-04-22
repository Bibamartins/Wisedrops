'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js'
import { cn, formatCurrency } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Stripe client (singleton)
// ---------------------------------------------------------------------------

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethodId = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

interface InstallmentOption {
  installments: number
  installmentAmountCents: number
  totalAmountCents: number
  interestRate: number
  label: string
}

interface PaymentMethodOption {
  id: PaymentMethodId
  label: string
  description: string
  discount: number
  discountedAmountCents: number
  installmentOptions?: InstallmentOption[]
}

interface PaymentResult {
  paymentId: string
  stripePaymentIntentId: string
  clientSecret: string
  status: string
  pixCode?: string | null
  pixQrCodeUrl?: string | null
  boletoUrl?: string | null
  boletoPdf?: string | null
  boletoExpiresAt?: string | null
}

interface CheckoutFormProps {
  /** Total amount in cents before discounts */
  amountCents: number
  /** Payment purpose label shown to user */
  purposeLabel: string
  /** Available payment methods (from getPaymentMethods query) */
  paymentMethods: PaymentMethodOption[]
  /** Called when user selects method + installments and clicks "Pagar" */
  onCreatePayment: (params: {
    method: PaymentMethodId
    installments: number
  }) => Promise<PaymentResult>
  /** Called when payment completes successfully */
  onPaymentSuccess: (paymentId: string) => void
  /** Called on unrecoverable error */
  onPaymentError?: (error: string) => void
  /** Optional CSS class */
  className?: string
}

// ---------------------------------------------------------------------------
// Main Checkout Form (orchestrator)
// ---------------------------------------------------------------------------

export function CheckoutForm({
  amountCents,
  purposeLabel,
  paymentMethods,
  onCreatePayment,
  onPaymentSuccess,
  onPaymentError,
  className,
}: CheckoutFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null)
  const [selectedInstallments, setSelectedInstallments] = useState(1)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedOption = paymentMethods.find((m) => m.id === selectedMethod)

  // Reset installments when switching method
  useEffect(() => {
    setSelectedInstallments(1)
    setPaymentResult(null)
    setError(null)
  }, [selectedMethod])

  const handleCreatePayment = useCallback(async () => {
    if (!selectedMethod) return

    setIsCreating(true)
    setError(null)

    try {
      const result = await onCreatePayment({
        method: selectedMethod,
        installments: selectedInstallments,
      })
      setPaymentResult(result)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar pagamento'
      setError(message)
      onPaymentError?.(message)
    } finally {
      setIsCreating(false)
    }
  }, [selectedMethod, selectedInstallments, onCreatePayment, onPaymentError])

  // Compute displayed amount
  const displayAmount = selectedOption?.discountedAmountCents ?? amountCents

  return (
    <div className={cn('mx-auto max-w-lg space-y-6', className)}>
      {/* Header */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{purposeLabel}</h2>
        <p className="mt-1 text-2xl font-bold text-emerald-700">
          {formatCurrency(displayAmount)}
        </p>
        {selectedOption && selectedOption.discount > 0 && (
          <p className="mt-1 text-sm text-emerald-600">
            {selectedOption.discount}% de desconto no PIX
          </p>
        )}
      </div>

      {/* Payment method selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          Forma de pagamento
        </h3>

        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setSelectedMethod(method.id)}
            className={cn(
              'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors',
              selectedMethod === method.id
                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <PaymentMethodIcon method={method.id} />
            <div className="flex-1">
              <span className="font-medium text-gray-900">{method.label}</span>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
            {method.discount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                -{method.discount}%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Installment selector (credit card only) */}
      {selectedMethod === 'CREDIT_CARD' &&
        selectedOption?.installmentOptions &&
        selectedOption.installmentOptions.length > 1 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Parcelamento</h3>
            <select
              value={selectedInstallments}
              onChange={(e) => setSelectedInstallments(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {selectedOption.installmentOptions.map((opt) => (
                <option key={opt.installments} value={opt.installments}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create payment / show payment form */}
      {!paymentResult && selectedMethod && (
        <button
          type="button"
          onClick={handleCreatePayment}
          disabled={isCreating}
          className={cn(
            'w-full rounded-lg px-4 py-3 text-center font-medium text-white transition-colors',
            isCreating
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-emerald-600 hover:bg-emerald-700'
          )}
        >
          {isCreating ? 'Processando...' : `Pagar ${formatCurrency(displayAmount)}`}
        </button>
      )}

      {/* Render the appropriate payment UI */}
      {paymentResult && selectedMethod === 'PIX' && (
        <PixPaymentView
          paymentResult={paymentResult}
          onSuccess={() => onPaymentSuccess(paymentResult.paymentId)}
        />
      )}

      {paymentResult && selectedMethod === 'BOLETO' && (
        <BoletoPaymentView paymentResult={paymentResult} />
      )}

      {paymentResult && selectedMethod === 'CREDIT_CARD' && (
        <Elements
          stripe={stripePromise}
          options={
            {
              clientSecret: paymentResult.clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#059669',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
              },
              locale: 'pt-BR',
            } satisfies StripeElementsOptions
          }
        >
          <CreditCardForm
            paymentResult={paymentResult}
            onSuccess={() => onPaymentSuccess(paymentResult.paymentId)}
            onError={(msg) => {
              setError(msg)
              onPaymentError?.(msg)
            }}
          />
        </Elements>
      )}

      {/* Security note */}
      <p className="text-center text-xs text-gray-400">
        Pagamento processado de forma segura via Stripe. Seus dados estao
        protegidos com criptografia de ponta a ponta.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Credit Card Form (inside Elements provider)
// ---------------------------------------------------------------------------

function CreditCardForm({
  paymentResult,
  onSuccess,
  onError,
}: {
  paymentResult: PaymentResult
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setCardError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pagamento/confirmacao?payment_id=${paymentResult.paymentId}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      const message = error.message ?? 'Erro ao processar cartao'
      setCardError(message)
      onError(message)
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {cardError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {cardError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={cn(
          'w-full rounded-lg px-4 py-3 text-center font-medium text-white transition-colors',
          isProcessing || !stripe
            ? 'cursor-not-allowed bg-gray-400'
            : 'bg-emerald-600 hover:bg-emerald-700'
        )}
      >
        {isProcessing ? 'Processando pagamento...' : 'Confirmar pagamento'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// PIX Payment View
// ---------------------------------------------------------------------------

function PixPaymentView({
  paymentResult,
  onSuccess,
}: {
  paymentResult: PaymentResult
  onSuccess: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  // Poll for payment confirmation
  useEffect(() => {
    const interval = setInterval(() => {
      setPollCount((c) => c + 1)
      // In production, this would call getPaymentStatus via tRPC
      // and check if status === 'SUCCEEDED', then call onSuccess()
    }, 5000)

    return () => clearInterval(interval)
  }, [onSuccess, pollCount])

  const handleCopyCode = useCallback(async () => {
    if (!paymentResult.pixCode) return

    try {
      await navigator.clipboard.writeText(paymentResult.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback: select text in a temp textarea
      const textarea = document.createElement('textarea')
      textarea.value = paymentResult.pixCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [paymentResult.pixCode])

  return (
    <div className="space-y-4 rounded-lg border bg-white p-6 text-center">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Pague com PIX
        </h3>
        <p className="text-sm text-gray-500">
          Escaneie o QR Code ou copie o codigo abaixo
        </p>
      </div>

      {/* QR Code */}
      {paymentResult.pixQrCodeUrl && (
        <div className="flex justify-center">
          <div className="rounded-lg border-2 border-gray-100 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentResult.pixQrCodeUrl}
              alt="QR Code PIX"
              width={220}
              height={220}
              className="h-[220px] w-[220px]"
            />
          </div>
        </div>
      )}

      {/* PIX Copia e Cola */}
      {paymentResult.pixCode && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            PIX Copia e Cola
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={paymentResult.pixCode}
              className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
            />
            <button
              type="button"
              onClick={handleCopyCode}
              className={cn(
                'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              )}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Timer / status */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <LoadingSpinner />
        <span>Aguardando confirmacao do pagamento...</span>
      </div>

      <p className="text-xs text-gray-400">
        O PIX expira em 1 hora. Apos o pagamento, a confirmacao e automatica.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Boleto Payment View
// ---------------------------------------------------------------------------

function BoletoPaymentView({
  paymentResult,
}: {
  paymentResult: PaymentResult
}) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-6 text-center">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Boleto Bancario
        </h3>
        <p className="text-sm text-gray-500">
          Seu boleto foi gerado com sucesso
        </p>
      </div>

      {paymentResult.boletoExpiresAt && (
        <p className="text-sm text-amber-600">
          Vencimento:{' '}
          {new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'long',
          }).format(new Date(paymentResult.boletoExpiresAt))}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {paymentResult.boletoUrl && (
          <a
            href={paymentResult.boletoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <BoletoIcon />
            Visualizar Boleto
          </a>
        )}

        {paymentResult.boletoPdf && (
          <a
            href={paymentResult.boletoPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-4 py-3 font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            Baixar PDF
          </a>
        )}
      </div>

      <p className="text-xs text-gray-400">
        O pagamento pode levar ate 3 dias uteis para ser compensado. Voce
        recebera uma notificacao quando o pagamento for confirmado.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid extra dependencies)
// ---------------------------------------------------------------------------

function PaymentMethodIcon({ method }: { method: PaymentMethodId }) {
  switch (method) {
    case 'PIX':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-teal-700" fill="currentColor">
            <path d="M17.7 6.3c-1.2-1.2-2.8-1.9-4.5-1.9-1.7 0-3.3.7-4.5 1.9L6.3 8.7l-2-2c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l2 2-2 2c-.4.4-.4 1 0 1.4s1 .4 1.4 0l2-2 2.4 2.4c1.2 1.2 2.8 1.9 4.5 1.9 1.7 0 3.3-.7 4.5-1.9l2.4-2.4c.4-.4.4-1 0-1.4L17.7 6.3zm-1.4 7.1c-.8.8-1.9 1.3-3.1 1.3s-2.3-.5-3.1-1.3L8.7 12l1.4-1.4c.8-.8 1.9-1.3 3.1-1.3s2.3.5 3.1 1.3L17.7 12l-1.4 1.4z" />
          </svg>
        </div>
      )
    case 'CREDIT_CARD':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
      )
    case 'BOLETO':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-orange-700" fill="currentColor">
            <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h2v16h-2V4z" />
          </svg>
        </div>
      )
  }
}

function BoletoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h2v16h-2V4z" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-emerald-600"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        className="opacity-75"
      />
    </svg>
  )
}

export default CheckoutForm
