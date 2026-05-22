// Rota temporária de diagnóstico: mostra quais variáveis de banco existem no
// RUNTIME (sem expor credenciais). Remover depois.
export const dynamic = 'force-dynamic'

function host(url?: string): string {
  if (!url) return ''
  return (url.split('@')[1] || '').split('/')[0].split('?')[0]
}

export async function GET() {
  const netlify = process.env.NETLIFY_DATABASE_URL
  const database = process.env.DATABASE_URL
  return Response.json({
    NETLIFY_DATABASE_URL: !!netlify,
    NETLIFY_DATABASE_URL_UNPOOLED: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
    DATABASE_URL: !!database,
    netlifyHost: host(netlify),
    databaseHost: host(database),
  })
}
