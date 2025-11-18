'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '../../components/navigation'
import toast from 'react-hot-toast'
import { getBallot, submitVotes } from '../../lib/admin/action.voting'

export default function VotePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [positions, setPositions] = useState([])
  const [selectedVotes, setSelectedVotes] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated' && session?.user?.voterID) fetchBallot()
  }, [status, session, router])

  const fetchBallot = async () => {
    if (!session?.user?.voterID) return
    try {
      const result = await getBallot(session.user.voterID)
      if (result.success) {
        setPositions(result.data.positions || [])
        setHasVoted(result.data.hasVoted)
        if (result.data.hasVoted) toast.error('You have already voted!')
      } else {
        toast.error(result.error || 'Failed to fetch ballot')
      }
    } catch (error) {
      toast.error('Failed to fetch ballot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoteChange = (posID, candID, numofPositions) => {
    setSelectedVotes(prev => {
      const currentVotes = prev[posID] || []
      if (currentVotes.includes(candID)) return { ...prev, [posID]: currentVotes.filter(id => id !== candID) }
      if (currentVotes.length >= numofPositions) {
        toast.error(`You can only select up to ${numofPositions} candidate(s) for this position`)
        return prev
      }
      return { ...prev, [posID]: [...currentVotes, candID] }
    })
  }

  const handleSubmit = async () => {
    if (hasVoted) return toast.error('You have already voted!')
    const votes = []
    Object.entries(selectedVotes).forEach(([posID, candIDs]) => candIDs.forEach(candID => votes.push({ posID: parseInt(posID), candidateID: parseInt(candID) })))
    if (votes.length === 0) return toast.error('Please select at least one candidate')
    for (const position of positions) {
      const positionVotes = selectedVotes[position.posID] || []
      if (positionVotes.length > 0 && positionVotes.length > position.numofPositions) {
        return toast.error(`You cannot vote for more than ${position.numofPositions} candidate(s) for ${position.posName}`)
      }
    }
    if (!confirm('Submit your votes? This cannot be undone.')) return
    setIsSubmitting(true)
    try {
      const result = await submitVotes({ voterID: session.user.voterID, votes })
      if (result.success) {
        toast.success('Votes submitted successfully!')
        setHasVoted(true)
        setSelectedVotes({})
        await fetchBallot()
      } else {
        toast.error(result.error || 'Failed to submit votes')
      }
    } catch (error) {
      toast.error('An error occurred while submitting votes')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTotalSelections = () => Object.values(selectedVotes).reduce((sum, arr) => sum + arr.length, 0)
  const getPositionSelections = (posID) => selectedVotes[posID]?.length || 0

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center"><div className="display-1 mb-3">⏳</div><div className="h4">Loading...</div></div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-vh-100 bg-light">
      <Navigation session={session} />
      <main className="container py-4" style={{ maxWidth: '800px' }}>
        <div className="card shadow-sm mb-4 p-4">
          <h1 className="display-5 fw-bold mb-2">Cast Your Vote</h1>
          <p className="text-muted">Voter: <span className="fw-semibold">{session.user.name}</span> (ID: {session.user.voterID})</p>
          {hasVoted && <div className="alert alert-success mt-3">✅ You have already voted. Thank you for participating!</div>}
        </div>
        {!hasVoted && positions.length > 0 ? (
          <>
            {positions.map(position => (
              <div key={position.posID} className="card shadow-sm mb-4 p-4">
                <div className="mb-3 pb-3 border-bottom">
                  <h2 className="h3 fw-bold">{position.posName}</h2>
                  <small className="text-muted">
                    Select up to {position.numofPositions} candidate{position.numofPositions > 1 ? 's' : ''}
                    <span className="ms-2 fw-semibold text-primary">({getPositionSelections(position.posID)}/{position.numofPositions} selected)</span>
                  </small>
                </div>
                <div className="d-grid gap-3">
                  {position.candidates.map(cand => {
                    const isSelected = selectedVotes[position.posID]?.includes(cand.candID)
                    return (
                      <div key={cand.candID} onClick={() => handleVoteChange(position.posID, cand.candID, position.numofPositions)} 
                        className={`p-3 border rounded cursor-pointer ${isSelected ? 'border-primary border-2 bg-primary bg-opacity-10' : 'border-secondary'}`} 
                        style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center">
                          <div className={`me-3 ${isSelected ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '1.5rem' }}>
                            {isSelected ? '☑' : '☐'}
                          </div>
                          <div className="flex-fill">
                            <h5 className="mb-0">{cand.candName} {cand.candMname} {cand.candLname}</h5>
                            {cand.candPlatform && <small className="text-muted">{cand.candPlatform}</small>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="card shadow-sm p-4 sticky-bottom">
              <button onClick={handleSubmit} disabled={isSubmitting || getTotalSelections() === 0} 
                className="btn btn-success btn-lg w-100 fw-semibold">
                {isSubmitting ? 'Submitting...' : 'Submit All Votes'}
              </button>
              <p className="text-muted text-center mt-2 mb-0 small">Total selections: {getTotalSelections()}</p>
            </div>
          </>
        ) : hasVoted ? (
          <div className="card shadow-sm text-center py-5">
            <div className="display-1 mb-3">✅</div>
            <h2 className="h3 fw-bold mb-2">Thank You for Voting!</h2>
            <p className="text-muted">Your vote has been recorded successfully.</p>
          </div>
        ) : (
          <div className="card shadow-sm text-center py-5">
            <div className="display-1 mb-3">📭</div>
            <h2 className="h3 fw-bold mb-2">No Open Elections</h2>
            <p className="text-muted">There are currently no open positions for voting.</p>
          </div>
        )}
      </main>
    </div>
  )
}