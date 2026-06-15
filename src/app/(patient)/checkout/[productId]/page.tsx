'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'

interface AddressForm {
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const productQuery = trpc.product.getById.useQuery({ id: productId })
  const prescriptionsQuery = trpc.prescription.listForPatient.useQuery({ page: 1, limit: 50 })
  const createOrder = trpc.order.create.useMutation()
  const paypalMutation = trpc.payment.createOrderPaypalCheckout.useMutation()

  const [prescriptionId, setPrescriptionId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [address, setAddress] = useState<AddressForm>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  const product = productQuery.data
  const prescriptions = prescriptionsQuery.data?.prescriptions ?? []

  const validPrescriptions = useMemo(() => {
    // Mostrar prescrições com type compatível e ainda vigentes
    return prescriptions.filter((p) => {
      const valid = new Date(p.validUntil).getTime() > Date.now()
      return valid
    })
  }, [prescriptions])

  const subtotal = product ? product.priceCents * quantity : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!product) return
    if (!prescriptionId) {
      setError('Selecione uma prescrição.')
      return
    }
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.zipCode) {
      setError('Preencha o endereço completo.')
      return
    }
    setProcessing(true)
    try {
      const order = await createOrder.mutateAsync({
        prescriptionId,
        items: [{ productId: product.id, quantity }],
        shippingAddress: {
          street: address.street,
          number: address.number,
          complement: address.complement || undefined,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state.toUpperCase(),
          zipCode: address.zipCode.replace(/\D/g, ''),
        },
        notes: notes || undefined,
      })
      const checkout = await paypalMutation.mutateAsync({ orderId: order.id })
      window.location.href = checkout.approveUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar o pedido.')
      setProcessing(false)
    }
  }

  if (productQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
        Produto não encontrado.{' '}
        <Link href="/products" className="underline">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-surface-900">Finalizar pedido</h1>
        <Link href="/products" className="text-sm text-surface-500 hover:text-surface-700">
          ← Voltar
        </Link>
      </div>

      {/* Produto */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <h2 className="font-heading font-semibold text-surface-900 mb-3">Produto</h2>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-medium text-surface-900">{product.name}</p>
            <p className="text-xs text-surface-500">{product.manufacturer}</p>
            <p className="text-xs text-surface-500 mt-0.5">
              {product.concentration} · {product.form}
            </p>
          </div>
          <p className="text-lg font-heading font-bold text-surface-900">
            R$ {(product.priceCents / 100).toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-surface-700">Quantidade:</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="w-20 px-3 py-1.5 rounded-lg border border-surface-200 text-sm"
          />
        </div>
      </div>

      {/* Prescrição */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <h2 className="font-heading font-semibold text-surface-900 mb-3">Prescrição</h2>
        {validPrescriptions.length === 0 ? (
          <div className="p-3 rounded-xl bg-warning-50 border border-warning-600/30 text-sm text-warning-700">
            Você não tem prescrição vigente. Marque uma consulta com um médico e obtenha uma
            prescrição antes de comprar.
          </div>
        ) : (
          <select
            value={prescriptionId}
            onChange={(e) => setPrescriptionId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          >
            <option value="">Selecione...</option>
            {validPrescriptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.prescriptionType} · Dr(a). {p.doctor.user.fullName} · válida até{' '}
                {new Date(p.validUntil).toLocaleDateString('pt-BR')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Endereço */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-3">
        <h2 className="font-heading font-semibold text-surface-900">Endereço de entrega</h2>
        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="CEP"
            value={address.zipCode}
            onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm col-span-1"
          />
          <input
            placeholder="UF"
            maxLength={2}
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm col-span-1"
          />
          <input
            placeholder="Cidade"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm col-span-1"
          />
        </div>
        <input
          placeholder="Rua"
          value={address.street}
          onChange={(e) => setAddress({ ...address, street: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm"
        />
        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="Número"
            value={address.number}
            onChange={(e) => setAddress({ ...address, number: e.target.value })}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
          />
          <input
            placeholder="Complemento (opcional)"
            value={address.complement}
            onChange={(e) => setAddress({ ...address, complement: e.target.value })}
            className="px-3 py-2 rounded-lg border border-surface-200 text-sm col-span-2"
          />
        </div>
        <input
          placeholder="Bairro"
          value={address.neighborhood}
          onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm"
        />
      </div>

      {/* Observações */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <h2 className="font-heading font-semibold text-surface-900 mb-3">
          Observações (opcional)
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ex.: Entregar no horário comercial."
          className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm resize-none"
        />
      </div>

      {/* Total + ação */}
      <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-surface-600">Subtotal</span>
          <span className="text-sm text-surface-900">
            R$ {(subtotal / 100).toFixed(2).replace('.', ',')}
          </span>
        </div>
        <p className="text-xs text-surface-500">
          O frete será calculado no momento do envio. Você paga com cartão de crédito ou conta
          PayPal — não precisa de conta para pagar com cartão.
        </p>
        {error && (
          <div className="p-3 rounded-xl bg-error-50 border border-error-600/30 text-sm text-error-600">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={processing || validPrescriptions.length === 0}
          className="w-full py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {processing ? 'Redirecionando para o PayPal...' : 'Pagar com PayPal'}
        </button>
      </div>
    </form>
  )
}
