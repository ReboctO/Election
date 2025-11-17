'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '../../../components/navigation'
import toast from 'react-hot-toast'
import { createCandidate, updateCandidate, deactivateCandidate } from '../../../lib/admin/action.candidates'

const INITIAL_FORM = { 
  posID: '', 
  voterID: '', 
  candName: '', 
  candMname: '', 
  candLname: '', 
  candPlatform: '', 
  candStat: 'Active' 
}

function useCandidateForm(initialCandidates) {
  const router = useRouter()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(INITIAL_FORM)
  }

  const openModal = (cand = null) => {
    setEditing(cand)
    setForm(cand ? { 
      posID: cand.posID.toString(), 
      voterID: cand.voterID?.toString() || '', 
      candName: cand.candName,
      candMname: cand.candMname || '',
      candLname: cand.candLname,
      candPlatform: cand.candPlatform || '',
      candStat: cand.candStat
    } : INITIAL_FORM)
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    startTransition(async () => {
      const result = editing 
        ? await updateCandidate({ ...form, candID: editing.candID })
        : await createCandidate(form)

      if (result.success) {
        toast.success(editing ? 'Updated!' : 'Added!')
        setCandidates(prev => editing
          ? prev.map(c => c.candID === editing.candID ? { ...c, ...form, posID: +form.posID, voterID: form.voterID ? +form.voterID : null } : c)
          : [...prev, result.data]
        )
        closeModal()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed')
      }
    })
  }

  const handleDeactivate = (candID) => {
    if (!confirm('Deactivate this candidate?')) return
    
    startTransition(async () => {
      const prev = [...candidates]
      setCandidates(c => c.map(cand => cand.candID === candID ? { ...cand, candStat: 'Inactive' } : cand))
      
      const result = await deactivateCandidate(candID)
      if (result.success) {
        toast.success('Deactivated')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed')
        setCandidates(prev)
      }
    })
  }

  return { candidates, isPending, showModal, editing, form, setForm, openModal, closeModal, handleSubmit, handleDeactivate }
}

export default function CandidatesClient({ initialCandidates }) {
  const { data: session } = useSession()
  const { candidates, isPending, showModal, editing, form, setForm, openModal, closeModal, handleSubmit, handleDeactivate } = useCandidateForm(initialCandidates)

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation session={session} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Candidate Management</h1>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isPending}
          >
            + Add Candidate
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Full Name', 'Position ID', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No candidates found. Add one to get started!
                  </td>
                </tr>
              ) : (
                candidates.map(cand => (
                  <tr key={cand.candID} className={isPending ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">{cand.candID}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {`${cand.candName} ${cand.candMname || ''} ${cand.candLname}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{cand.posID}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        cand.candStat === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cand.candStat}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => openModal(cand)}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        disabled={isPending}
                      >
                        Edit
                      </button>
                      {cand.candStat === 'Active' && (
                        <button
                          onClick={() => handleDeactivate(cand.candID)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          disabled={isPending}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Candidate</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Position ID</label>
                <input
                  type="number"
                  min={1}
                  value={form.posID}
                  onChange={(e) => setForm({...form, posID: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Voter ID (Optional)</label>
                <input
                  type="number"
                  min={1}
                  value={form.voterID}
                  onChange={(e) => setForm({...form, voterID: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={form.candName}
                  onChange={(e) => setForm({...form, candName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Middle Name (Optional)</label>
                <input
                  type="text"
                  value={form.candMname}
                  onChange={(e) => setForm({...form, candMname: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={form.candLname}
                  onChange={(e) => setForm({...form, candLname: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Platform (Optional)</label>
                <textarea
                  value={form.candPlatform}
                  onChange={(e) => setForm({...form, candPlatform: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={form.candStat}
                  onChange={(e) => setForm({...form, candStat: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isPending}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  disabled={isPending}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}