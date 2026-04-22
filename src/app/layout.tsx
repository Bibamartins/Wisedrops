import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'WiseDrops | Cannabis Medicinal com Medicos Prescritores',
  description:
    'Plataforma completa de cannabis medicinal. Da consulta medica ao acompanhamento do tratamento. Medicos certificados, receita digital, produtos com aprovacao ANVISA.',
  applicationName: 'WiseDrops',
  keywords: [
    'cannabis medicinal',
    'CBD',
    'THC',
    'consulta medica',
    'prescricao cannabis',
    'ANVISA',
    'tratamento cannabis',
    'oleo CBD',
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WiseDrops',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'WiseDrops | Cannabis Medicinal com Medicos Prescritores',
    description: 'Da consulta ao acompanhamento. Sua jornada completa de cannabis medicinal.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F97316',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
