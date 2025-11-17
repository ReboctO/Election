'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '../prisma'

const bulkVoteSchema = z.object({
  voterID: z.coerce.number().int().positive(),
  votes: z.array(z.object({
    posID: z.coerce.number().int().positive(),
    candidateID: z.coerce.number().int().positive()
  }))
})

async function handleError(fn, shouldRevalidate = false) {
  try {
    const data = await fn()
    if (shouldRevalidate) revalidatePath('/vote')
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, error: error.message || 'Operation failed' }
  }
}

export async function getVotes() {
  return handleError(() => prisma.vote.findMany({ orderBy: { voteID: 'asc' } }))
}

export async function getBallot(voterID) {
  return handleError(async () => {
    const voter = await prisma.voter.findUnique({ where: { voterID } })
    const positions = await prisma.position.findMany({
      where: { posStatus: 'Open' },
      include: {
        candidates: {
          where: { candStat: 'Active' }
        }
      },
      orderBy: { posID: 'asc' }
    })
    
    return {
      positions,
      hasVoted: voter?.voted === 'Y'
    }
  })
}

export async function submitVotes(input) {
  return handleError(async () => {
    const { voterID, votes } = bulkVoteSchema.parse(input)
    
    // Check if already voted
    const voter = await prisma.voter.findUnique({ where: { voterID } })
    if (voter?.voted === 'Y') {
      throw new Error('You have already voted')
    }
    
    // Validate that votes don't exceed allowed positions
    const positionVoteCounts = {}
    votes.forEach(vote => {
      positionVoteCounts[vote.posID] = (positionVoteCounts[vote.posID] || 0) + 1
    })
    
    // Check each position's vote count against numofPositions
    for (const [posID, voteCount] of Object.entries(positionVoteCounts)) {
      const position = await prisma.position.findUnique({
        where: { posID: parseInt(posID) }
      })
      
      if (voteCount > position.numofPositions) {
        throw new Error(`You cannot vote for more than ${position.numofPositions} candidate(s) for ${position.posName}`)
      }
    }
    
    // Create all votes in a transaction
    await prisma.$transaction([
      ...votes.map(vote => 
        prisma.vote.create({
          data: {
            voterID,
            candidateID: vote.candidateID,
            posID: vote.posID
          }
        })
      ),
      prisma.voter.update({
        where: { voterID },
        data: { voted: 'Y' }
      })
    ])
    
    return { message: 'Votes submitted successfully' }
  }, true)
}