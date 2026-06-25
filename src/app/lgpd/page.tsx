import Link from 'next/link'

export const metadata = {
  title: 'LGPD · WiseDrops',
  description: 'Conformidade com a Lei Geral de Proteção de Dados.',
}

export default function LgpdPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-heading font-bold text-lg text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-surface-600 hover:text-brand-600 transition">
            ← Voltar ao início
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-overline text-brand-700 mb-3 uppercase tracking-widest font-semibold">Conformidade</p>
        <h1 className="font-heading font-bold text-4xl text-surface-900 tracking-tight mb-4">LGPD</h1>
        <p className="text-body-lg text-surface-600 mb-12">
          Como a WiseDrops cumpre a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>

        <div className="space-y-8 text-body text-surface-700 leading-relaxed">
          <section className="p-6 rounded-2xl bg-sage-50 border border-sage-200">
            <h2 className="text-h3 font-heading font-semibold text-sage-800 mb-3">Resumo</h2>
            <p>
              Dados de saúde são <strong>dado pessoal sensível</strong> conforme art. 11 da LGPD. Aplicamos cuidados extras:
              base legal específica, controle de acesso por papel, criptografia, logs de auditoria, e DPO disponível para
              atender suas solicitações.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">Princípios que seguimos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Finalidade</strong>: dados coletados só para fins clínicos e operacionais declarados</li>
              <li><strong>Adequação</strong>: tratamento compatível com a finalidade</li>
              <li><strong>Necessidade</strong>: limitação ao mínimo necessário</li>
              <li><strong>Transparência</strong>: informação clara sobre quais dados, como e por que</li>
              <li><strong>Segurança</strong>: criptografia em trânsito e repouso, controle de acesso</li>
              <li><strong>Não discriminação</strong>: dados clínicos não são usados para discriminação</li>
              <li><strong>Responsabilização</strong>: governança ativa de privacidade</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">Bases legais por tipo de tratamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-2 pr-4 font-semibold text-surface-900">Dado</th>
                    <th className="text-left py-2 font-semibold text-surface-900">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  <tr>
                    <td className="py-3 pr-4">Prontuário, prescrição</td>
                    <td className="py-3">Art. 11, §2º, II (tutela da saúde)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Cadastro</td>
                    <td className="py-3">Art. 7º, V (execução de contrato)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Marketing</td>
                    <td className="py-3">Art. 7º, I (consentimento)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Logs e auditoria</td>
                    <td className="py-3">Art. 7º, IX (legítimo interesse)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">Seus direitos como titular</h2>
            <p>Você pode exercer todos os direitos do art. 18 da LGPD:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Confirmar a existência de tratamento</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados</li>
              <li>Anonimizar, bloquear ou eliminar (respeitada retenção legal de prontuário: 20 anos pelo CFM)</li>
              <li>Portabilidade</li>
              <li>Eliminar dados tratados com consentimento</li>
              <li>Saber com quem compartilhamos</li>
              <li>Revogar consentimento</li>
              <li>Reclamar à ANPD</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">Encarregado de Dados (DPO)</h2>
            <div className="p-6 rounded-xl bg-surface-50 border border-surface-200">
              <p>
                Para exercer seus direitos ou tirar dúvidas sobre privacidade:<br /><br />
                <strong>E-mail</strong>: <a href="mailto:dpo@wisedrops.com.br" className="text-brand-700 underline">dpo@wisedrops.com.br</a><br />
                <strong>WhatsApp</strong>: <a href="https://wa.me/14073835692" className="text-brand-700 underline">+1 (407) 383-5692</a><br /><br />
                Respondemos em até <strong>15 dias úteis</strong> conforme exigência legal.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">Incidentes de segurança</h2>
            <p>
              Em caso de incidente de segurança que possa acarretar risco relevante aos seus direitos, notificaremos você e a
              <strong> ANPD em até 72 horas</strong>, conforme art. 48 da LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">Documentação complementar</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><Link href="/termos" className="text-brand-700 underline">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="text-brand-700 underline">Política de Privacidade</Link></li>
              <li><a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">Autoridade Nacional de Proteção de Dados (ANPD)</a></li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
