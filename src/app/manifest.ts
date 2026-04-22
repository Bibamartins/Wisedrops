import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WiseDrops',
    short_name: 'WiseDrops',
    description:
      'Cannabis medicinal com medicos prescritores. Da consulta ao acompanhamento.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#F97316',
    lang: 'pt-BR',
    categories: ['medical', 'health', 'lifestyle'],
    icons: [
      {
        src: '/icon',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
