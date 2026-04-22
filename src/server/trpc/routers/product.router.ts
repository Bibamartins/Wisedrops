import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc'
import { ProductOrigin, ProductCategory } from '@prisma/client'

export const productRouter = createTRPCRouter({
  // List products (only for authenticated users with prescription)
  list: protectedProcedure
    .input(z.object({
      origin: z.nativeEnum(ProductOrigin).optional(),
      category: z.nativeEnum(ProductCategory).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        isAvailable: true,
        ...(input.origin && { origin: input.origin }),
        ...(input.category && { category: input.category }),
        ...(input.minPrice && { priceCents: { gte: input.minPrice } }),
        ...(input.maxPrice && { priceCents: { lte: input.maxPrice } }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { manufacturer: { contains: input.search, mode: 'insensitive' as const } },
            { description: { contains: input.search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [products, total] = await Promise.all([
        ctx.db.product.findMany({
          where,
          include: { supplier: { select: { name: true } } },
          orderBy: { name: 'asc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.product.count({ where }),
      ])

      return { products, total, pages: Math.ceil(total / input.limit) }
    }),

  // Get product by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findUnique({
        where: { id: input.id },
        include: { supplier: true },
      })
    }),

  // Admin: Create product
  create: adminProcedure
    .input(z.object({
      name: z.string(),
      manufacturer: z.string(),
      origin: z.nativeEnum(ProductOrigin),
      category: z.nativeEnum(ProductCategory),
      thcContent: z.number().optional(),
      cbdContent: z.number().optional(),
      otherCannabinoids: z.record(z.number()).optional(),
      form: z.string(),
      concentration: z.string(),
      volume: z.string().optional(),
      description: z.string().optional(),
      imageUrls: z.array(z.string()).default([]),
      priceCents: z.number().int(),
      anvisaRegistration: z.string().optional(),
      rdcClassification: z.string(),
      requiresPrescriptionType: z.enum(['TYPE_A', 'TYPE_B', 'SIMPLE']),
      supplierId: z.string().uuid().optional(),
      stockQuantity: z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.create({ data: input })
    }),

  // Admin: Update product
  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().optional(),
        priceCents: z.number().int().optional(),
        isAvailable: z.boolean().optional(),
        stockQuantity: z.number().int().optional(),
        description: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.update({
        where: { id: input.id },
        data: input.data,
      })
    }),
})
