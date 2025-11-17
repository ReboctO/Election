'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '../prisma'

const candidateSchema = z.object({
  posID: z.coerce.number().int().positive(),
  voterID: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : val,
    z.coerce.number().int().positive().nullable()
  ),
  candName: z.string().min(1),
  candMname: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().nullable()
  ),
  candLname: z.string().min(1),
  candPlatform: z.preprocess(
    (val) => val === '' ? null : val,
    z.string().nullable()
  ),
  candStat: z.string().default('Active')
})

async function handleError(fn, shouldRevalidate = false) {
  try {
    const data = await fn()
    if (shouldRevalidate) revalidatePath('/admin/candidates')
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, error: error.message || 'Operation failed' }
  }
}

export async function getCandidates() {
  return handleError(() => prisma.candidate.findMany({ orderBy: { candID: 'asc' } }))
}

export async function createCandidate(input) {
  return handleError(async () => {
    const data = candidateSchema.parse(input)
    return prisma.candidate.create({ data })
  }, true)
}

export async function updateCandidate({ candID, ...input }) {
  return handleError(async () => {
    const data = candidateSchema.parse(input)
    return prisma.candidate.update({ where: { candID }, data })
  }, true)
}

export async function deactivateCandidate(candID) {
  return handleError(() => 
    prisma.candidate.update({ where: { candID }, data: { candStat: 'Inactive' } })
  , true)
}