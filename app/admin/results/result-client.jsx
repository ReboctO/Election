'use client'

import { useSession } from 'next-auth/react'
import Navigation from '../../../components/navigation'

export default function ResultsPage({ initialResult }) {
  const { data: session } = useSession()
  const results = initialResult || []

  const getWinners = (position) => {
    if (!position.candidates || position.candidates.length === 0) return []
    return [...position.candidates].sort((a, b) => b.votes - a.votes).slice(0, position.numofPositions).map(c => c.candID)
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navigation session={session} />
      <main className="container mt-2">
        <div className="mb-4">
          <h1 className="display-5 fw-bold">Election Results</h1>
          <p className="text-muted">Real-time voting results and statistics</p>
        </div>
        {!results || results.length === 0 ? (
          <div className="card shadow-sm text-center py-5">
            <div className="display-1 mb-3">📊</div>
            <h2 className="h3 fw-bold mb-2">No Results Available</h2>
            <p className="text-muted">No votes have been cast yet or election hasn't started.</p>
          </div>
        ) : (
          <div className="row g-4">
            {results.map(position => {
              const winnerIds = getWinners(position)
              return (
                <div key={position.posID} className="col-12">
                  <div className="card shadow-sm">
                    <div className="card-header bg-primary text-white">
                      <h2 className="h4 mb-1">{position.posName}</h2>
                      <small>Total Votes: {position.totalVotes || 0} | Positions: {position.numofPositions}</small>
                    </div>
                    <div className="card-body p-0">
                      {!position.candidates || position.candidates.length === 0 ? (
                        <p className="text-muted text-center py-4">No candidates for this position</p>
                      ) : (
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>{['Rank', 'Candidate', 'Votes', '%', 'Visual'].map(h => <th key={h} className="text-uppercase small fw-semibold">{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {position.candidates.map((cand, idx) => {
                              const isWinner = winnerIds.includes(cand.candID) && cand.votes > 0
                              return (
                                <tr key={cand.candID} className={isWinner ? 'table-success border-start border-success border-3' : ''}>
                                  <td className="fw-bold">#{idx + 1}</td>
                                  <td className="fw-semibold">
                                    {cand.fullName}
                                  </td>
                                  <td className="fs-5 fw-bold">{cand.votes || 0}</td>
                                  <td className="small fw-medium">{cand.percentage}%</td>
                                  <td>
                                    <div className="progress" style={{ height: '1rem' }}>
                                      <div className="progress-bar bg-primary" style={{ width: `${Math.min(cand.percentage, 100)}%` }}></div>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}