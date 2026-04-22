/**
 * Database Seed Script
 *
 * Populates the database with sample data for development.
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient, UserRole, ProductOrigin, ProductCategory, DoctorVerificationStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding WiseDrops database...')

  // Generate real bcrypt hash for the default password "senha123"
  const DEFAULT_HASH = await bcrypt.hash('senha123', 12)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wisedrops.com.br' },
    update: {},
    create: {
      email: 'admin@wisedrops.com.br',
      passwordHash: DEFAULT_HASH, // placeholder hash for "senha123"
      role: UserRole.ADMIN,
      fullName: 'Administrador WiseDrops',
      cpf: '00000000000',
      phone: '11999999999',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })
  console.log('Admin created:', admin.email)

  // Create sample patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'maria@teste.com' },
    update: {},
    create: {
      email: 'maria@teste.com',
      passwordHash: DEFAULT_HASH,
      role: UserRole.PATIENT,
      fullName: 'Maria Silva',
      cpf: '12345678900',
      phone: '11999876543',
      status: 'ACTIVE',
      emailVerified: new Date(),
      patient: {
        create: {
          dateOfBirth: new Date('1988-05-14'),
          gender: 'FEMALE',
          address: {
            street: 'Rua das Flores',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Jardim Paulista',
            city: 'Sao Paulo',
            state: 'SP',
            zipCode: '01401-000',
          },
          primaryConditions: ['G43.9', 'F41.1'], // Migraine, GAD
          currentMedications: [],
          allergies: [],
          onboardingCompleted: true,
        },
      },
    },
  })
  console.log('Patient created:', patientUser.fullName)

  // Create sample doctors
  const doctors = [
    {
      email: 'dr.carlos@wisedrops.com.br',
      fullName: 'Dr. Carlos Oliveira',
      cpf: '11111111111',
      phone: '11988888888',
      crm: '123456',
      crmState: 'SP',
      specialty: ['Neurologia', 'Cannabis Medicinal'],
      bio: 'Neurologista com 15 anos de experiencia. Especialista em tratamento de dor cronica e disturbios do sono com cannabis medicinal.',
    },
    {
      email: 'dra.ana@wisedrops.com.br',
      fullName: 'Dra. Ana Beatriz Costa',
      cpf: '22222222222',
      phone: '11977777777',
      crm: '654321',
      crmState: 'SP',
      specialty: ['Psiquiatria', 'Cannabis Medicinal'],
      bio: 'Psiquiatra especializada em transtornos de ansiedade e depressao. Pioneira no uso de cannabis medicinal em saude mental.',
    },
    {
      email: 'dr.felipe@wisedrops.com.br',
      fullName: 'Dr. Felipe Santos',
      cpf: '33333333333',
      phone: '21966666666',
      crm: '789012',
      crmState: 'RJ',
      specialty: ['Clinica Medica', 'Dor Cronica', 'Cannabis Medicinal'],
      bio: 'Clinico geral com foco em manejo de dor cronica e fibromialgia.',
    },
  ]

  for (const doc of doctors) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        passwordHash: DEFAULT_HASH,
        role: UserRole.DOCTOR,
        fullName: doc.fullName,
        cpf: doc.cpf,
        phone: doc.phone,
        status: 'ACTIVE',
        emailVerified: new Date(),
        doctor: {
          create: {
            crm: doc.crm,
            crmState: doc.crmState,
            specialty: doc.specialty,
            bio: doc.bio,
            consultationPriceCents: 8900,
            verificationStatus: DoctorVerificationStatus.APPROVED,
            isAcceptingPatients: true,
            averageRating: 4.8 + Math.random() * 0.2,
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
                { dayOfWeek: 1, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 30 },
                { dayOfWeek: 2, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
                { dayOfWeek: 2, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 30 },
                { dayOfWeek: 3, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
                { dayOfWeek: 4, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 },
                { dayOfWeek: 4, startTime: '14:00', endTime: '18:00', slotDurationMinutes: 30 },
                { dayOfWeek: 5, startTime: '08:00', endTime: '16:00', slotDurationMinutes: 30 },
              ],
            },
          },
        },
      },
    })
    console.log('Doctor created:', user.fullName)
  }

  // Create sample products (idempotent via count check)
  const existingProducts = await prisma.product.count()
  if (existingProducts === 0) {
    const products = [
      {
        name: 'CBD Full Spectrum Oil 30mg/mL',
        manufacturer: 'Prati-Donaduzzi',
        origin: ProductOrigin.DOMESTIC,
        category: ProductCategory.OIL,
        thcContent: 0.0,
        cbdContent: 30.0,
        form: 'Oleo Full Spectrum',
        concentration: '30mg/mL CBD',
        volume: '30mL',
        description: 'Oleo de CBD full spectrum produzido no Brasil. Registro ANVISA ativo. Ideal para tratamento de ansiedade, insonia e dor cronica.',
        priceCents: 29900,
        anvisaRegistration: 'ANVISA-RDC327-001',
        rdcClassification: 'RDC327',
        requiresPrescriptionType: 'TYPE_B' as const,
        isAvailable: true,
        stockQuantity: 100,
        imageUrls: ['/products/cbd-full-spectrum-30.jpg'],
      },
      {
        name: 'CBD Isolate Capsules 25mg',
        manufacturer: 'Prati-Donaduzzi',
        origin: ProductOrigin.DOMESTIC,
        category: ProductCategory.CAPSULE,
        thcContent: 0.0,
        cbdContent: 25.0,
        form: 'Capsulas de CBD Isolado',
        concentration: '25mg CBD por capsula',
        volume: '60 capsulas',
        description: 'Capsulas de CBD isolado. Facil dosagem, sem sabor. Produzido no Brasil com registro ANVISA.',
        priceCents: 24900,
        anvisaRegistration: 'ANVISA-RDC327-002',
        rdcClassification: 'RDC327',
        requiresPrescriptionType: 'SIMPLE' as const,
        isAvailable: true,
        stockQuantity: 80,
        imageUrls: ['/products/cbd-capsules-25.jpg'],
      },
      {
        name: 'THC:CBD 1:1 Oil 10mg/mL',
        manufacturer: 'CbdMD',
        origin: ProductOrigin.IMPORTED,
        category: ProductCategory.OIL,
        thcContent: 10.0,
        cbdContent: 10.0,
        form: 'Oleo Full Spectrum THC:CBD',
        concentration: '10mg/mL THC + 10mg/mL CBD',
        volume: '30mL',
        description: 'Oleo com proporcao 1:1 THC:CBD. Importado dos EUA. Indicado para dor cronica severa e espasticidade.',
        priceCents: 49900,
        rdcClassification: 'RDC660',
        requiresPrescriptionType: 'TYPE_A' as const,
        isAvailable: true,
        stockQuantity: 50,
        imageUrls: ['/products/thc-cbd-1-1.jpg'],
      },
      {
        name: 'CBD Sleep Gummies 50mg',
        manufacturer: 'CbdMD',
        origin: ProductOrigin.IMPORTED,
        category: ProductCategory.GUMMY,
        thcContent: 0.1,
        cbdContent: 50.0,
        form: 'Gomas de CBD para Sono',
        concentration: '50mg CBD + 2mg Melatonina',
        volume: '30 gomas',
        description: 'Gomas de CBD com melatonina para auxilio do sono. Sabor frutas vermelhas. Importadas dos EUA.',
        priceCents: 34900,
        rdcClassification: 'RDC660',
        requiresPrescriptionType: 'TYPE_B' as const,
        isAvailable: true,
        stockQuantity: 60,
        imageUrls: ['/products/cbd-gummies-sleep.jpg'],
      },
      {
        name: 'CBD Topical Roll-On 500mg',
        manufacturer: 'CbdMD',
        origin: ProductOrigin.IMPORTED,
        category: ProductCategory.TOPICAL,
        thcContent: 0.0,
        cbdContent: 500.0,
        form: 'Roll-on topico de CBD',
        concentration: '500mg CBD total',
        volume: '60mL',
        description: 'Roll-on para aplicacao topica em areas de dor localizada. Mentol e arnica para efeito imediato.',
        priceCents: 19900,
        rdcClassification: 'RDC660',
        requiresPrescriptionType: 'TYPE_B' as const,
        isAvailable: true,
        stockQuantity: 40,
        imageUrls: ['/products/cbd-roll-on.jpg'],
      },
      {
        name: 'CBD Broad Spectrum Spray 15mg',
        manufacturer: 'Verdemed',
        origin: ProductOrigin.DOMESTIC,
        category: ProductCategory.SPRAY,
        thcContent: 0.0,
        cbdContent: 15.0,
        form: 'Spray oral Broad Spectrum',
        concentration: '15mg/dose',
        volume: '30mL (200 doses)',
        description: 'Spray oral de CBD broad spectrum. Absorcao rapida sublingual. Fabricado no Brasil.',
        priceCents: 22900,
        anvisaRegistration: 'ANVISA-RDC327-003',
        rdcClassification: 'RDC327',
        requiresPrescriptionType: 'TYPE_B' as const,
        isAvailable: true,
        stockQuantity: 70,
        imageUrls: ['/products/cbd-spray-15.jpg'],
      },
    ]

    await prisma.product.createMany({
      data: products,
    })
    console.log(`${products.length} products created`)
  } else {
    console.log(`Products already exist (${existingProducts}), skipping`)
  }

  console.log('')
  console.log('Seed completed successfully!')
  console.log('  Patient: maria@teste.com')
  console.log('  Doctors: dr.carlos@wisedrops.com.br, dra.ana@wisedrops.com.br, dr.felipe@wisedrops.com.br')
  console.log('  Admin: admin@wisedrops.com.br')
  console.log('  All passwords: "senha123" (dev only - using placeholder hash)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
