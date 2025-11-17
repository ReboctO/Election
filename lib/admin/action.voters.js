'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'

const voterSchema = z.object({
  voterFname: z.string().min(1, 'First name is required'),
  voterLname: z.string().min(1, 'Last name is required'),
  voterMname: z.string().optional(),
  voterPass: z.string().min(5, 'Password must be at least 5 characters'),
  voterStat: z.string().default('Active'),
  voted: z.string().default('N')
})

const createVoterSchema = voterSchema.extend({
  voterPass: z.string().min(5, 'Password must be at least 5 characters')
})

const updateVoterSchema = z.object({
  voterFname: z.string().min(1, 'First name is required').optional(),
  voterLname: z.string().min(1, 'Last name is required').optional(),
  voterMname: z.string().optional(),
  voterPass: z.string().min(5, 'Password must be at least 5 characters').optional(),
  voterStat: z.string().optional(),
  voted: z.string().optional()
})

async function handleError(fn, shouldRevalidate = false) {
  try {
    const data = await fn()
    if (shouldRevalidate) revalidatePath('/admin/voters')
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, error: error.message || 'Operation failed' }
  }
}

export async function getVoters() {
  return handleError(() => 
    prisma.voter.findMany({ 
      orderBy: { voterID: 'asc' },
      select: {
        voterID: true,
        voterFname: true,
        voterLname: true,
        voterMname: true,
        voterStat: true,
        voted: true,
        createdAt: true,
        updatedAt: true
        // Exclude password from selection
      }
    })
  )
}

export async function getVoterById(voterID) {
  return handleError(() =>
    prisma.voter.findUnique({
      where: { voterID },
      select: {
        voterID: true,
        voterFname: true,
        voterLname: true,
        voterMname: true,
        voterStat: true,
        voted: true,
        createdAt: true,
        updatedAt: true
      }
    })
  )
}

export async function createVoter(input) {
  return handleError(async () => {
    // Validate input
    const validatedData = createVoterSchema.parse(input)
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.voterPass, 12)
    
    // Create voter with hashed password
    return prisma.voter.create({
      data: {
        ...validatedData,
        voterPass: hashedPassword
      },
      select: {
        voterID: true,
        voterFname: true,
        voterLname: true,
        voterMname: true,
        voterStat: true,
        voted: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }, true)
}

export async function updateVoter({ voterID, ...input }) {
  return handleError(async () => {
    // Validate input
    const validatedData = updateVoterSchema.parse(input)
    
    // If password is being updated, hash it
    const dataToUpdate = { ...validatedData }
    if (validatedData.voterPass) {
      dataToUpdate.voterPass = await bcrypt.hash(validatedData.voterPass, 12)
    }
    
    return prisma.voter.update({
      where: { voterID },
      data: dataToUpdate,
      select: {
        voterID: true,
        voterFname: true,
        voterLname: true,
        voterMname: true,
        voterStat: true,
        voted: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }, true)
}

export async function deactivateVoter(voterID) {
  return handleError(() =>
    prisma.voter.update({
      where: { voterID },
      data: { voterStat: 'Inactive' },
      select: {
        voterID: true,
        voterFname: true,
        voterLname: true,
        voterMname: true,
        voterStat: true,
        voted: true
      }
    })
  , true)
}

export async function activateVoter(voterID) {
  return handleError(() =>
    prisma.voter.update({
      where: { voterID },
      data: { voterStat: 'Active' },
      select: {
        voterID: true,
        voterFname: true,
        voterLname: true,
        voterMname: true,
        voterStat: true,
        voted: true
      }
    })
  , true)
}

export async function deleteVoter(voterID) {
  return handleError(() =>
    prisma.voter.delete({
      where: { voterID }
    })
  , true)
}