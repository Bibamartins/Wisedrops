import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  author: string
  authorCrm?: string
  tags: string[]
  cover?: string
  readingMinutes: number
}

export interface Post extends PostMeta {
  html: string
}

function readPostFile(slug: string) {
  const fullPath = path.join(BLOG_DIR, `${slug}.md`)
  return matter(fs.readFileSync(fullPath, 'utf8'))
}

function toMeta(slug: string, data: Record<string, unknown>, content: string): PostMeta {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return {
    slug,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? '',
    date: (data.date as string) ?? '',
    author: (data.author as string) ?? 'Equipe WiseDrops',
    authorCrm: data.authorCrm as string | undefined,
    tags: (data.tags as string[]) ?? [],
    cover: data.cover as string | undefined,
    readingMinutes: Math.max(1, Math.round(words / 200)),
  }
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
}

export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => {
      const { data, content } = readPostFile(slug)
      return toMeta(slug, data, content)
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPost(slug: string): Post | null {
  try {
    const { data, content } = readPostFile(slug)
    const html = marked.parse(content) as string
    return { ...toMeta(slug, data, content), html }
  } catch {
    return null
  }
}

export function formatPostDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
