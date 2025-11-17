'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '../prisma'

async function handleError(fn, shouldRevalidate = false) {
  try {
    const data = await fn()
    if (shouldRevalidate) revalidatePath('/results')
    return { success: true, data }
  } catch (error) {
    console.error(error)
    return { success: false, error: error.message || 'Operation failed' }
  }
}

export async function getElectionResults() {
  return handleError(async () => {
    const positions = await prisma.position.findMany({
      where: { posStatus: 'Open' },
      orderBy: { posID: 'asc' },
      include: {
        candidates: {
          where: { candStat: 'Active' },
          include: { _count: { select: { votes: true } } }
        },
        _count: { select: { votes: true } }
      }
    })

    return positions.map(position => {
      const totalVotes = position._count.votes
      const candidates = position.candidates
        .map(c => ({
          candID: c.candID,
          fullName: `${c.candName} ${c.candMname || ''} ${c.candLname}`.trim(),
          votes: c._count.votes,
          percentage: totalVotes > 0 ? parseFloat(((c._count.votes / totalVotes) * 100).toFixed(2)) : 0
        }))
        .sort((a, b) => b.votes - a.votes)

      return {
        posID: position.posID,
        posName: position.posName,
        numofPositions: position.numofPositions,
        totalVotes,
        candidates
      }
    })
  })
}

export async function getElectionWinners() {
  return handleError(async () => {
    const positions = await prisma.position.findMany({
      where: { posStatus: 'Open' },
      orderBy: { posID: 'asc' },
      include: {
        candidates: {
          where: { candStat: 'Active' },
          include: { _count: { select: { votes: true } } }
        }
      }
    })

    return positions.map(p => ({
      position: p.posName,
      numWinners: p.numofPositions,
      winners: p.candidates
        .map(c => ({
          candID: c.candID,
          fullName: `${c.candName} ${c.candMname || ''} ${c.candLname}`.trim(),
          votes: c._count.votes
        }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, p.numofPositions)
    }))
  })
}

export async function getVotingStatistics() {
  return handleError(async () => {
    const [totalVoters, votedVoters, totalPositions, totalCandidates] = await Promise.all([
      prisma.voter.count(),
      prisma.voter.count({ where: { voted: 'Y' } }),
      prisma.position.count({ where: { posStatus: 'Open' } }),
      prisma.candidate.count({ where: { candStat: 'Active' } })
    ])

    const votingPercentage = totalVoters > 0 ? parseFloat(((votedVoters / totalVoters) * 100).toFixed(2)) : 0

    return {
      totalVoters,
      votedVoters,
      abstainedVoters: totalVoters - votedVoters,
      votingPercentage,
      totalPositions,
      totalCandidates
    }
  })
}