// Shared product catalog - Healify products
// Source: www.healifystore.com (imported, RDC 660)
// USD prices converted to BRL at ~R$5,20/USD

export interface Product {
  id: string
  name: string
  manufacturer: string
  concentration: string
  cbdContent: string
  thcContent: string
  category: 'oleo' | 'capsula' | 'spray' | 'goma' | 'topico'
  origin: 'nacional' | 'importado'
  regulation: 'RDC 327' | 'RDC 660'
  price: number
  image: string
  inStock: boolean
  volume: string
  flavor?: string
  // Medical info (for doctor's reference)
  indications?: string[]
  typicalDosage?: string
  contraindications?: string[]
  prescriptionType?: 'A' | 'B' | 'B1' | 'C1'
  // Healify-specific
  productLine?: 'Sleep' | 'Boost + Recovery' | 'Focus' | 'Prevent' | 'Slim'
  spectrum?: 'Full Spectrum' | 'Broad Spectrum' | 'Isolate'
}

export const PRODUCTS: Product[] = [
  // ============ TINCTURES (OLEOS) ============
  {
    id: 'healify-tinc-sleep',
    name: 'Sleep Broad Spectrum Tincture',
    manufacturer: 'Healify',
    productLine: 'Sleep',
    spectrum: 'Broad Spectrum',
    concentration: '1500mg CBD + 500mg CBN',
    cbdContent: '1500mg',
    thcContent: '0mg',
    category: 'oleo',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 249.60,
    image: '/products/healify-sleep-tincture.jpg',
    inStock: true,
    volume: '30mL',
    flavor: 'Menta e Monk Fruit',
    indications: [
      'Insonia cronica',
      'Disturbios do sono',
      'Dificuldade de manutencao do sono',
      'Ansiedade noturna',
    ],
    typicalDosage: '1mL (50mg CBD + ~17mg CBN) sublingual 30-60 min antes de dormir. Iniciar com 0,5mL e titular.',
    contraindications: ['Gravidez', 'Amamentacao', 'Uso de sedativos potentes', 'Menor de 18 anos'],
    prescriptionType: 'B1',
  },
  {
    id: 'healify-tinc-prevent',
    name: 'Prevent Isolate Tincture',
    manufacturer: 'Healify',
    productLine: 'Prevent',
    spectrum: 'Isolate',
    concentration: '1500mg CBD puro',
    cbdContent: '1500mg',
    thcContent: '0mg',
    category: 'oleo',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 218.40,
    image: '/products/healify-prevent-tincture.jpg',
    inStock: true,
    volume: '30mL',
    flavor: 'Menta e Monk Fruit',
    indications: [
      'Ansiedade generalizada',
      'Estresse cronico',
      'Manutencao preventiva do bem-estar',
      'Pacientes que necessitam zero THC (exames antidoping, pediatria)',
    ],
    typicalDosage: '0,5-1mL (25-50mg CBD) sublingual 1-2x ao dia. Absorcao completa em 60-90s.',
    contraindications: ['Gravidez', 'Amamentacao', 'Hipersensibilidade ao CBD'],
    prescriptionType: 'B1',
  },
  {
    id: 'healify-tinc-slim',
    name: 'Slim Isolate Tincture',
    manufacturer: 'Healify',
    productLine: 'Slim',
    spectrum: 'Isolate',
    concentration: '900mg CBG + 150mg THCV',
    cbdContent: '0mg',
    thcContent: '0mg',
    category: 'oleo',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 322.40,
    image: '/products/healify-slim-tincture.jpg',
    inStock: true,
    volume: '30mL',
    flavor: 'Menta',
    indications: [
      'Suporte ao controle de apetite',
      'Regulacao metabolica',
      'Coadjuvante em dietas',
      'Sindrome metabolica (uso complementar)',
    ],
    typicalDosage: '0,5mL (15mg CBG + 2,5mg THCV) sublingual 2x/dia, preferencialmente pela manha e antes do almoco.',
    contraindications: ['Gravidez', 'Amamentacao', 'Transtornos alimentares', 'Hipoglicemia'],
    prescriptionType: 'B1',
  },
  {
    id: 'healify-tinc-boost',
    name: 'Boost + Recovery Full Spectrum Tincture',
    manufacturer: 'Healify',
    productLine: 'Boost + Recovery',
    spectrum: 'Full Spectrum',
    concentration: '1925mg CBD + 75mg Delta-9 THC',
    cbdContent: '1925mg',
    thcContent: '75mg',
    category: 'oleo',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 239.20,
    image: '/products/healify-boost-tincture.jpg',
    inStock: true,
    volume: '30mL',
    indications: [
      'Dor cronica musculoesqueletica',
      'Recuperacao pos-exercicio',
      'Inflamacao cronica',
      'Fibromialgia',
      'Artrite',
    ],
    typicalDosage: 'Iniciar com 0,25mL (16mg CBD + 0,6mg THC). Titular ate 1mL 1-2x/dia conforme tolerancia.',
    contraindications: ['Gravidez', 'Historico de psicose', 'Menor de 18 anos (salvo prescricao especial)', 'Direcao apos uso'],
    prescriptionType: 'A',
  },

  // ============ GUMMIES (GOMAS) ============
  {
    id: 'healify-gummy-sleep',
    name: 'Sleep Broad Spectrum Gummie',
    manufacturer: 'Healify',
    productLine: 'Sleep',
    spectrum: 'Broad Spectrum',
    concentration: '30mg CBD + 5mg CBN + 5mg Melatonina (por goma)',
    cbdContent: '900mg (30 gomas)',
    thcContent: '0mg',
    category: 'goma',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 265.20,
    image: '/products/healify-sleep-gummy.jpg',
    inStock: true,
    volume: '30 gomas (120g)',
    flavor: 'Frutas Vermelhas',
    indications: [
      'Insonia leve a moderada',
      'Latencia de sono aumentada',
      'Jet lag',
      'Pacientes que preferem forma oral/mastigavel',
    ],
    typicalDosage: '1 goma (30mg CBD + 5mg CBN + 5mg melatonina) 30-45 min antes de dormir. Max 2 gomas/noite.',
    contraindications: ['Gravidez', 'Amamentacao', 'Diabetes descompensada (contem acucar)', 'Criancas'],
    prescriptionType: 'B1',
  },
  {
    id: 'healify-gummy-boost',
    name: 'Boost + Recovery Full Spectrum Gummie',
    manufacturer: 'Healify',
    productLine: 'Boost + Recovery',
    spectrum: 'Full Spectrum',
    concentration: '25mg CBD + 5mg THC (por goma)',
    cbdContent: '750mg (30 gomas)',
    thcContent: '150mg',
    category: 'goma',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 260.00,
    image: '/products/healify-boost-gummy.jpg',
    inStock: true,
    volume: '30 gomas (120g)',
    flavor: 'Morango',
    indications: [
      'Dor cronica com preferencia por via oral',
      'Apoio a recuperacao esportiva',
      'Artrite reumatoide',
      'Sindrome dolorosa cronica',
    ],
    typicalDosage: 'Iniciar com 1/2 goma (12,5mg CBD + 2,5mg THC) para avaliar tolerancia. Titular ate 1-2 gomas/dia.',
    contraindications: ['Gravidez', 'Historico de psicose', 'Cardiopatia grave', 'Diabetes descompensada'],
    prescriptionType: 'A',
  },
  {
    id: 'healify-gummy-focus',
    name: 'Focus Broad Spectrum Gummie',
    manufacturer: 'Healify',
    productLine: 'Focus',
    spectrum: 'Broad Spectrum',
    concentration: '25mg CBG + 25mg Cafeina (por goma)',
    cbdContent: '0mg',
    thcContent: '0mg',
    category: 'goma',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 218.40,
    image: '/products/healify-focus-gummy.jpg',
    inStock: true,
    volume: '30 gomas (120g)',
    flavor: 'Citrus Laranja',
    indications: [
      'Dificuldade de foco e atencao',
      'Fadiga mental',
      'TDAH leve (uso complementar)',
      'Produtividade cognitiva',
    ],
    typicalDosage: '1 goma (25mg CBG + 25mg cafeina) pela manha. Evitar apos 16h.',
    contraindications: ['Hipertensao nao controlada', 'Ansiedade severa', 'Gravidez', 'Insonia', 'Sensibilidade a cafeina'],
    prescriptionType: 'B1',
  },

  // ============ CAPSULES / TABLETS (CAPSULAS) ============
  {
    id: 'healify-tab-focus',
    name: 'Focus Broad Spectrum Tablet',
    manufacturer: 'Healify',
    productLine: 'Focus',
    spectrum: 'Broad Spectrum',
    concentration: '30mg CBD + Vitamina B12 + Cafeina (por comprimido)',
    cbdContent: '900mg (30 comprimidos)',
    thcContent: '0mg',
    category: 'capsula',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 223.60,
    image: '/products/healify-focus-tablet.jpg',
    inStock: true,
    volume: '30 comprimidos',
    indications: [
      'Deficit de atencao',
      'Cansaco mental cronico',
      'Melhora de performance cognitiva',
      'Deficiencia de B12 com componente ansioso',
    ],
    typicalDosage: '1 comprimido (30mg CBD + B12 + cafeina) pela manha, com alimento. Max 2/dia.',
    contraindications: ['Hipertensao', 'Arritmias', 'Gravidez', 'Sensibilidade a cafeina'],
    prescriptionType: 'B1',
  },

  // ============ TOPICAL (TOPICO) ============
  {
    id: 'healify-top-boost',
    name: 'Boost + Recovery Full Spectrum Topical',
    manufacturer: 'Healify',
    productLine: 'Boost + Recovery',
    spectrum: 'Full Spectrum',
    concentration: '1800mg Hemp Distillate (Full Spectrum)',
    cbdContent: '~1600mg',
    thcContent: '<0,3%',
    category: 'topico',
    origin: 'importado',
    regulation: 'RDC 660',
    price: 265.20,
    image: '/products/healify-boost-topical.jpg',
    inStock: true,
    volume: '90g (roll-on com mentol)',
    indications: [
      'Dor muscular localizada',
      'Lesoes esportivas',
      'Artrite localizada',
      'Tendinites',
      'Dor cervical e lombar',
    ],
    typicalDosage: 'Aplicar roll-on na area afetada 2-3x ao dia. Massagear suavemente por 30s. Evitar mucosas.',
    contraindications: ['Alergia a mentol', 'Feridas abertas', 'Dermatite ativa no local', 'Criancas < 6 anos'],
    prescriptionType: 'C1',
  },
]

export const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'oleo', label: 'Tinturas' },
  { key: 'goma', label: 'Gomas' },
  { key: 'capsula', label: 'Comprimidos' },
  { key: 'topico', label: 'Topicos' },
] as const

export const PRODUCT_LINES = [
  { key: 'all', label: 'Todas as linhas' },
  { key: 'Sleep', label: '😴 Sleep', desc: 'Sono e insonia' },
  { key: 'Boost + Recovery', label: '💪 Boost + Recovery', desc: 'Dor e recuperacao' },
  { key: 'Focus', label: '🎯 Focus', desc: 'Foco e atencao' },
  { key: 'Prevent', label: '🛡️ Prevent', desc: 'Ansiedade e bem-estar' },
  { key: 'Slim', label: '⚖️ Slim', desc: 'Controle metabolico' },
] as const

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
