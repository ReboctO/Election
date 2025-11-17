'use client';

import { useSession } from 'next-auth/react';
import Navigation from '../../../components/navigation';

export default function ResultsPage({ initialResult }) {
  const { data: session } = useSession();
  const results = initialResult || [];
  // Helper function to get winner status
  const getWinners = (position) => {
    if (!position.candidates || position.candidates.length === 0) return [];
    
    const sortedCandidates = [...position.candidates].sort((a, b) => b.votes - a.votes);
    return sortedCandidates.slice(0, position.numofPositions).map(candidate => candidate.candID);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation session={session} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Election Results</h1>
          <p className="text-gray-600">Real-time voting results and statistics</p>
        </div>

        {!results || results.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Results Available</h2>
            <p className="text-gray-600">No votes have been cast yet or election hasn't started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((position) => {
              const winnerIds = getWinners(position);
              
              return (
                <div key={position.posID} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-blue-600 text-white px-6 py-4">
                    <h2 className="text-2xl font-bold">{position.posName}</h2>
                    <p className="text-sm opacity-90">
                      Total Votes Cast: {position.totalVotes || 0} | Positions Available: {position.numofPositions}
                    </p>
                  </div>

                  <div className="p-6">
                    {!position.candidates || position.candidates.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No candidates for this position</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Votes</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visual</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {position.candidates.map((candidate, index) => {
                              const isWinner = winnerIds.includes(candidate.candID);
                              
                              return (
                                <tr 
                                  key={candidate.candID} 
                                  className={isWinner && candidate.votes > 0 ? 'bg-green-50 border-l-4 border-green-500' : ''}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-bold text-lg text-gray-700">#{index + 1}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    {candidate.fullName}
                                    {isWinner && candidate.votes > 0 && (
                                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold">
                                    {candidate.votes || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium">
                                      {candidate.percentage}%
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                      <div
                                        className="bg-blue-600 h-4 rounded-full transition-all"
                                        style={{ 
                                          width: `${Math.min(candidate.percentage, 100)}%`
                                        }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}