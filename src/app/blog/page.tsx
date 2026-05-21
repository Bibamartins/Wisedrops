import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts, formatPostDate } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog | WiseDrops — Cannabis Medicinal',
  description:
    'Conteúdo educativo sobre cannabis medicinal: regulação, tratamento, acesso e acompanhamento. Informação confiável, com revisão médica.',
  openGraph: {
    title: 'Blog WiseDrops — Cannabis Medicinal',
    description:
      'Conteúdo educativo sobre cannabis medicinal: regulação, tratamento, acesso e acompanhamento.',
    type: 'website',
  },
}

function BlogHeader() {
  return (
    <header className="border-b border-surface-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-heading font-bold text-xl text-surface-900">
            Wise<span className="text-brand-600">Drops</span>
          </span>
        </Link>
        <Link
          href="/register"
          className="text-sm font-medium px-4 py-2 rounded-lg gradient-brand text-white hover:opacity-90 transition"
        >
          Comecar Agora
        </Link>
      </div>
    </header>
  )
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-white">
      <BlogHeader />

      {/* Hero */}
      <section className="bg-sage-50 px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 text-sage-700 text-sm font-medium mb-4">
            Blog WiseDrops
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-surface-900 mb-3">
            Cannabis medicinal, explicada de forma simples
          </h1>
          <p className="text-lg text-surface-500 max-w-2xl">
            Conteúdo educativo sobre regulação, tratamento e acesso — com base em evidências e revisão médica.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <p className="text-surface-500">Em breve, novos conteúdos.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col p-6 rounded-2xl border border-surface-200 hover:border-sage-400 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-sage-100 text-sage-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-surface-900 group-hover:text-brand-600 transition mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-surface-500 leading-relaxed flex-1">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-surface-400">
                    <span>{formatPostDate(post.date)}</span>
                    <span>·</span>
                    <span>{post.readingMinutes} min de leitura</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-sage-500 to-sage-700 text-white text-center">
            <h2 className="text-2xl font-heading font-bold mb-3">
              Quer falar com um médico?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Agende uma consulta por vídeo com um médico especializado em cannabis medicinal.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand-900/20"
            >
              Cadastre-se Gratis
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
