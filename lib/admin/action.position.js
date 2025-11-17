'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '../prisma'

const positionSchema = z.object({
  posName: z.string().min(1),
  numofPositions: z.coerce.number().int().positive(),
  posStatus: z.string().default('Open')
})

async function handleError(fn, shouldRevalidate = false) {
  try {
    const data = await fn()
    if (shouldRevalidate) revalidatePath('/admin/positions')
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, error: error.message || 'Operation failed' }
  }
}

export async function getPositions() {
  return handleError(() => prisma.position.findMany({ orderBy: { posID: 'asc' } }))
}

export async function createPosition(input) {
  return handleError(async () => {
    const data = positionSchema.parse(input)
    return prisma.position.create({ data })
  }, true)
}

export async function updatePosition({ posID, ...input }) {
  return handleError(async () => {
    const data = positionSchema.parse(input)
    return prisma.position.update({ where: { posID }, data })
  }, true)
}

export async function deactivatePosition(posID) {
  return handleError(() => 
    prisma.position.update({ where: { posID }, data: { posStatus: 'Closed' } })
  , true)
}