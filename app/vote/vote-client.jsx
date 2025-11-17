'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/navigation'
import toast from 'react-hot-toast';
import { getBallot, submitVotes } from '../../lib/admin/action.voting';

export default function VotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [selectedVotes, setSelectedVotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.voterID) {
      fetchBallot();
    }
  }, [status, session, router]);

  const fetchBallot = async () => {
    if (!session?.user?.voterID) return;
    
    try {
      const result = await getBallot(session.user.voterID);
      
      if (result.success) {
        setPositions(result.data.positions || []);
        setHasVoted(result.data.hasVoted);
        
        if (result.data.hasVoted) {
          toast.error('You have already voted!');
        }
      } else {
        toast.error(result.error || 'Failed to fetch ballot');
      }
    } catch (error) {
      toast.error('Failed to fetch ballot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteChange = (posID, candID, numofPositions) => {
    setSelectedVotes(prev => {
      const currentVotes = prev[posID] || [];
      
      if (currentVotes.includes(candID)) {
        return {
          ...prev,
          [posID]: currentVotes.filter(id => id !== candID)
        };
      } else {
        if (currentVotes.length >= numofPositions) {
          toast.error(`You can only select up to ${numofPositions} candidate(s) for this position`);
          return prev;
        }
        return {
          ...prev,
          [posID]: [...currentVotes, candID]
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (hasVoted) {
      toast.error('You have already voted!');
      return;
    }

    const votes = [];
    Object.entries(selectedVotes).forEach(([posID, candIDs]) => {
      candIDs.forEach(candID => {
        votes.push({
          posID: parseInt(posID),
          candidateID: parseInt(candID)
        });
      });
    });

    if (votes.length === 0) {
      toast.error('Please select at least one candidate');
      return;
    }

    // Validate that all positions with votes have the correct number of selections
    for (const position of positions) {
      const positionVotes = selectedVotes[position.posID] || [];
      if (positionVotes.length > 0 && positionVotes.length > position.numofPositions) {
        toast.error(`You cannot vote for more than ${position.numofPositions} candidate(s) for ${position.posName}`);
        return;
      }
    }

    if (!confirm('Are you sure you want to submit your votes? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitVotes({
        voterID: session.user.voterID,
        votes
      });

      if (result.success) {
        toast.success('Votes submitted successfully!');
        setHasVoted(true);
        setSelectedVotes({});
        await fetchBallot();
      } else {
        toast.error(result.error || 'Failed to submit votes');
      }
    } catch (error) {
      toast.error('An error occurred while submitting votes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalSelections = () => {
    return Object.values(selectedVotes).reduce((sum, arr) => sum + arr.length, 0);
  };

  const getPositionSelections = (posID) => {
    return selectedVotes[posID]?.length || 0;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation session={session} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cast Your Vote</h1>
          <p className="text-gray-600">
            Voter: <span className="font-semibold">{session.user.name}</span> (ID: {session.user.voterID})
          </p>
          {hasVoted && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-semibold">✅ You have already voted. Thank you for participating!</p>
            </div>
          )}
        </div>

        {!hasVoted && positions.length > 0 ? (
          <>
            {positions.map((position) => (
              <div key={position.posID} className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="mb-4 pb-3 border-b">
                  <h2 className="text-2xl font-bold text-gray-800">{position.posName}</h2>
                  <p className="text-sm text-gray-600">
                    Select up to {position.numofPositions} candidate{position.numofPositions > 1 ? 's' : ''}
                    <span className="ml-2 font-semibold text-blue-600">
                      ({getPositionSelections(position.posID)}/{position.numofPositions} selected)
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  {position.candidates.map((candidate) => {
                    const isSelected = selectedVotes[position.posID]?.includes(candidate.candID);
                    return (
                      <div
                        key={candidate.candID}
                        onClick={() => handleVoteChange(position.posID, candidate.candID, position.numofPositions)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <span className="text-white text-sm">✓</span>}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {candidate.candName} {candidate.candMname} {candidate.candLname}
                            </h3>
                            {candidate.candPlatform && (
                              <p className="text-sm text-gray-600 mt-1">{candidate.candPlatform}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-lg shadow-lg p-6 sticky bottom-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || getTotalSelections() === 0}
                className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit All Votes'}
              </button>
              <p className="text-sm text-gray-600 text-center mt-2">
                Total selections: {getTotalSelections()}
              </p>
            </div>
          </>
        ) : hasVoted ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You for Voting!</h2>
            <p className="text-gray-600">Your vote has been recorded successfully.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Open Elections</h2>
            <p className="text-gray-600">There are currently no open positions for voting.</p>
          </div>
        )}
      </main>
    </div>
  );
}