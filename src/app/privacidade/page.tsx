import Link from 'next/link'

export const metadata = {
  title: 'Política de Privacidade · WiseDrops',
  description: 'Como a WiseDrops trata os dados pessoais e clínicos dos usuários.',
}

export default function PrivacidadePage() {
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
        <p className="text-overline text-brand-700 mb-3 uppercase tracking-widest font-semibold">Documento legal</p>
        <h1 className="font-heading font-bold text-4xl text-surface-900 tracking-tight mb-4">Política de Privacidade</h1>
        <p className="text-surface-500 mb-12">Última atualização: 24 de junho de 2026</p>

        <div className="prose prose-surface max-w-none space-y-8 text-body text-surface-700 leading-relaxed">
          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">Resumo em uma frase</h2>
            <p>
              Coletamos só o necessário para te atender clinicamente; tratamos dados de saúde com sigilo médico; você tem direito
              de acessar, corrigir e excluir seus dados; cumprimos a LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">1. Quais dados coletamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cadastrais</strong>: nome, e-mail, CPF, telefone, data de nascimento</li>
              <li><strong>Clínicos</strong>: respostas do quiz, condições, alergias, medicações, prescrições e histórico de consultas</li>
              <li><strong>Operacionais</strong>: cookies de sessão, IP, dispositivo</li>
              <li><strong>Financeiros</strong>: dados de pagamento processados via gateway externo (não armazenamos cartão)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">2. Bases legais (LGPD)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados clínicos</strong>: tutela da saúde por profissional de saúde (art. 11, §2º, II) e/ou consentimento específico</li>
              <li><strong>Dados cadastrais</strong>: execução de contrato (art. 7º, V) e legítimo interesse (art. 7º, IX)</li>
              <li><strong>Marketing</strong>: consentimento revogável a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">3. Com quem compartilhamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Médicos prescritores</strong>: apenas para fins clínicos da sua consulta</li>
              <li><strong>Operadores técnicos</strong>: provedores de e-mail (Resend), pagamento (PayPal), videochamada (Daily.co), banco de dados (Supabase) — todos com DPA</li>
              <li><strong>CRM</strong>: HubSpot recebe somente dados generalizados (categoria de foco, status do funil), nunca dados clínicos brutos</li>
              <li><strong>ANVISA</strong>: para autorização de produtos quando aplicável</li>
            </ul>
            <p className="mt-3"><strong>Não vendemos dados.</strong></p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">4. Por quanto tempo guardamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prontuário médico</strong>: 20 anos (CFM Resolução 1.821/2007)</li>
              <li><strong>Dados de pagamento</strong>: 5 anos (legislação fiscal)</li>
              <li><strong>Dados cadastrais</strong>: enquanto sua conta estiver ativa + 5 anos após exclusão (legislação consumerista)</li>
              <li><strong>Cookies</strong>: até 12 meses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">5. Seus direitos</h2>
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Acesso aos seus dados</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Anonimização ou exclusão (respeitada a retenção legal de prontuário)</li>
              <li>Portabilidade dos dados</li>
              <li>Revogação do consentimento</li>
              <li>Informação sobre compartilhamento</li>
            </ul>
            <p className="mt-3">
              Solicite via: <a href="mailto:dpo@wisedrops.com.br" className="text-brand-700 underline">dpo@wisedrops.com.br</a>
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">6. Segurança</h2>
            <p>
              Aplicamos criptografia em trânsito (HTTPS/TLS) e em repouso (PostgreSQL). Controle de acesso por papel (paciente,
              médico, admin). Logs de auditoria. Em caso de incidente, notificaremos a ANPD em até 72 horas conforme exigido.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">7. Encarregado de Dados (DPO)</h2>
            <p>
              <strong>E-mail</strong>: <a href="mailto:dpo@wisedrops.com.br" className="text-brand-700 underline">dpo@wisedrops.com.br</a><br />
              <strong>WhatsApp</strong>: <a href="https://wa.me/5519929318700" className="text-brand-700 underline">+55 19 92931-8700</a>
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">8. Atualizações</h2>
            <p>
              Esta política pode ser atualizada. Mudanças relevantes serão notificadas por e-mail. A data acima reflete a versão atual.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
