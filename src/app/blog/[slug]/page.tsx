import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, getPostSlugs, formatPostDate } from '@/lib/blog'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug)
  if (!post) return { title: 'Artigo não encontrado | WiseDrops' }
  return {
    title: `${post.title} | Blog WiseDrops`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date || undefined,
      authors: [post.author],
    },
    alternates: { canonical: `/blog/${post.slug}` },
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'WiseDrops',
    },
    inLanguage: 'pt-BR',
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-surface-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-heading font-bold text-xl text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>
          <Link href="/blog" className="text-sm font-medium text-sage-700 hover:text-sage-800 transition">
            ← Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-surface-900 leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-surface-400 mb-8 pb-8 border-b border-surface-200">
          <span className="font-medium text-surface-600">{post.author}</span>
          {post.date && <><span>·</span><span>{formatPostDate(post.date)}</span></>}
          <span>·</span>
          <span>{post.readingMinutes} min de leitura</span>
        </div>

        <div
          className="prose prose-surface max-w-none prose-headings:font-heading prose-headings:text-surface-900 prose-a:text-brand-600 prose-strong:text-surface-900 prose-blockquote:border-l-sage-400 prose-blockquote:bg-sage-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-surface-600"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* CTA */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-sage-500 to-sage-700 text-white text-center">
          <h2 className="text-xl font-heading font-bold mb-2">Fale com um médico</h2>
          <p className="text-white/80 mb-6 text-sm max-w-md mx-auto">
            Agende uma consulta por vídeo e tire suas dúvidas com um especialista.
          </p>
          <Link
            href="/register"
            className="inline-block px-7 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand-900/20"
          >
            Cadastre-se Gratis
          </Link>
        </div>
      </article>
    </div>
  )
}
